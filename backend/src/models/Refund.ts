import mongoose, { Document, Schema } from "mongoose";

export type RefundStatus =
  | "requested"
  | "processing"
  | "completed"
  | "failed";

export interface IRefund extends Document {
  orderId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  razorpayPaymentId: string;
  razorpayRefundId?: string;
  amount: number;
  reason?: string;
  status: RefundStatus;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      required: true,
      index: true,
    },

    razorpayRefundId: {
      type: String,
      sparse: true,
      unique: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        "requested",
        "processing",
        "completed",
        "failed",
      ],
      default: "requested",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Refund = mongoose.model<IRefund>(
  "Refund",
  refundSchema
);