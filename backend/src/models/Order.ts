import mongoose, {
  Document,
  Schema
} from "mongoose";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "razorpay";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  category: "fish" | "chicken";

  packageWeight: number;
  packageUnit: "g" | "kg";

  stockDeducted?: number;
  stockUnit?: "g" | "kg";

  price: number;
  quantity: number;

  image: string;
}

export interface IAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;

  items: IOrderItem[];

  address: IAddress;

  subtotal: number;
  deliveryFee: number;
  total: number;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  status: OrderStatus;

  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema =
  new Schema<IOrderItem>(
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },

      name: {
        type: String,
        required: true
      },

      category: {
        type: String,
        enum: ["fish", "chicken"],
        required: true
      },

      packageWeight: {
        type: Number,
        required: true
      },

      packageUnit: {
        type: String,
        enum: ["g", "kg"],
        required: true
      },

      stockDeducted: {
        type: Number,
        min: 0
      },

      stockUnit: {
        type: String,
        enum: ["g", "kg"]
      },

      price: {
        type: Number,
        required: true
      },

      quantity: {
        type: Number,
        required: true,
        min: 1
      },

      image: {
        type: String,
        default: ""
      }
    },
    {
      _id: false
    }
  );

const addressSchema =
  new Schema<IAddress>(
    {
      fullName: {
        type: String,
        required: true
      },

      phone: {
        type: String,
        required: true
      },

      addressLine1: {
        type: String,
        required: true
      },

      addressLine2: String,

      city: {
        type: String,
        required: true
      },

      state: {
        type: String,
        required: true
      },

      pincode: {
        type: String,
        required: true
      },

      landmark: String
    },
    {
      _id: false
    }
  );

const orderSchema =
  new Schema<IOrder>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },

      items: {
        type: [orderItemSchema],
        required: true,
        validate: {
          validator: (
            value: IOrderItem[]
          ) => value.length > 0,
          message:
            "Order must contain at least one item"
        }
      },

      address: {
        type: addressSchema,
        required: true
      },

      subtotal: {
        type: Number,
        required: true,
        min: 0
      },

      deliveryFee: {
        type: Number,
        required: true,
        min: 0
      },

      total: {
        type: Number,
        required: true,
        min: 0
      },

      paymentMethod: {
        type: String,
        enum: ["cod", "razorpay"],
        default: "cod"
      },

      paymentStatus: {
        type: String,
        enum: [
          "pending",
          "paid",
          "failed"
        ],
        default: "pending"
      },

      status: {
        type: String,
        enum: [
          "pending",
          "confirmed",
          "preparing",
          "out_for_delivery",
          "delivered",
          "cancelled"
        ],
        default: "pending"
      }
    },
    {
      timestamps: true
    }
  );

const Order = mongoose.model<IOrder>(
  "Order",
  orderSchema
);

export default Order;