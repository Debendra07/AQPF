import { Router } from "express";

import {
  createProduct,
  getProducts,
  getPublicProducts,
  getPublicProductById,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/product.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| PUBLIC CUSTOMER ROUTES
|--------------------------------------------------------------------------
*/

// Customers can browse available products without authentication
router.get(
  "/public/:id",
  getPublicProductById
);

router.get(
  "/public",
  getPublicProducts
);

/*
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTES
|--------------------------------------------------------------------------
*/

// Get all products
router.get(
  "/",
  authenticate,
  authorize("manager"),
  getProducts
);

// Get single product
router.get(
  "/:id",
  authenticate,
  authorize("manager"),
  getProductById
);

/*
|--------------------------------------------------------------------------
| MANAGER ONLY ROUTES
|--------------------------------------------------------------------------
*/

// Create product
router.post(
  "/",
  authenticate,
  authorize("manager"),
  createProduct
);

// Update product
router.put(
  "/:id",
  authenticate,
  authorize("manager"),
  updateProduct
);

// Disable product
router.delete(
  "/:id",
  authenticate,
  authorize("manager"),
  deleteProduct
);

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

export default router;
