import {
  useEffect,
  useMemo,
  useState
} from "react";

import { useSearchParams } from "react-router-dom";

import CustomerNavbar from "../../components/customer/CustomerNavbar";

import ProductCard from "../../components/customer/ProductCard";

import { getPublicProducts } from "../../services/productService";
import type { PublicProduct } from "../../services/productService";

const Shop = () => {

  const [products, setProducts] =
    useState<PublicProduct[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [searchParams] =
    useSearchParams();

  const initialCategory =
    searchParams.get("category");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState<
      "all" | "fish" | "chicken"
    >(
      initialCategory === "fish" ||
      initialCategory === "chicken"
        ? initialCategory
        : "all"
    );

  useEffect(() => {

    const loadProducts =
      async () => {

        try {

          const data =
            await getPublicProducts();

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

    loadProducts();

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
            product.category ===
              category;

          return (
            matchesSearch &&
            matchesCategory
          );

        }
      );

    }, [
      products,
      search,
      category
    ]);

  return (
    <div>

      <CustomerNavbar />

      <main className="shop-page">

        <div className="shop-header">

          <div>
            <span>
              AQPF STORE
            </span>

            <h1>
              Fresh Products
            </h1>
          </div>

          <input
            type="text"
            placeholder="Search fish or chicken..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <div className="category-tabs">

          <button
            className={
              category === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setCategory("all")
            }
          >
            All
          </button>

          <button
            className={
              category === "fish"
                ? "active"
                : ""
            }
            onClick={() =>
              setCategory("fish")
            }
          >
            🐟 Fish
          </button>

          <button
            className={
              category === "chicken"
                ? "active"
                : ""
            }
            onClick={() =>
              setCategory("chicken")
            }
          >
            🍗 Chicken
          </button>

        </div>

        {loading ? (

          <div className="loading">
            Loading fresh products...
          </div>

        ) : filteredProducts.length ===
          0 ? (

          <div className="empty-state">
            <h2>
              No products found
            </h2>

            <p>
              Try another search or
              category.
            </p>
          </div>

        ) : (

          <div className="customer-product-grid">

            {filteredProducts.map(
              (product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                />
              )
            )}

          </div>

        )}

      </main>

    </div>
  );
};

export default Shop;