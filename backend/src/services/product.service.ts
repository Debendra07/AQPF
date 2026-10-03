import mongoose from "mongoose";
import Product from "../models/Product.js";

type ProductCategory = "fish" | "chicken";
type StockUnit = "g" | "kg";

interface PackageOptionInput {
  weight: number | string;
  unit: string;
  price: number | string;
}

interface CreateProductData {
  name: string;
  category: ProductCategory;
  description: string;
  packageOptions: PackageOptionInput[];
  stock: number | string;
  stockUnit?: StockUnit | string;
  image?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
}

interface UpdateProductData {
  name?: string;
  category?: ProductCategory;
  description?: string;
  packageOptions?: PackageOptionInput[];
  stock?: number | string;
  stockUnit?: StockUnit | string;
  image?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
}

/**
 * Normalize and validate package options.
 *
 * Example:
 * [
 *   {
 *     weight: 1,
 *     unit: "kg",
 *     price: 350
 *   }
 * ]
 */
const normalizePackageOptions = (
  packageOptions: PackageOptionInput[]
) => {
  if (!Array.isArray(packageOptions)) {
    throw new Error(
      "Package options must be an array"
    );
  }

  if (packageOptions.length === 0) {
    throw new Error(
      "At least one package option is required"
    );
  }

  const seen = new Set<string>();

  const normalized: Array<{ weight: number; unit: "g" | "kg"; price: number }> = packageOptions.map((pkg) => {
    const weight = Number(pkg.weight);
    const price = Number(pkg.price);

    const unit =
      String(pkg.unit).toLowerCase() === "kg"
        ? "kg"
        : String(pkg.unit).toLowerCase() === "g"
          ? "g"
          : "";

    if (!Number.isFinite(weight) || weight <= 0) {
      throw new Error(
        "Package weight must be greater than 0"
      );
    }

    if (!unit) {
      throw new Error(
        "Package unit must be g or kg"
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(
        "Package price must be 0 or greater"
      );
    }

    const key = `${weight}-${unit}`;

    if (seen.has(key)) {
      throw new Error(
        "Duplicate package option detected. Each weight/unit combination must be unique."
      );
    }

    seen.add(key);

    return {
      weight,
      unit,
      price
    };
  });

  return normalized;
};

/**
 * Validate stock.
 */
const normalizeStock = (
  stock: number | string
): number => {
  const value = Number(stock);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      "Stock must be a valid number greater than or equal to 0"
    );
  }

  return value;
};

/**
 * Validate stock unit.
 */
const normalizeStockUnit = (
  stockUnit?: string
): "g" | "kg" => {
  if (!stockUnit) {
    return "kg";
  }

  const unit = stockUnit.toLowerCase();

  if (unit !== "g" && unit !== "kg") {
    throw new Error(
      "Stock unit must be g or kg"
    );
  }

  return unit;
};

/**
 * GET ALL PRODUCTS
 *
 * Manager product list.
 */
export const getProducts = async () => {
  const products = await Product.find()
    .sort({
      createdAt: -1
    });

  return products;
};

/**
 * GET ONE PRODUCT
 */
export const getProduct = async (
  productId: string
) => {
  if (!mongoose.isValidObjectId(productId)) {
    return null;
  }

  const product =
    await Product.findById(productId);

  return product;
};

/**
 * GET PUBLIC PRODUCTS
 *
 * Only products that:
 * - are available
 * - have stock greater than 0
 */
export const getPublicProducts = async () => {
  const products = await Product.find({
    isAvailable: true,
    stock: {
      $gt: 0
    }
  }).sort({
    createdAt: -1
  }).select("-stock -stockUnit");

  return products;
};

export const getPublicProduct = async (
  productId: string
) => {
  if (!mongoose.isValidObjectId(productId)) {
    return null;
  }

  return Product.findOne({
    _id: productId,
    isAvailable: true,
    stock: { $gt: 0 }
  }).select("-stock -stockUnit");
};

/**
 * CREATE PRODUCT
 *
 * IMPORTANT:
 * packageOptions is explicitly saved here.
 */
