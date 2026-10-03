import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import CustomerNavbar from "../../components/customer/CustomerNavbar";
import { getPublicProductById } from "../../services/productService";
import type { PublicProduct } from "../../services/productService";
import { useCartStore } from "../../store/cartStore";

type PackageOption = {
  weight: number;
  unit: "g" | "kg";
  price: number;
};

type ProductWithLegacyPackages = PublicProduct & {
  packages?: PackageOption[];
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD PRODUCT
  // ==========================================

  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPublicProductById(id);

        setProduct(data);
        setSelectedPackage(0);
        setQuantity(1);
      } catch (error) {
        console.error("Failed to load product:", error);

        setProduct(null);
        setError("Unable to load this product.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // ==========================================
  // NORMALIZE PACKAGE OPTIONS
  // ==========================================

  const packageOptions = useMemo<PackageOption[]>(() => {
    if (!product) {
      return [];
    }

    const productData =
      product as ProductWithLegacyPackages;

    const options =
      productData.packageOptions ??
      productData.packages ??
      [];

    if (!Array.isArray(options)) {
      return [];
    }

    return options
      .filter((pkg) => pkg != null)
      .map((pkg) => ({
        weight: Number(pkg.weight),
        unit: (String(pkg.unit).toLowerCase() === "kg" ? "kg" : "g") as PackageOption["unit"],
        price: Number(pkg.price),
      }))
      .filter(
        (pkg) =>
          pkg.weight > 0 &&
          pkg.price >= 0
      );
  }, [product]);

  // ==========================================
  // CURRENT PACKAGE
  // ==========================================

  const currentPackage =
    packageOptions[selectedPackage] ?? null;

  // ==========================================
  // QUANTITY FUNCTIONS
  // ==========================================

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );
  };

  const increaseQuantity = () => {
    setQuantity((current) =>
      current + 1
    );
  };

  // ==========================================
  // TOTAL
  // ==========================================

  const total = currentPackage
    ? currentPackage.price * quantity
    : 0;

  // ==========================================
  // ADD TO CART
  // ==========================================

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    if (!currentPackage) {
      alert("Please select a valid package.");
      return;
    }

    if (!product.isAvailable) {
      alert("This product is currently unavailable.");
      return;
    }

    addItem({
      productId: product._id,
      name: product.name,
      category: product.category,

      packageWeight:
        currentPackage.weight,

      packageUnit:
        currentPackage.unit,

      price:
        currentPackage.price,

      quantity,

      image: product.image,
    });

    navigate("/customer/cart");
  };

  // ==========================================
  // MISSING PRODUCT ID
  // ==========================================

  if (!id) {
    return (
      <>
        <CustomerNavbar />

        <div className="loading">
          Product ID is missing.
        </div>
      </>
    );
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <>
        <CustomerNavbar />

        <div className="loading">
          Loading product...
        </div>
      </>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (!product) {
    return (
      <>
        <CustomerNavbar />

        <div className="loading">
          {error || "Product not found."}
        </div>
      </>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div>
      <CustomerNavbar />

      <main className="product-details">

        {/* IMAGE */}

        <div className="details-image">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
            />
          ) : (
            <div className="large-placeholder">
              {product.category === "fish"
                ? "🐟"
                : "🍗"}
            </div>
          )}
        </div>

        {/* DETAILS */}

        <div className="details-content">

          <span className="product-category">
            {product.category}
          </span>

          <h1>{product.name}</h1>

          <p className="details-description">
            {product.description}
          </p>

          <hr />

          {/* PACKAGE */}

          <h3>Choose Package</h3>

          {packageOptions.length > 0 ? (
            <div className="package-selector">

              {packageOptions.map(
                (pkg, index) => (
                  <button
                    type="button"
                    key={`${pkg.weight}-${pkg.unit}-${index}`}
                    className={
                      selectedPackage === index
                        ? "selected"
                        : ""
                    }
                    onClick={() => {
                      setSelectedPackage(index);
                      setQuantity(1);
                    }}
                  >
                    <strong>
                      {pkg.weight} {pkg.unit}
                    </strong>

                    <span>
                      ₹{pkg.price}
                    </span>
                  </button>
                )
              )}

            </div>
          ) : (
            <div className="package-unavailable-message">
              No package options are configured
              for this product.
            </div>
          )}

          {/* QUANTITY */}

          <h3>Quantity</h3>

          <div className="quantity-selector">

            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={
                !currentPackage ||
                quantity <= 1
              }
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span>
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={!currentPackage}
              aria-label="Increase quantity"
            >
              +
            </button>

          </div>

          {/* TOTAL */}

          <div className="purchase-summary">

            <span>
              Total
            </span>

            <strong>
              ₹{total.toLocaleString("en-IN")}
            </strong>

          </div>

          {/* ADD TO CART */}

          <button
            type="button"
            className="add-cart-button"
            onClick={handleAddToCart}
            disabled={
              !currentPackage ||
              !product.isAvailable
            }
          >
            {!product.isAvailable
              ? "Out of Stock"
              : !currentPackage
                ? "Package Unavailable"
                : "Add to Cart"}
          </button>

        </div>
      </main>
    </div>
  );
};

export default ProductDetails;