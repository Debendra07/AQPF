import mongoose from "mongoose";

import Product from "../models/Product.js";
import type { IProduct } from "../models/Product.js";

import Order from "../models/Order.js";
import type {
  IAddress,
  IOrderItem,
} from "../models/Order.js";

/* =========================================================
   TYPES
========================================================= */

export interface OrderItemInput {
  productId: string;
  packageWeight: number;
  packageUnit: "g" | "kg";
  quantity: number;
}

export interface OrderQuoteItem {
  productId: string;
  productName: string;

  packageWeight: number;
  packageUnit: "g" | "kg";

  quantity: number;

  unitPrice: number;
  lineTotal: number;

  available: boolean;
  error?: string;
}

export interface OrderQuote {
  subtotal: number;
  deliveryFee: number;
  total: number;

  canPlaceOrder: boolean;

  errors: string[];

  items: OrderQuoteItem[];
}

interface CreateOrderInput {
  userId: string;
  items: unknown;
  address: unknown;
  paymentMethod?: "cod" | "razorpay";
}

/* =========================================================
   VALIDATE ORDER ITEMS
========================================================= */

const validateOrderItems = (
  value: unknown
): OrderItemInput[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Order items are required");
  }

  return value.map((item, index) => {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      throw new Error(
        `Order item ${index + 1} is invalid`
      );
    }

    const candidate =
      item as Record<string, unknown>;

    /* -----------------------------------------------------
       PRODUCT ID
    ----------------------------------------------------- */

    if (
      typeof candidate.productId !== "string" ||
      !mongoose.isValidObjectId(
        candidate.productId
      )
    ) {
      throw new Error(
        `Order item ${index + 1} has an invalid product ID`
      );
    }

    /* -----------------------------------------------------
       PACKAGE WEIGHT
    ----------------------------------------------------- */

    if (
      typeof candidate.packageWeight !== "number" ||
      !Number.isFinite(
        candidate.packageWeight
      ) ||
      candidate.packageWeight <= 0
    ) {
      throw new Error(
        `Order item ${index + 1} has an invalid package weight`
      );
    }

    /* -----------------------------------------------------
       PACKAGE UNIT
    ----------------------------------------------------- */

    if (
      candidate.packageUnit !== "g" &&
      candidate.packageUnit !== "kg"
    ) {
      throw new Error(
        `Order item ${index + 1} has an invalid package unit`
      );
    }

    /* -----------------------------------------------------
       QUANTITY
    ----------------------------------------------------- */

    if (
      typeof candidate.quantity !== "number" ||
      !Number.isSafeInteger(
        candidate.quantity
      ) ||
      candidate.quantity < 1
    ) {
      throw new Error(
        `Order item ${index + 1} has an invalid quantity`
      );
    }

    return {
      productId:
        candidate.productId,

      packageWeight:
        candidate.packageWeight,

      packageUnit:
        candidate.packageUnit,

      quantity:
        candidate.quantity,
    };
  });
};

/* =========================================================
   VALIDATE ADDRESS
========================================================= */