export const createProduct = async (
  data: CreateProductData
) => {
  if (!data.name?.trim()) {
    throw new Error(
      "Product name is required"
    );
  }

  if (!data.category) {
    throw new Error(
      "Product category is required"
    );
  }

  if (
    data.category !== "fish" &&
    data.category !== "chicken"
  ) {
    throw new Error(
      "Category must be fish or chicken"
    );
  }

  if (!data.description?.trim()) {
    throw new Error(
      "Product description is required"
    );
  }

  const packageOptions =
    normalizePackageOptions(
      data.packageOptions
    );

  const stock =
    normalizeStock(data.stock);

  const stockUnit =
    normalizeStockUnit(data.stockUnit);

  const product =
    await Product.create({
      name: data.name.trim(),

      category: data.category,

      description:
        data.description.trim(),

      // ⭐ IMPORTANT
      packageOptions,

      stock,

      stockUnit,

      image:
        data.image?.trim() || "",

      isAvailable:
        data.isAvailable !== undefined
          ? Boolean(data.isAvailable)
          : true,

      isFeatured:
        data.isFeatured !== undefined
          ? Boolean(data.isFeatured)
          : false
    });

  return product;
};

/**
 * UPDATE PRODUCT
 *
 * Used by Manager.
 */
export const updateProduct = async (
  productId: string,
  data: UpdateProductData
) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new Error("Invalid product ID");
  }

  const updateData: Record<
    string,
    unknown
  > = {};

  // -------------------------------
  // Name
  // -------------------------------

  if (data.name !== undefined) {
    if (!data.name.trim()) {
      throw new Error(
        "Product name cannot be empty"
      );
    }

    updateData.name =
      data.name.trim();
  }

  // -------------------------------
  // Category
  // -------------------------------

  if (data.category !== undefined) {
    if (
      data.category !== "fish" &&
      data.category !== "chicken"
    ) {
      throw new Error(
        "Category must be fish or chicken"
      );
    }

    updateData.category =
      data.category;
  }

  // -------------------------------
  // Description
  // -------------------------------

  if (data.description !== undefined) {
    if (!data.description.trim()) {
      throw new Error(
        "Product description cannot be empty"
      );
    }

    updateData.description =
      data.description.trim();
  }

  // -------------------------------
  // PACKAGE OPTIONS
  // -------------------------------

  if (
    data.packageOptions !== undefined
  ) {
    updateData.packageOptions =
      normalizePackageOptions(
        data.packageOptions
      );
  }

  // -------------------------------
  // Stock
  // -------------------------------

  if (data.stock !== undefined) {
    updateData.stock =
      normalizeStock(data.stock);
  }

  // -------------------------------
  // Stock unit
  // -------------------------------

  if (
    data.stockUnit !== undefined
  ) {
    updateData.stockUnit =
      normalizeStockUnit(
        data.stockUnit
      );
  }

  // -------------------------------
  // Image
  // -------------------------------

  if (data.image !== undefined) {
    updateData.image =
      data.image?.trim() || "";
  }

  // -------------------------------
  // Availability
  // -------------------------------

  if (
    data.isAvailable !== undefined
  ) {
    updateData.isAvailable =
      Boolean(data.isAvailable);
  }

  // -------------------------------
  // Featured
  // -------------------------------

  if (
    data.isFeatured !== undefined
  ) {
    updateData.isFeatured =
      Boolean(data.isFeatured);
  }

  // -------------------------------
  // UPDATE DATABASE
  // -------------------------------

  const product =
    await Product.findByIdAndUpdate(
      productId,
      {
        $set: updateData
      },
      {
        new: true,
        runValidators: true
      }
    );

  return product;
};

/**
 * DISABLE PRODUCT
 */
export const disableProduct = async (
  productId: string
) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new Error("Invalid product ID");
  }

  const product =
    await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          isAvailable: false
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

  return product;
};

/**
 * ENABLE PRODUCT
 */
export const enableProduct = async (
  productId: string
) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new Error("Invalid product ID");
  }

  const product =
    await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          isAvailable: true
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

  return product;
};