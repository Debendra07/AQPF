import type { Response } from "express";

import Order from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Refund } from "../models/Refund.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { createOrderService } from "../services/order.service.js";
import {
  confirmOrderReservations,
  createOrderReservations,
  createRazorpayOrder,
  ensurePaymentRecord,
  releaseOrderReservation,
  verifyRazorpaySignature,
} from "../services/payment.service.js";
import { notifyPaymentFailed, notifyPaymentSuccess, notifyRefundCreated } from "../services/notification.service.js";

export const createPaymentOrder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { items, address } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Order items are required",
      });
      return;
    }

    if (!address) {
      res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
      return;
    }

    const order = await createOrderService({
      userId: req.user.id,
      items,
      address,
      paymentMethod: "razorpay",
    });

    await createOrderReservations(
      order._id.toString(),
      req.user.id,
      order.items.map((item) => ({
        productId: item.productId.toString(),
        quantity: item.quantity,
      }))
    );

    const payment = await ensurePaymentRecord({
      orderId: order._id.toString(),
      userId: req.user.id,
      amount: order.total,
      currency: "INR",
      razorpayOrderId: "pending",
    });

    const razorpayOrder = await createRazorpayOrder({
      amount: order.total,
      currency: "INR",
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        userId: req.user.id,
      },
    });

    payment.razorpayOrderId = razorpayOrder.id;
    payment.status = "pending";
    payment.amount = order.total;
    payment.currency = "INR";
    await payment.save();

    res.status(201).json({
      success: true,
      order,
      payment,
      razorpay: {
        key: process.env.RAZORPAY_KEY_ID,
        order: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create payment order",
    });
  }
};

export const verifyPayment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      req.body ?? {};

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({
        success: false,
        message: "Payment verification payload is incomplete",
      });
      return;
    }

    const isValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      await Promise.all([
        Payment.updateOne(
          { orderId },
          { status: "failed", failureReason: "Signature verification failed" }
        ),
        Order.updateOne(
          { _id: orderId, userId: req.user.id },
          { paymentStatus: "failed" }
        ),
      ]);

      await notifyPaymentFailed({
        orderId,
        userId: req.user.id,
        message: "Payment verification failed",
      });

      res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
      return;
    }

    const payment = await Payment.findOne({
      orderId,
      userId: req.user.id,
      razorpayOrderId,
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
      return;
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.status = "paid";
    payment.verifiedAt = new Date();
    payment.method = "card";
    await payment.save();

    const order = await Order.findOneAndUpdate(
      { _id: orderId, userId: req.user.id },
      {
        paymentStatus: "paid",
        status: "confirmed",
      },
      { new: true }
    );

    await confirmOrderReservations(orderId);

    await notifyPaymentSuccess({
      orderId: order?._id.toString(),
      userId: req.user.id,
      message: "Payment completed successfully",
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
      payment,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to verify payment",
    });
  }
};

export const requestRefund = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { orderId, reason } = req.body ?? {};

    if (!orderId) {
      res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
      return;
    }

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.id,
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    const payment = await Payment.findOne({ orderId: order._id });

    if (!payment || !payment.razorpayPaymentId) {
      res.status(400).json({
        success: false,
        message: "Refund is only available for online payments",
      });
      return;
    }

    const refund = await Refund.create({
      orderId: order._id,
      paymentId: payment._id,
      razorpayPaymentId: payment.razorpayPaymentId,
      amount: order.total,
      reason: reason ?? "Customer requested refund",
      status: "requested",
    });

    await notifyRefundCreated({
      orderId: order._id.toString(),
      userId: req.user.id,
      message: "Refund requested",
    });

    res.status(201).json({
      success: true,
      refund,
    });
  } catch (error) {
    console.error("Request refund error:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to create refund request",
    });
  }
};

export const completeRefund = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== "manager") {
      res.status(403).json({
        success: false,
        message: "Manager access required",
      });
      return;
    }

    const { refundId, status } = req.body ?? {};

    if (!refundId || typeof status !== "string") {
      res.status(400).json({
        success: false,
        message: "Refund ID and status are required",
      });
      return;
    }

    const refund = await Refund.findByIdAndUpdate(
      refundId,
      { status },
      { new: true }
    );

    if (!refund) {
      res.status(404).json({
        success: false,
        message: "Refund not found",
      });
      return;
    }

    if (status === "completed") {
      await releaseOrderReservation(refund.orderId.toString());
      await Order.findByIdAndUpdate(refund.orderId, {
        status: "cancelled",
        paymentStatus: "failed",
      });
    }

    res.status(200).json({
      success: true,
      refund,
    });
  } catch (error) {
    console.error("Complete refund error:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to update refund",
    });
  }
};
