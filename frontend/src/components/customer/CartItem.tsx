import type { CartItem as CartItemType } from "../../store/cartStore";
import { useCartStore } from "../../store/cartStore";

interface Props {
  item: CartItemType;
}

const CartItem = ({
  item
}: Props) => {

  const updateQuantity =
    useCartStore(
      (state) =>
        state.updateQuantity
    );

  const removeItem =
    useCartStore(
      (state) =>
        state.removeItem
    );

  return (
    <div className="cart-item">

      <div className="cart-item-image">

        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
          />
        ) : (
          <span>
            {item.category ===
            "fish"
              ? "🐟"
              : "🍗"}
          </span>
        )}

      </div>

      <div className="cart-item-info">

        <h3>
          {item.name}
        </h3>

        <p>
          {item.packageWeight}
          {item.packageUnit}
        </p>

        <strong>
          ₹{item.price}
        </strong>

      </div>

      <div className="cart-item-actions">

        <div className="quantity-selector">

          <button
            onClick={() =>
              updateQuantity(
                item.productId,
                item.packageWeight,
                item.packageUnit,
                item.quantity - 1
              )
            }
          >
            −
          </button>

          <span>
            {item.quantity}
          </span>

          <button
            onClick={() =>
              updateQuantity(
                item.productId,
                item.packageWeight,
                item.packageUnit,
                item.quantity + 1
              )
            }
          >
            +
          </button>

        </div>

        <button
          className="remove-button"
          onClick={() =>
            removeItem(
              item.productId,
              item.packageWeight,
              item.packageUnit
            )
          }
        >
          Remove
        </button>

      </div>

      <strong className="cart-item-total">
        ₹{item.price * item.quantity}
      </strong>

    </div>
  );
};

export default CartItem;