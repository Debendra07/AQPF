import mongoose, { Document, Schema } from "mongoose";

export type ReservationStatus =
  | "reserved"
  | "confirmed"
  | "released"
  | "expired";

export interface IInventoryReservation extends Document {
  orderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryReservationSchema =
  new Schema<IInventoryReservation>(
    {
      orderId: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        index: true,
      },

      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 0,
      },

      status: {
        type: String,
        enum: [
          "reserved",
          "confirmed",
          "released",
          "expired",
        ],
        default: "reserved",
        required: true,
        index: true,
      },

      expiresAt: {
        type: Date,
        required: true,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

export const InventoryReservation =
  mongoose.model<IInventoryReservation>(
    "InventoryReservation",
    inventoryReservationSchema
  );