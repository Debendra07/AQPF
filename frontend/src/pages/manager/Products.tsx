import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  disableProduct,
  getManagerProducts,
  updateProduct
} from "../../services/productService";

import type {
  Product,
  ProductPayload
} from "../../services/productService";

import ProductCard from "../../components/manager/ProductCard";
import ProductForm from "../../components/manager/ProductForm";

type FilterCategory =
  | "all"
  | "fish"
  | "chicken";

type AvailabilityFilter =
  | "all"
  | "available"
  | "disabled";

const Products = () => {

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState<FilterCategory>("all");

  const [availability, setAvailability] =
    useState<AvailabilityFilter>("all");

  const [showForm, setShowForm] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const data =
        await getManagerProducts();

      setProducts(data);

    } catch (error) {
      console.error(
        "Failed to load products",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getManagerProducts()
      .then(setProducts)
      .catch((error) => {
        console.error(
          "Failed to load products",
          error
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts =
    useMemo(() => {

      return products.filter(
        (product) => {

          const matchesSearch =
            product.name
              .toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesCategory =
            category === "all" ||
            product.category === category;

          const matchesAvailability =
            availability === "all" ||
            (availability === "available" &&
              product.isAvailable) ||
            (availability === "disabled" &&
              !product.isAvailable);

          return (
            matchesSearch &&
            matchesCategory &&
            matchesAvailability
          );
        }
      );

    }, [
      products,
      search,
      category,
      availability
    ]);

  const handleCreate = async (
    data: ProductPayload
  ) => {

    try {

      await createProduct(data);

      setShowForm(false);

      await fetchProducts();

    } catch (error) {

      console.error(
        "Failed to create product",
        error
      );

      alert(
        "Failed to create product"
      );
    }
  };

  const handleUpdate = async (
    data: ProductPayload
  ) => {

    if (!editingProduct) {
      return;
    }

    try {

      await updateProduct(
        editingProduct._id,
        data
      );

      setEditingProduct(null);

      await fetchProducts();

    } catch (error) {

      console.error(
        "Failed to update product",
        error
      );

      alert(
        "Failed to update product"
      );
    }
  };

  const handleToggle = async (
    product: Product
  ) => {

    const action =
      product.isAvailable
        ? "disable"
        : "enable";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${product.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {

      if (product.isAvailable) {

        await disableProduct(
          product._id
        );

      } else {

        await updateProduct(
          product._id,
          {
            isAvailable: true
          }
        );

      }

      await fetchProducts();

    } catch (error) {

      console.error(
        "Failed to update product status",
        error
      );

      alert(
        "Failed to update product status"
      );
    }
  };

  if (loading) {
    return (
      <div className="manager-page">
        <h1>Products</h1>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="manager-page">

      {/* Header */}

      <div className="page-header">

        <div>
          <h1>
            Products
          </h1>

          <p>
            Manage AQPF fish and chicken
            products.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
        >
          + Add Product
        </button>

      </div>

      {/* Stats */}

      <div className="product-stats">

        <div className="stat-card">
          <span>
            Total Products
          </span>

          <strong>
            {products.length}
          </strong>
        </div>

        <div className="stat-card">
          <span>
            Fish
          </span>

          <strong>
            {
              products.filter(
                (p) =>
                  p.category === "fish"
              ).length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span>
            Chicken
          </span>

          <strong>
            {
              products.filter(
                (p) =>
                  p.category ===
                  "chicken"
              ).length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span>
            Low Stock
          </span>

          <strong>
            {
              products.filter(
                (p) =>
                  p.stock > 0 &&
                  p.stock <= 5
              ).length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span>
            Out of Stock
          </span>

          <strong>
            {
              products.filter(
                (p) =>
                  p.stock <= 0
              ).length
            }
          </strong>
        </div>

      </div>

      {/* Filters */}

      <div className="filters">

        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value as FilterCategory
            )
          }
        >
          <option value="all">
            All Categories
          </option>

          <option value="fish">
            Fish
          </option>

          <option value="chicken">
            Chicken
          </option>
        </select>

        <select
          value={availability}
          onChange={(e) =>
            setAvailability(
              e.target.value as AvailabilityFilter
            )
          }
        >
          <option value="all">
            All Status
          </option>

          <option value="available">
            Available
          </option>

          <option value="disabled">
            Disabled
          </option>
        </select>

      </div>

      {/* Product list */}

      {filteredProducts.length === 0 ? (

        <div className="empty-state">
          <h2>
            No products found
          </h2>

          <p>
            Try changing your search
            or filters.
          </p>
        </div>

      ) : (

        <div className="product-grid">

          {filteredProducts.map(
            (product) => (

              <ProductCard
                key={product._id}
                product={product}
                onEdit={(product) => {
                  setEditingProduct(
                    product
                  );
                  setShowForm(false);
                }}
                onToggle={
                  handleToggle
                }
              />

            )
          )}

        </div>

      )}

      {/* Add form */}

      {showForm && (

        <div className="modal-overlay">

          <div className="modal">

            <ProductForm
              onSubmit={
                handleCreate
              }
              onCancel={() =>
                setShowForm(false)
              }
              submitText="Create Product"
            />

          </div>

        </div>

      )}

      {/* Edit form */}

      {editingProduct && (

        <div className="modal-overlay">

          <div className="modal">

            <ProductForm
              initialData={{
                name:
                  editingProduct.name,

                category:
                  editingProduct.category,

                description:
                  editingProduct.description,

                packageOptions:
                  editingProduct.packageOptions,

                stock:
                  editingProduct.stock,

                stockUnit:
                  editingProduct.stockUnit,

                image:
                  editingProduct.image,

                isAvailable:
                  editingProduct.isAvailable,

                isFeatured:
                  editingProduct.isFeatured
              }}
              onSubmit={
                handleUpdate
              }
              onCancel={() =>
                setEditingProduct(
                  null
                )
              }
              submitText="Save Changes"
            />

          </div>

        </div>

      )}

    </div>
  );
};

export default Products;