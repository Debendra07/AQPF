import { Router } from "express";

import {
  createOrder,
  getOrderQuote,
  getMyOrders,
  getMyOrder,
  getAllOrders,
  updateOrderStatus
} from "../controllers/order.controller.js";

import {
  authenticate
} from "../middleware/auth.middleware.js";

import {
  authorize
} from "../middleware/role.middleware.js";

const router = Router();

router.post(
  "/quote",
  authenticate,
  authorize("customer"),
  getOrderQuote
);

router.post(
  "/",
  authenticate,
  authorize("customer"),
  createOrder
);

router.get(
  "/my",
  authenticate,
  authorize("customer"),
  getMyOrders
);

router.get(
  "/my/:id",
  authenticate,
  authorize("customer"),
  getMyOrder
);

router.get(
  "/manager/all",
  authenticate,
  authorize("manager"),
  getAllOrders
);

router.patch(
  "/manager/:id/status",
  authenticate,
  authorize("manager"),
  updateOrderStatus
);

export default router;