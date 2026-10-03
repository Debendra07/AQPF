import crypto from "crypto";
import Razorpay from "razorpay";

import Order from "../models/Order.js";
import { InventoryReservation } from "../models/InventoryReservation.js";
import { Payment } from "../models/Payment.js";

interface RazorpayOrderInput {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export const getRazorpayClient = (): Razorpay => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

export const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
  notes,
}: RazorpayOrderInput): Promise<{
  id: string;
  amount: number;
  currency: string;
}> => {
  const client = getRazorpayClient();

  const razorpayOrder = await client.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency,
    receipt: receipt ?? "aqpf-order",
    notes: notes ?? {},
  });

  return {
    id: razorpayOrder.id,
    amount: Number(razorpayOrder.amount),
    currency: razorpayOrder.currency,
  };
};

export const verifyRazorpaySignature = ({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_SECRET."
    );
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const actual = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actual.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expectedBuffer);
};

export const createOrderReservations = async (
  orderId: string,
  userId: string,
  items: Array<{
    productId: string;
    quantity: number;
  }>
): Promise<void> => {
  const reservationItems = items.map((item) => ({
    orderId,
    productId: item.productId,
    quantity: item.quantity,
    status: "reserved" as const,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    userId,
  }));

  await InventoryReservation.insertMany(reservationItems);
};

export const confirmOrderReservations = async (
  orderId: string
): Promise<void> => {
  await InventoryReservation.updateMany(
    { orderId },
    {
      $set: {
        status: "confirmed",
      },
    }
  );
};

export const releaseOrderReservation = async (
  orderId: string
): Promise<void> => {
  await InventoryReservation.updateMany(
    { orderId },
    {
      $set: {
        status: "released",
      },
    }
  );
};

export const getPaymentByOrderId = async (
  orderId: string
) => Payment.findOne({ orderId });

export const ensurePaymentRecord = async ({
  orderId,
  userId,
  amount,
  currency,
  razorpayOrderId,
}: {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
}) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found for payment");
  }

  const payment = await Payment.findOneAndUpdate(
    { orderId },
    {
      orderId,
      userId,
      provider: "razorpay",
      amount,
      currency,
      razorpayOrderId,
      status: "created",
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return payment;
};
