import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  category: "fish" | "chicken";

  packageWeight: number;
  packageUnit: "g" | "kg";

  price: number;

  quantity: number;

  image: string;
}

interface CartState {
  items: CartItem[];

  addItem: (
    item: CartItem
  ) => void;

  removeItem: (
    productId: string,
    packageWeight: number,
    packageUnit: string
  ) => void;

  updateQuantity: (
    productId: string,
    packageWeight: number,
    packageUnit: string,
    quantity: number
  ) => void;

  clearCart: () => void;
}

export const useCartStore =
  create<CartState>()(
    persist(
      (set) => ({

        items: [],

        addItem: (newItem) =>
            set((state) => {
                const existingIndex =
                state.items.findIndex(
                    (item) =>
                    item.productId === newItem.productId &&
                    item.packageWeight ===
                        newItem.packageWeight &&
                    item.packageUnit ===
                        newItem.packageUnit
                );

                // Existing item
                if (existingIndex !== -1) {
                return {
                    items: state.items.map(
                    (item, index) =>
                        index === existingIndex
                        ? {
                            ...item,
                            quantity:
                                item.quantity +
                                newItem.quantity,
                            }
                        : item
                    ),
                };
                }

                // New item
                return {
                items: [
                    ...state.items,
                    newItem,
                ],
                };
            }),
            
        removeItem: (
          productId,
          packageWeight,
          packageUnit
        ) =>
          set((state) => ({
            items:
              state.items.filter(
                (item) =>
                  !(
                    item.productId ===
                      productId &&
                    item.packageWeight ===
                      packageWeight &&
                    item.packageUnit ===
                      packageUnit
                  )
              )
          })),

        updateQuantity: (
          productId,
          packageWeight,
          packageUnit,
          quantity
        ) =>
          set((state) => ({
            items:
              state.items.map(
                (item) =>
                  item.productId ===
                      productId &&
                  item.packageWeight ===
                      packageWeight &&
                  item.packageUnit ===
                      packageUnit
                    ? {
                        ...item,
                        quantity:
                          Math.max(
                            1,
                            quantity
                          )
                      }
                    : item
              )
          })),

        clearCart: () =>
          set({
            items: []
          })

      }),

      {
        name: "aqpf-cart"
      }
    )
  );