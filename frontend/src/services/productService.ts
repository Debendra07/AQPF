import api from "./api";

// ===============================
// TYPES
// ===============================

export interface PackageOption {
  weight: number;
  unit: "g" | "kg";
  price: number;
}

export interface Product {
  _id: string;

  name: string;

  category: "fish" | "chicken";

  description: string;

  packageOptions: PackageOption[];

  stock: number;

  stockUnit: "g" | "kg";

  image: string;

  isAvailable: boolean;

  isFeatured: boolean;

  createdAt: string;

  updatedAt: string;
}

export type PublicProduct = Omit<Product, "stock" | "stockUnit">;

export interface ProductPayload {
  name: string;

  category: "fish" | "chicken";

  description: string;

  packageOptions: PackageOption[];

  stock: number;

  stockUnit: "g" | "kg";

  image: string;

  isAvailable: boolean;

  isFeatured: boolean;
}

// ===============================
// GET ALL PRODUCTS
// ===============================

export const getManagerProducts = async (): Promise<Product[]> => {
  const response = await api.get("/api/products");

  return response.data.products;
};

// ===============================
// GET SINGLE PRODUCT
// ===============================

export const getPublicProductById = async (
  id: string
): Promise<PublicProduct> => {
  const response = await api.get(
    `/api/products/public/${id}`
  );

  return response.data.product;
};

// ===============================
// CREATE PRODUCT
// ===============================

export const createProduct = async (
  data: ProductPayload
): Promise<Product> => {
  const response = await api.post(
    "/api/products",
    data
  );

  return response.data.product;
};

// ===============================
// UPDATE PRODUCT
// ===============================

export const updateProduct = async (
  id: string,
  data: Partial<ProductPayload>
): Promise<Product> => {
  const response = await api.put(
    `/api/products/${id}`,
    data
  );

  return response.data.product;
};

// ===============================
// DISABLE PRODUCT
// ===============================

export const disableProduct = async (
  id: string
): Promise<Product> => {
  const response = await api.delete(
    `/api/products/${id}`
  );

  return response.data.product;
};

// ===============================
// GET PUBLIC PRODUCTS
// ===============================


export const getPublicProducts =
  async (): Promise<PublicProduct[]> => {

    const response =
      await api.get(
        "/api/products/public"
      );

    return response.data.products;
  };