import mongoose, { Document, Schema } from "mongoose";

export type ProductCategory = "fish" | "chicken";

export interface IPackageOption {
  weight: number;
  unit: "g" | "kg";
  price: number;
}

export interface IProduct extends Document {
  name: string;
  category: ProductCategory;
  description: string;

  packageOptions: IPackageOption[];

  stock: number;
  stockUnit: "g" | "kg";

  image: string;

  isAvailable: boolean;
  isFeatured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const packageOptionSchema = new Schema<IPackageOption>(
  {
    weight: {
      type: Number,
      required: true,
      min: 1
    },

    unit: {
      type: String,
      enum: ["g", "kg"],
      required: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    category: {
      type: String,
      enum: ["fish", "chicken"],
      required: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    packageOptions: {
      type: [packageOptionSchema],
      required: true,
      validate: {
        validator: (value: IPackageOption[]) =>
          value.length > 0,
        message: "At least one package option is required"
      }
    },

    stock: {
      type: Number,
      required: true,
      min: 0
    },

    stockUnit: {
      type: String,
      enum: ["g", "kg"],
      default: "kg"
    },

    image: {
      type: String,
      default: ""
    },

    isAvailable: {
      type: Boolean,
      default: true
    },

    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model<IProduct>(
  "Product",
  productSchema
);

export default Product;