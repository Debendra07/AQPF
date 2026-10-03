export type NotificationEvent =
  | "ORDER_CREATED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "ORDER_CONFIRMED"
  | "ORDER_PREPARING"
  | "ORDER_OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "REFUND_CREATED"
  | "REFUND_COMPLETED";

interface NotificationPayload {
  userId?: string;
  orderId?: string;
  email?: string;
  phone?: string;
  message?: string;
  [key: string]: unknown;
}

export const sendNotification = async (
  event: NotificationEvent,
  payload: NotificationPayload
): Promise<void> => {
  console.log("📢 AQPF Notification");
  console.log("Event:", event);
  console.log("Payload:", payload);

  // Phase 6 foundation:
  // Email/SMS/WhatsApp providers can be connected here later.
};

export const notifyOrderCreated = async (
  payload: NotificationPayload
): Promise<void> => {
  await sendNotification("ORDER_CREATED", payload);
};

export const notifyPaymentSuccess = async (
  payload: NotificationPayload
): Promise<void> => {
  await sendNotification("PAYMENT_SUCCESS", payload);
};

export const notifyPaymentFailed = async (
  payload: NotificationPayload
): Promise<void> => {
  await sendNotification("PAYMENT_FAILED", payload);
};

export const notifyOrderConfirmed = async (
  payload: NotificationPayload
): Promise<void> => {
  await sendNotification("ORDER_CONFIRMED", payload);
};

export const notifyOrderPreparing = async (
  payload: NotificationPayload
): Promise<void> => {
  await sendNotification("ORDER_PREPARING", payload);
};

export const notifyOrderOutForDelivery = async (
  payload: NotificationPayload
): Promise<void> => {
  await sendNotification("ORDER_OUT_FOR_DELIVERY", payload);
};

export const notifyOrderDelivered = async (
  payload: NotificationPayload
): Promise<void> => {
  await sendNotification("ORDER_DELIVERED", payload);
};

export const notifyOrderCancelled = async (
  payload: NotificationPayload
): Promise<void> => {
  await sendNotification("ORDER_CANCELLED", payload);
};

export const notifyRefundCreated = async (
  payload: NotificationPayload
): Promise<void> => {
  await sendNotification("REFUND_CREATED", payload);
};

export const notifyRefundCompleted = async (
  payload: NotificationPayload
): Promise<void> => {
  await sendNotification("REFUND_COMPLETED", payload);
};