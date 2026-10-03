import mongoose from "mongoose";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import type { IProduct } from "../models/Product.js";
import type { OrderStatus } from "../models/Order.js";
import {
  createOrderService,
  getOrderQuoteService,
  toStockUnits
} from "../services/order.service.js";

const validStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled"
];

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: []
};

export const createOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    const { items, address } = req.body ?? {};
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Order items are required"
      });
      return;
    }

    if (!address) {
      res.status(400).json({
        success: false,
        message: "Delivery address is required"
      });
      return;
    }

    const order = await createOrderService({
      userId: req.user.id,
      items,
      address
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(400).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Failed to create order"
    });
  }
};

export const getOrderQuote = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    const { items } = req.body ?? {};
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Order items are required"
      });
      return;
    }

    const quote = await getOrderQuoteService(items);
    res.status(200).json({
      success: true,
      quote
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Unable to calculate order total"
    });
  }
};

export const getMyOrders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

export const getMyOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
      return;
    }

    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order"
    });
  }
};

export const getAllOrders = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const status = req.body?.status;
  if (typeof status !== "string" || !validStatuses.includes(status as OrderStatus)) {
    res.status(400).json({
      success: false,
      message: "Invalid order status"
    });
    return;
  }

  const nextStatus = status as OrderStatus;
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({
      success: false,
      message: "Invalid order ID"
    });
    return;
  }
  let session: mongoose.ClientSession | undefined;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      res.status(404).json({
        success: false,
        message: "Order not found"
      });
      return;
    }

    const nextAllowed = allowedTransitions[order.status];
    if (!nextAllowed.includes(nextStatus)) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: `Transition from ${order.status} to ${nextStatus} is not allowed`,
        allowedStatuses: nextAllowed
      });
      return;
    }

    if (nextStatus === "cancelled") {
      const productsById = new Map<string, IProduct>();
      const restoreByProductId = new Map<string, number>();

      for (const item of order.items) {
        const productId = item.productId.toString();
        let product = productsById.get(productId);
        if (!product) {
          product = await Product.findById(item.productId).session(session) ?? undefined;
          if (product) {
            productsById.set(productId, product);
          }
        }
        if (!product) {
          throw new Error(`Product not found while restoring stock: ${item.productId}`);
        }

        const restoreQuantity =
          item.stockDeducted !== undefined && item.stockUnit
            ? toStockUnits(item.stockDeducted, item.stockUnit, product.stockUnit)
            : toStockUnits(item.packageWeight, item.packageUnit, product.stockUnit) * item.quantity;
        const accumulatedRestore =
          (restoreByProductId.get(productId) ?? 0) + restoreQuantity;
        if (!Number.isFinite(accumulatedRestore)) {
          throw new Error(`Invalid stock restoration quantity for ${item.name}`);
        }
        restoreByProductId.set(productId, accumulatedRestore);
      }

      for (const [productId, restoreQuantity] of restoreByProductId) {
        const result = await Product.updateOne(
          { _id: productId },
          { $inc: { stock: restoreQuantity } },
          { session }
        );
        if (result.matchedCount !== 1) {
          throw new Error(`Product not found while restoring stock: ${productId}`);
        }
      }
    }

    order.status = nextStatus;
    if (nextStatus === "delivered" && order.paymentMethod === "cod") {
      order.paymentStatus = "paid";
    }

    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Order status updated",
      order
    });
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order"
    });
  } finally {
    await session?.endSession();
  }
};