const validateAddress = (
  value: unknown
): IAddress => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "Delivery address is required"
    );
  }

  const address =
    value as Record<string, unknown>;

  /* -------------------------------------------------------
     REQUIRED FIELD
  ------------------------------------------------------- */

  const requiredField = (
    key: string,
    label: string,
    min: number,
    max: number
  ): string => {
    const field =
      address[key];

    if (
      typeof field !== "string"
    ) {
      throw new Error(
        `${label} is required`
      );
    }

    const trimmed =
      field.trim();

    if (
      trimmed.length < min ||
      trimmed.length > max
    ) {
      throw new Error(
        `${label} must be between ${min} and ${max} characters`
      );
    }

    return trimmed;
  };

  /* -------------------------------------------------------
     OPTIONAL FIELD
  ------------------------------------------------------- */

  const optionalField = (
    key: string,
    label: string,
    max: number
  ): string | undefined => {
    const field =
      address[key];

    if (
      field === undefined ||
      field === null ||
      field === ""
    ) {
      return undefined;
    }

    if (
      typeof field !== "string"
    ) {
      throw new Error(
        `${label} must be a string`
      );
    }

    const trimmed =
      field.trim();

    if (
      trimmed.length > max
    ) {
      throw new Error(
        `${label} must not exceed ${max} characters`
      );
    }

    return trimmed || undefined;
  };

  /* -------------------------------------------------------
     FULL NAME
  ------------------------------------------------------- */

  const fullName =
    requiredField(
      "fullName",
      "Full name",
      2,
      100
    );

  /* -------------------------------------------------------
     PHONE
  ------------------------------------------------------- */

  const phone =
    requiredField(
      "phone",
      "Phone number",
      7,
      20
    );

  const phoneDigits =
    phone.replace(
      /\D/g,
      ""
    );

  if (
    !/^[+\d][\d\s()-]*$/.test(
      phone
    ) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    throw new Error(
      "Phone number must contain 7 to 15 digits"
    );
  }

  /* -------------------------------------------------------
     PIN CODE
  ------------------------------------------------------- */

  const pincode =
    requiredField(
      "pincode",
      "PIN code",
      6,
      6
    );

  if (
    !/^\d{6}$/.test(
      pincode
    )
  ) {
    throw new Error(
      "PIN code must contain exactly 6 digits"
    );
  }

  /* -------------------------------------------------------
     FINAL ADDRESS
  ------------------------------------------------------- */

  return {
    fullName,

    phone,

    addressLine1:
      requiredField(
        "addressLine1",
        "Address line 1",
        5,
        200
      ),

    addressLine2:
      optionalField(
        "addressLine2",
        "Address line 2",
        200
      ),

    city:
      requiredField(
        "city",
        "City",
        2,
        100
      ),

    state:
      requiredField(
        "state",
        "State",
        2,
        100
      ),

    pincode,

    landmark:
      optionalField(
        "landmark",
        "Landmark",
        150
      ),
  };
};

/* =========================================================
   STOCK UNIT CONVERSION
========================================================= */

/**
 * Converts package quantity into the
 * product's stock unit.
 *
 * Examples:
 *
 * 500g → kg = 0.5
 * 2kg   → g  = 2000
 *
 * 500g × 4 = 2kg
 */
export const toStockUnits = (
  weight: number,
  packageUnit: "g" | "kg",
  stockUnit: "g" | "kg"
): number => {
  if (
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    throw new Error(
      "Invalid package weight"
    );
  }

  /* Same unit */

  if (
    packageUnit === stockUnit
  ) {
    return weight;
  }

  /* g → kg */

  if (
    packageUnit === "g" &&
    stockUnit === "kg"
  ) {
    return weight / 1000;
  }

  /* kg → g */

  return weight * 1000;
};

/* =========================================================
   DELIVERY FEE
========================================================= */

const getDeliveryFee = (): number => {
  const deliveryFee =
    Number(
      process.env.DELIVERY_FEE ?? 40
    );

  if (
    !Number.isFinite(
      deliveryFee
    ) ||
    deliveryFee < 0
  ) {
    throw new Error(
      "DELIVERY_FEE must be a non-negative number"
    );
  }

  return deliveryFee;
};

/* =========================================================
   GET ORDER QUOTE
========================================================= */

/**
 * Calculates the checkout quote.
 *
 * IMPORTANT:
 *
 * This function does NOT deduct stock.
 *
 * It only:
 * - validates products
 * - validates packages
 * - calculates prices
 * - calculates stock requirements
 * - reports unavailable products
 *
 * This allows multiple products to be shown
 * even when one cart item has a problem.
 */
