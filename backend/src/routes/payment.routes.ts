import { Router } from "express";

import {
  completeRefund,
  createPaymentOrder,
  requestRefund,
  verifyPayment,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.post(
  "/create-order",
  authenticate,
  authorize("customer"),
  createPaymentOrder
);

router.post(
  "/verify",
  authenticate,
  authorize("customer"),
  verifyPayment
);

router.post(
  "/refund",
  authenticate,
  authorize("customer"),
  requestRefund
);

router.patch(
  "/refund/complete",
  authenticate,
  authorize("manager"),
  completeRefund
);

export default router;
