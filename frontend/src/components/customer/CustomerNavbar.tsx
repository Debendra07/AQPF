import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";

const CustomerNavbar = () => {
  const navigate = useNavigate();

  const user = useAuthStore(
    (state) => state.user
  );

  const logout = useAuthStore(
    (state) => state.logout
  );

  const cartItems = useCartStore(
    (state) => state.items
  );

  const cartCount = cartItems.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="customer-navbar">

      <Link
        to="/customer"
        className="logo"
      >
        AQPF
      </Link>

      <div className="nav-links">

        <Link to="/customer">
          Home
        </Link>

        <Link to="/customer/shop">
          Shop
        </Link>

        <Link to="/customer/shop?category=fish">
          Fish
        </Link>

        <Link to="/customer/shop?category=chicken">
          Chicken
        </Link>

        <Link to="/customer/orders">
          Orders
        </Link>

      </div>

      <div className="nav-actions">

        <Link to="/customer/cart">
          🛒 Cart ({cartCount})
        </Link>

        <span>
          {user?.name}
        </span>

        <button onClick={handleLogout}>
          Logout
        </button>

      </div>

    </nav>
  );
};

export default CustomerNavbar;