export const getOrderQuoteService =
  async (
    inputItems: unknown
  ): Promise<OrderQuote> => {
    const items =
      validateOrderItems(
        inputItems
      );

    /* -----------------------------------------------------
       PRODUCT CACHE
    ----------------------------------------------------- */

    const productsById =
      new Map<
        string,
        IProduct
      >();

    /* -----------------------------------------------------
       STOCK REQUIREMENT PER PRODUCT
    ----------------------------------------------------- */

    const requiredStockById =
      new Map<
        string,
        number
      >();

    /* -----------------------------------------------------
       QUOTE ITEMS
    ----------------------------------------------------- */

    const quoteItems:
      OrderQuoteItem[] = [];

    /* -----------------------------------------------------
       ERRORS
    ----------------------------------------------------- */

    const errors:
      string[] = [];

    /* =====================================================
       PROCESS CART ITEMS
    ===================================================== */

    for (
      const item of items
    ) {
      /* ---------------------------------------------------
         FIND PRODUCT
      --------------------------------------------------- */

      let product =
        productsById.get(
          item.productId
        );

      if (!product) {
        product =
          await Product.findById(
            item.productId
          ) ?? undefined;
      }

      /* ---------------------------------------------------
         PRODUCT NOT FOUND
      --------------------------------------------------- */

      if (!product) {
        const errorMessage =
          "Product no longer exists";

        errors.push(
          errorMessage
        );

        quoteItems.push({
          productId:
            item.productId,

          productName:
            "Unavailable product",

          packageWeight:
            item.packageWeight,

          packageUnit:
            item.packageUnit,

          quantity:
            item.quantity,

          unitPrice: 0,

          lineTotal: 0,

          available: false,

          error:
            errorMessage,
        });

        continue;
      }

      productsById.set(
        item.productId,
        product
      );

      /* ---------------------------------------------------
         PRODUCT AVAILABILITY
      --------------------------------------------------- */

      if (
        !product.isAvailable
      ) {
        const errorMessage =
          `${product.name} is currently unavailable`;

        errors.push(
          errorMessage
        );

        quoteItems.push({
          productId:
            product._id.toString(),

          productName:
            product.name,

          packageWeight:
            item.packageWeight,

          packageUnit:
            item.packageUnit,

          quantity:
            item.quantity,

          unitPrice: 0,

          lineTotal: 0,

          available: false,

          error:
            errorMessage,
        });

        continue;
      }

      /* ---------------------------------------------------
         PACKAGE
      --------------------------------------------------- */

      const packageOption =
        product.packageOptions.find(
          (option) =>
            Number(option.weight) ===
              item.packageWeight &&
            option.unit ===
              item.packageUnit
        );

      if (!packageOption) {
        const errorMessage =
          `Selected package is no longer available for ${product.name}`;

        errors.push(
          errorMessage
        );

        quoteItems.push({
          productId:
            product._id.toString(),

          productName:
            product.name,

          packageWeight:
            item.packageWeight,

          packageUnit:
            item.packageUnit,

          quantity:
            item.quantity,

          unitPrice: 0,

          lineTotal: 0,

          available: false,

          error:
            errorMessage,
        });

        continue;
      }

      /* ---------------------------------------------------
         PRICE
      --------------------------------------------------- */

      const unitPrice =
        Number(
          packageOption.price
        );

      if (
        !Number.isFinite(
          unitPrice
        ) ||
        unitPrice < 0
      ) {
        throw new Error(
          `Invalid price for ${product.name}`
        );
      }

      /* ---------------------------------------------------
         STOCK REQUIREMENT
      --------------------------------------------------- */

      const requiredStock =
        toStockUnits(
          item.packageWeight,
          item.packageUnit,
          product.stockUnit
        ) *
        item.quantity;

      if (
        !Number.isFinite(
          requiredStock
        ) ||
        requiredStock <= 0
      ) {
        throw new Error(
          `Invalid stock quantity for ${product.name}`
        );
      }

      const accumulatedStock =
        (
          requiredStockById.get(
            item.productId
          ) ?? 0
        ) +
        requiredStock;

      requiredStockById.set(
        item.productId,
        accumulatedStock
      );

      /* ---------------------------------------------------
         LINE TOTAL
      --------------------------------------------------- */

      const lineTotal =
        unitPrice *
        item.quantity;

      if (
        !Number.isFinite(
          lineTotal
        )
      ) {
        throw new Error(
          `Invalid order total for ${product.name}`
        );
      }

      /* ---------------------------------------------------
         ADD QUOTE ITEM
      --------------------------------------------------- */

      quoteItems.push({
        productId:
          product._id.toString(),

        productName:
          product.name,

        packageWeight:
          item.packageWeight,

        packageUnit:
          item.packageUnit,

        quantity:
          item.quantity,

        unitPrice,

        lineTotal,

        available: true,
      });
    }

    /* =====================================================
       STOCK VALIDATION
    ===================================================== */

    for (
      const [
        productId,
        requiredStock,
      ] of requiredStockById
    ) {
      const product =
        productsById.get(
          productId
        );

      if (!product) {
        continue;
      }

      if (
        product.stock <
        requiredStock
      ) {
        const errorMessage =
          `${product.name} does not have enough stock`;

        errors.push(
          errorMessage
        );

        /* -----------------------------------------------
           Mark all items of this product unavailable
        ------------------------------------------------ */

        for (
          const quoteItem of quoteItems
        ) {
          if (
            quoteItem.productId ===
            productId
          ) {
            quoteItem.available =
              false;

            quoteItem.error =
              errorMessage;
          }
        }
      }
    }

    /* =====================================================
       REMOVE DUPLICATE ERRORS
    ===================================================== */

    const uniqueErrors =
      Array.from(
        new Set(errors)
      );

    /* =====================================================
       SUBTOTAL
    ===================================================== */

    const subtotal =
      quoteItems.reduce(
        (
          total,
          item
        ) =>
          total +
          item.lineTotal,
        0
      );

    if (
      !Number.isFinite(
        subtotal
      )
    ) {
      throw new Error(
        "Order subtotal is invalid"
      );
    }

    /* =====================================================
       DELIVERY
    ===================================================== */

    const deliveryFee =
      getDeliveryFee();

    /* =====================================================
       TOTAL
    ===================================================== */

    const total =
      subtotal +
      deliveryFee;

    if (
      !Number.isFinite(
        total
      )
    ) {
      throw new Error(
        "Order total is invalid"
      );
    }

    /* =====================================================
       RETURN QUOTE
    ===================================================== */

    return {
      subtotal,

      deliveryFee,

      total,

      canPlaceOrder:
        uniqueErrors.length === 0,

      errors:
        uniqueErrors,

      items:
        quoteItems,
    };
  };

