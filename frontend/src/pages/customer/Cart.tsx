import { Link } from "react-router-dom";

import CustomerNavbar from "../../components/customer/CustomerNavbar";

import CartItem from "../../components/customer/CartItem";

import { useCartStore } from "../../store/cartStore";

const Cart = () => {

  const items =
    useCartStore(
      (state) => state.items
    );

  const subtotal =
    items.reduce(
      (total, item) =>
        total +
        item.price *
          item.quantity,
      0
    );

  if (items.length === 0) {

    return (
      <div>

        <CustomerNavbar />

        <main className="empty-cart">

          <div>
            <span className="cart-icon">
              🛒
            </span>

            <h1>
              Your Cart is Empty
            </h1>

            <p>
              Add some fresh fish
              or chicken to get
              started.
            </p>

            <Link
              to="/customer/shop"
              className="hero-button"
            >
              Start Shopping
            </Link>

          </div>

        </main>

      </div>
    );
  }

  return (
    <div>

      <CustomerNavbar />

      <main className="cart-page">

        <div className="cart-header">

          <span>
            AQPF
          </span>

          <h1>
            Your Cart
          </h1>

          <p>
            {items.length} product
            {items.length !== 1
              ? "s"
              : ""}
          </p>

        </div>

        <div className="cart-layout">

          <div className="cart-items">

            {items.map(
              (item, index) => (

                <CartItem
                  key={`${item.productId}-${item.packageWeight}-${item.packageUnit}-${index}`}
                  item={item}
                />

              )
            )}

          </div>

          <aside className="cart-summary">

            <h2>
              Order Summary
            </h2>

            <div>
              <span>
                Subtotal
              </span>

              <strong>
                ₹{subtotal}
              </strong>
            </div>

            <div>
              <span>
                Delivery
              </span>

              <span>
                Calculated at checkout
              </span>
            </div>

            <hr />

            <div className="summary-total">

              <span>
                Total
              </span>

              <strong>
                ₹{subtotal}
              </strong>

            </div>

            <Link
              to="/customer/checkout"
              className="checkout-button"
            >
              Checkout
            </Link>

          </aside>

        </div>

      </main>

    </div>
  );
};

export default Cart;