import { Response } from "express";

import {
  createProduct as createProductService,
  getProducts as getProductsService,
  getPublicProducts as getPublicProductsService,
  getProduct as getProductService,
  getPublicProduct as getPublicProductService,
  updateProduct as updateProductService,
  disableProduct as disableProductService
} from "../services/product.service.js";

import { AuthRequest } from "../middleware/auth.middleware.js";

/**
 * ==========================================
 * CREATE PRODUCT
 * ==========================================
 */
export const createProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      category,
      description,
      packageOptions,
      stock,
      stockUnit,
      image,
      isAvailable,
      isFeatured
    } = req.body;

    // ---------------------------------------
    // Required fields
    // ---------------------------------------

    if (
      !name ||
      !category ||
      !description ||
      stock === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "Required product fields are missing"
      });

      return;
    }

    // ---------------------------------------
    // Category
    // ---------------------------------------

    if (
      !["fish", "chicken"].includes(
        category
      )
    ) {
      res.status(400).json({
        success: false,
        message:
          "Category must be fish or chicken"
      });

      return;
    }

    // ---------------------------------------
    // Package options
    // ---------------------------------------

    if (
      !Array.isArray(packageOptions) ||
      packageOptions.length === 0
    ) {
      res.status(400).json({
        success: false,
        message:
          "At least one package option is required"
      });

      return;
    }

    // ---------------------------------------
    // Service
    // ---------------------------------------

    const product =
      await createProductService({
        name,
        category,
        description,
        packageOptions,
        stock,
        stockUnit:
          stockUnit || "kg",
        image:
          image || "",
        isAvailable:
          isAvailable !== undefined
            ? isAvailable
            : true,
        isFeatured:
          isFeatured !== undefined
            ? isFeatured
            : false
      });

    res.status(201).json({
      success: true,
      message:
        "Product created successfully",
      product
    });
  } catch (error: any) {
    console.error(
      "Create product error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error?.message ||
        "Failed to create product"
    });
  }
};

/**
 * ==========================================
 * GET ALL PRODUCTS
 * ==========================================
 */
export const getProducts = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const products =
      await getProductsService();

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch products"
    });
  }
};

/**
 * ==========================================
 * GET PUBLIC PRODUCTS
 * ==========================================
 */
export const getPublicProducts = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const products =
      await getPublicProductsService();

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error(
      "Get public products error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch public products"
    });
  }
};

/**
 * ==========================================
 * GET PRODUCT BY ID
 * ==========================================
 */
export const getProductById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";

    if (!id) {
      res.status(400).json({
        success: false,
        message:
          "Product ID is required"
      });

      return;
    }

    const product =
      await getProductService(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message:
          "Product not found"
      });

      return;
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error: any) {
    console.error(
      "Get product error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error?.message ||
        "Failed to fetch product"
    });
  }
};

/**
 * ==========================================
 * UPDATE PRODUCT
 * ==========================================
 */
export const updateProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";

    if (!id) {
      res.status(400).json({
        success: false,
        message:
          "Product ID is required"
      });

      return;
    }

    const product =
      await updateProductService(
        id,
        req.body
      );

    if (!product) {
      res.status(404).json({
        success: false,
        message:
          "Product not found"
      });

      return;
    }

    res.status(200).json({
      success: true,
      message:
        "Product updated successfully",
      product
    });
  } catch (error: any) {
    console.error(
      "Update product error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error?.message ||
        "Failed to update product"
    });
  }
};

/**
 * ==========================================
 * DELETE / DISABLE PRODUCT
 * ==========================================
 */
export const deleteProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";

    if (!id) {
      res.status(400).json({
        success: false,
        message:
          "Product ID is required"
      });

      return;
    }

    const product =
      await disableProductService(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message:
          "Product not found"
      });

      return;
    }

    res.status(200).json({
      success: true,
      message:
        "Product disabled successfully",
      product
    });
  } catch (error: any) {
    console.error(
      "Disable product error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error?.message ||
        "Failed to disable product"
    });
  }
};

export const getPublicProductById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
      return;
    }

    const product = await getPublicProductService(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Get public product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch public product"
    });
  }
};