/* =========================================================
   CREATE ORDER
========================================================= */

/**
 * Creates the actual order.
 *
 * IMPORTANT:
 *
 * Quote validation is NOT trusted here.
 *
 * We check everything again and perform
 * atomic stock deductions inside a MongoDB
 * transaction.
 */
export const createOrderService =
  async (
    input: CreateOrderInput
  ) => {
    const paymentMethod =
      input.paymentMethod ?? "cod";

    if (
      paymentMethod !== "cod" &&
      paymentMethod !== "razorpay"
    ) {
      throw new Error(
        "Invalid payment method"
      );
    }

    /* -----------------------------------------------------
       USER ID
    ----------------------------------------------------- */

    if (
      !mongoose.isValidObjectId(
        input.userId
      )
    ) {
      throw new Error(
        "Invalid customer ID"
      );
    }

    /* -----------------------------------------------------
       ITEMS
    ----------------------------------------------------- */

    const items =
      validateOrderItems(
        input.items
      );

    /* -----------------------------------------------------
       ADDRESS
    ----------------------------------------------------- */

    const address =
      validateAddress(
        input.address
      );

    /* -----------------------------------------------------
       DELIVERY
    ----------------------------------------------------- */

    const deliveryFee =
      getDeliveryFee();

    /* =====================================================
       START MONGODB SESSION
    ===================================================== */

    const session =
      await mongoose.startSession();

    try {
      session.startTransaction();

      /* ---------------------------------------------------
         ORDER ITEMS
      --------------------------------------------------- */

      const orderItems:
        IOrderItem[] = [];

      /* ---------------------------------------------------
         SUBTOTAL
      --------------------------------------------------- */

      let subtotal = 0;

      /* ---------------------------------------------------
         PRODUCT CACHE
      --------------------------------------------------- */

      const productsById =
        new Map<
          string,
          IProduct
        >();

      /* ---------------------------------------------------
         STOCK REQUIREMENTS
      --------------------------------------------------- */

      const requiredStockById =
        new Map<
          string,
          number
        >();

      /* ===================================================
         VALIDATE EVERY ITEM
      =================================================== */

      for (
        const item of items
      ) {
        let product =
          productsById.get(
            item.productId
          );

        /* -------------------------------------------------
           FIND PRODUCT
        ------------------------------------------------- */

        if (!product) {
          const foundProduct =
            await Product.findById(
              item.productId
            ).session(
              session
            );

          if (!foundProduct) {
            throw new Error(
              `Product no longer exists`
            );
          }

          product =
            foundProduct;

          productsById.set(
            item.productId,
            product
          );
        }

        /* -------------------------------------------------
           AVAILABLE
        ------------------------------------------------- */

        if (
          !product.isAvailable
        ) {
          throw new Error(
            `${product.name} is currently unavailable`
          );
        }

        /* -------------------------------------------------
           PACKAGE
        ------------------------------------------------- */

        const packageOption =
          product.packageOptions.find(
            (pkg) =>
              Number(pkg.weight) ===
                item.packageWeight &&
              pkg.unit ===
                item.packageUnit
          );

        if (!packageOption) {
          throw new Error(
            `Selected package is no longer available for ${product.name}`
          );
        }

        /* -------------------------------------------------
           PRICE
        ------------------------------------------------- */

        const unitPrice =
          Number(
            packageOption.price
          );

        if (
          !Number.isFinite(
            unitPrice
          ) ||
          unitPrice < 0
        ) {
          throw new Error(
            `Invalid price for ${product.name}`
          );
        }

        /* -------------------------------------------------
           STOCK
        ------------------------------------------------- */

        const requiredStock =
          toStockUnits(
            item.packageWeight,
            item.packageUnit,
            product.stockUnit
          ) *
          item.quantity;

        if (
          !Number.isFinite(
            requiredStock
          ) ||
          requiredStock <= 0
        ) {
          throw new Error(
            `Invalid stock quantity for ${product.name}`
          );
        }

        /* -------------------------------------------------
           ACCUMULATE STOCK
        ------------------------------------------------- */

        const accumulatedStock =
          (
            requiredStockById.get(
              item.productId
            ) ?? 0
          ) +
          requiredStock;

        if (
          !Number.isFinite(
            accumulatedStock
          )
        ) {
          throw new Error(
            `Invalid stock quantity for ${product.name}`
          );
        }

        requiredStockById.set(
          item.productId,
          accumulatedStock
        );

        /* -------------------------------------------------
           LINE TOTAL
        ------------------------------------------------- */

        const itemTotal =
          unitPrice *
          item.quantity;

        if (
          !Number.isFinite(
            itemTotal
          )
        ) {
          throw new Error(
            `Invalid order total for ${product.name}`
          );
        }

        subtotal +=
          itemTotal;

        /* -------------------------------------------------
           ORDER ITEM SNAPSHOT
        ------------------------------------------------- */

        orderItems.push({
          productId:
            product._id,

          name:
            product.name,

          category:
            product.category,

          packageWeight:
            item.packageWeight,

          packageUnit:
            item.packageUnit,

          price:
            unitPrice,

          quantity:
            item.quantity,

          stockDeducted:
            requiredStock,

          stockUnit:
            product.stockUnit,

          image:
            product.image,
        });
      }

      /* ===================================================
         ATOMIC STOCK DEDUCTION
      =================================================== */

      for (
        const [
          productId,
          requiredStock,
        ] of requiredStockById
      ) {
        const product =
          productsById.get(
            productId
          );

        if (!product) {
          throw new Error(
            "Product no longer exists"
          );
        }

        /*
         * Atomic stock check.
         *
         * MongoDB only updates the product
         * if enough stock still exists.
         */

        const result =
          await Product.updateOne(
            {
              _id:
                productId,

              isAvailable:
                true,

              stock: {
                $gte:
                  requiredStock,
              },
            },

            {
              $inc: {
                stock:
                  -requiredStock,
              },
            },

            {
              session,
            }
          );

        if (
          result.modifiedCount !== 1
        ) {
          throw new Error(
            `${product.name} does not have enough stock`
          );
        }

        /* -------------------------------------------------
           MARK PRODUCT UNAVAILABLE IF STOCK = 0
        ------------------------------------------------- */

        await Product.updateOne(
          {
            _id:
              productId,

            stock: {
              $lte: 0,
            },
          },

          {
            $set: {
              stock: 0,
              isAvailable: false,
            },
          },

          {
            session,
          }
        );
      }

      /* ===================================================
         FINAL TOTAL
      =================================================== */

      const total =
        subtotal +
        deliveryFee;

      if (
        !Number.isFinite(
          total
        )
      ) {
        throw new Error(
          "Order total is invalid"
        );
      }

      /* ===================================================
         CREATE ORDER
      =================================================== */

      const [
        order,
      ] =
        await Order.create(
          [
            {
              userId:
                input.userId,

              items:
                orderItems,

              address,

              subtotal,

              deliveryFee,

              total,

              paymentMethod,

              paymentStatus:
                "pending",

              status:
                "pending",
            },
          ],
          {
            session,
          }
        );

      /* ===================================================
         COMMIT TRANSACTION
      =================================================== */

      await session.commitTransaction();

      return order;

    } catch (error) {
      /* ===================================================
         ROLLBACK
      =================================================== */

      if (
        session.inTransaction()
      ) {
        await session.abortTransaction();
      }

      throw error;

    } finally {
      await session.endSession();
    }
  };