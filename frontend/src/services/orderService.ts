import api from "./api";

export interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  category: "fish" | "chicken";
  packageWeight: number;
  packageUnit: "g" | "kg";
  price: number;
  quantity: number;
  image: string;
}

export type PaymentMethod = "cod" | "razorpay";

export interface Order {
  _id: string;
  userId: string | { name: string } | null;
  items: OrderItem[];
  address: Address;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus:
    | "pending"
    | "paid"
    | "failed";
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface OrderQuote {
  subtotal: number;
  deliveryFee: number;
  total: number;
  canPlaceOrder: boolean;
  errors: string[];
  items: Array<{
    productId: string;
    packageWeight: number;
    packageUnit: "g" | "kg";
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    available?: boolean;
    error?: string;
  }>;
}

export const getOrderQuote =
  async (
    items: Array<{
      productId: string;
      packageWeight: number;
      packageUnit: "g" | "kg";
      quantity: number;
    }>
  ): Promise<OrderQuote> => {
    const response = await api.post(
      "/api/orders/quote",
      { items }
    );

    return response.data.quote;
  };

export const createOrder =
  async (
    items: Array<{
      productId: string;
      packageWeight: number;
      packageUnit: "g" | "kg";
      quantity: number;
    }>,
    address: Address,
    paymentMethod: PaymentMethod = "cod"
  ): Promise<Order> => {

    const response =
      await api.post(
        "/api/orders",
        {
          items,
          address,
          paymentMethod
        }
      );

    return response.data.order;
  };

export const createRazorpayCheckoutOrder =
  async (
    items: Array<{
      productId: string;
      packageWeight: number;
      packageUnit: "g" | "kg";
      quantity: number;
    }>,
    address: Address
  ): Promise<{
    order: Order;
    payment: {
      _id: string;
      orderId: string;
      status: string;
      amount: number;
      currency: string;
      razorpayOrderId: string;
    };
    razorpay: {
      key: string;
      order: {
        id: string;
        amount: number;
        currency: string;
      };
    };
  }> => {
    const response =
      await api.post(
        "/api/payments/create-order",
        {
          items,
          address
        }
      );

    return response.data;
  };

export const verifyRazorpayPayment =
  async ({
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ success: boolean; order?: Order; message?: string }> => {
    const response =
      await api.post(
        "/api/payments/verify",
        {
          orderId,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature
        }
      );

    return response.data;
  };

export const getMyOrders =
  async (): Promise<Order[]> => {

    const response =
      await api.get(
        "/api/orders/my"
      );

    return response.data.orders;
  };

export const getMyOrder =
  async (
    id: string
  ): Promise<Order> => {

    const response =
      await api.get(
        `/api/orders/my/${id}`
      );

    return response.data.order;
  };

export const getAllOrders =
  async (): Promise<Order[]> => {

    const response =
      await api.get(
        "/api/orders/manager/all"
      );

    return response.data.orders;
  };

export const updateOrderStatus =
  async (
    id: string,
    status: Order["status"]
  ): Promise<Order> => {

    const response =
      await api.patch(
        `/api/orders/manager/${id}/status`,
        { status }
      );

    return response.data.order;
  };