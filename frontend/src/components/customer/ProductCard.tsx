import { Link } from "react-router-dom";
import type { PublicProduct } from "../../services/productService";

interface ProductCardProps {
  product: PublicProduct;
}

const ProductCard = ({
  product
}: ProductCardProps) => {

  const lowestPrice =
    Math.min(
      ...product.packageOptions.map(
        (pkg) => pkg.price
      )
    );

  return (
    <div className="customer-product-card">

      <Link
        to={`/customer/product/${product._id}`}
      >

        <div className="customer-product-image">

          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
            />
          ) : (
            <div className="customer-placeholder">
              {product.category ===
              "fish"
                ? "🐟"
                : "🍗"}
            </div>
          )}

        </div>

        <div className="customer-product-info">

          <span className="product-category">
            {product.category}
          </span>

          <h3>
            {product.name}
          </h3>

          <p>
            From ₹{lowestPrice}
          </p>

        </div>

      </Link>

    </div>
  );
};

export default ProductCard;