import type { Product } from "../../services/productService";
import StockBadge from "./StockBadge";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onToggle: (product: Product) => void;
}

const ProductCard = ({
  product,
  onEdit,
  onToggle
}: ProductCardProps) => {
  return (
    <div className="product-card">

      <div className="product-image">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
          />
        ) : (
          <div className="image-placeholder">
            {product.category === "fish"
              ? "🐟"
              : "🍗"}
          </div>
        )}
      </div>

      <div className="product-info">

        <div className="product-header">
          <div>
            <h3>{product.name}</h3>

            <span className="category">
              {product.category}
            </span>
          </div>

          {product.isFeatured && (
            <span className="featured">
              Featured
            </span>
          )}
        </div>

        <p className="description">
          {product.description}
        </p>

        <StockBadge
          stock={product.stock}
          unit={product.stockUnit}
        />

        <div className="packages">
          {product.packageOptions.map(
            (pkg, index) => (
              <div
                className="package"
                key={index}
              >
                <span>
                  {pkg.weight}
                  {pkg.unit}
                </span>

                <strong>
                  ₹{pkg.price}
                </strong>
              </div>
            )
          )}
        </div>

        <div className="product-status">
          <span>
            {product.isAvailable
              ? "● Available"
              : "● Disabled"}
          </span>
        </div>

        <div className="product-actions">
          <button
            onClick={() => onEdit(product)}
          >
            Edit
          </button>

          <button
            onClick={() => onToggle(product)}
          >
            {product.isAvailable
              ? "Disable"
              : "Enable"}
          </button>
        </div>

      </div>

    </div>
  );
};

export default ProductCard;