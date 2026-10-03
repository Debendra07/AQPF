import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuthStore } from "../../store/authStore";
import {
  getManagerProducts,
  type Product,
} from "../../services/productService";
import {
  getAllOrders,
  type Order,
} from "../../services/orderService";

const ManagerDashboard = () => {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [productResult, orderResult] =
        await Promise.allSettled([
          getManagerProducts(),
          getAllOrders(),
        ]);

      if (productResult.status === "fulfilled") {
        setProducts(productResult.value);
      } else {
        console.error(
          "Product API failed:",
          productResult.reason
        );
        setProducts([]);
      }

      if (orderResult.status === "fulfilled") {
        setOrders(orderResult.value);
      } else {
        console.error(
          "Order API failed:",
          orderResult.reason
        );

        setOrders([]);

        setError(
          "Product data loaded. Order data is currently unavailable."
        );
      }
    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );

      setError(
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadDashboard]);

  const handleLogout = () => {
    logout();
    navigate("/login", {
      replace: true,
    });
  };

  /*
   * ============================
   * PRODUCT STATISTICS
   * ============================
   */

  const totalProducts = products.length;

  const availableProducts = products.filter(
    (product) => product.isAvailable
  ).length;

  // const unavailableProducts = products.filter(
  //   (product) => !product.isAvailable
  // ).length;

  /*
   * Convert stock to grams so kg/g products
   * can be compared consistently.
   */
  const stockInGrams = (product: Product) => {
    if (product.stockUnit === "kg") {
      return product.stock * 1000;
    }

    return product.stock;
  };

  const lowStockProducts = products.filter(
    (product) => {
      const grams = stockInGrams(product);

      return grams > 0 && grams <= 2000;
    }
  );

  const outOfStockProducts = products.filter(
    (product) =>
      product.stock <= 0
  );

  /*
   * ============================
   * ORDER STATISTICS
   * ============================
   */

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) =>
      order.status === "pending"
  ).length;

  const preparingOrders = orders.filter(
    (order) =>
      order.status === "preparing" ||
      order.status === "confirmed"
  ).length;

  const deliveryOrders = orders.filter(
    (order) =>
      order.status === "out_for_delivery"
  ).length;

  const deliveredOrders = orders.filter(
    (order) =>
      order.status === "delivered"
  ).length;

  const cancelledOrders = orders.filter(
    (order) =>
      order.status === "cancelled"
  ).length;

  /*
   * Revenue:
   * Ignore cancelled orders.
   */
  const totalRevenue = orders
    .filter(
      (order) =>
        order.status !== "cancelled"
    )
    .reduce(
      (total, order) =>
        total + order.total,
      0
    );

  const deliveredRevenue = orders
    .filter(
      (order) =>
        order.status === "delivered"
    )
    .reduce(
      (total, order) =>
        total + order.total,
      0
    );

  /*
   * ============================
   * CUSTOMER COUNT
   * ============================
   *
   * We don't currently have a customer
   * API, so derive unique customers from
   * orders.
   */
  const customerCount = useMemo(() => {
    const customers = new Set<string>();

    orders.forEach((order) => {
      if (!order.userId) {
        return;
      }

      if (
        typeof order.userId === "string"
      ) {
        customers.add(order.userId);
        return;
      }

      customers.add(
        order.userId.name
      );
    });

    return customers.size;
  }, [orders]);

  /*
   * ============================
   * RECENT ORDERS
   * ============================
   */

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
  }, [orders]);

  /*
   * ============================
   * FORMATTERS
   * ============================
   */

  const formatCurrency = (
    value: number
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(value);
  };

  const formatDate = (
    date: string
  ) => {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatStatus = (
    status: Order["status"]
  ) => {
    switch (status) {
      case "out_for_delivery":
        return "Out for Delivery";

      case "preparing":
        return "Preparing";

      case "confirmed":
        return "Confirmed";

      case "delivered":
        return "Delivered";

      case "cancelled":
        return "Cancelled";

      case "pending":
      default:
        return "Pending";
    }
  };

  const getStatusClass = (
    status: Order["status"]
  ) => {
    switch (status) {
      case "delivered":
        return "status delivered";

      case "cancelled":
        return "status cancelled";

      case "preparing":
        return "status preparing";

      case "confirmed":
        return "status confirmed";

      case "out_for_delivery":
        return "status delivery";

      case "pending":
      default:
        return "status pending";
    }
  };

  if (loading) {
    return (
      <div className="manager-page">
        <div className="loading-container">
          <div className="loading-spinner" />

          <p>
            Loading AQPF Manager Dashboard...
          </p>
        </div>

        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="manager-page">

      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-name">
            AQPF
          </div>

          <div className="brand-subtitle">
            Manager Panel
          </div>
        </div>

        <nav className="sidebar-nav">

          <Link
            to="/manager/dashboard"
            className="nav-item active"
          >
            <span className="nav-icon">
              📊
            </span>

            Dashboard
          </Link>

          <Link
            to="/manager/products"
            className="nav-item"
          >
            <span className="nav-icon">
              🐟
            </span>

            Products
          </Link>

          <Link
            to="/manager/products"
            className="nav-item"
          >
            <span className="nav-icon">
              📦
            </span>

            Inventory
          </Link>

          <Link
            to="/manager/orders"
            className="nav-item"
          >
            <span className="nav-icon">
              🛒
            </span>

            Orders

            {pendingOrders > 0 && (
              <span className="nav-badge">
                {pendingOrders}
              </span>
            )}
          </Link>

        </nav>

        <div className="sidebar-bottom">

          <div className="manager-profile">

            <div className="profile-avatar">
              {user?.name
                ?.charAt(0)
                .toUpperCase() || "M"}
            </div>

            <div>
              <div className="profile-name">
                {user?.name || "Manager"}
              </div>

              <div className="profile-role">
                Manager
              </div>
            </div>

          </div>

          <button
            onClick={handleLogout}
            className="logout-button"
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================
          MAIN CONTENT
      ====================================== */}

      <main className="main-content">

        {/* HEADER */}

        <header className="top-header">

          <div>
            <h1>
              Manager Dashboard
            </h1>

            <p>
              Welcome back,{" "}
              <strong>
                {user?.name || "Manager"}
              </strong>
              . Here's what's happening
              with AQPF today.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadDashboard}
          >
            ↻ Refresh
          </button>

        </header>

        {/* ERROR */}

        {error && (
          <div className="error-box">
            ⚠️ {error}
          </div>
        )}

        {/* =====================================
            SUMMARY CARDS
        ====================================== */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon blue">
              🐟
            </div>

            <div className="stat-content">
              <span className="stat-label">
                Total Products
              </span>

              <strong className="stat-value">
                {totalProducts}
              </strong>

              <span className="stat-description">
                {availableProducts} available
              </span>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon orange">
              🛒
            </div>

            <div className="stat-content">
              <span className="stat-label">
                Total Orders
              </span>

              <strong className="stat-value">
                {totalOrders}
              </strong>

              <span className="stat-description">
                {pendingOrders} pending
              </span>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon green">
              ₹
            </div>

            <div className="stat-content">
              <span className="stat-label">
                Total Revenue
              </span>

              <strong className="stat-value">
                {formatCurrency(
                  totalRevenue
                )}
              </strong>

              <span className="stat-description">
                {formatCurrency(
                  deliveredRevenue
                )} delivered
              </span>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon purple">
              👥
            </div>

            <div className="stat-content">
              <span className="stat-label">
                Customers
              </span>

              <strong className="stat-value">
                {customerCount}
              </strong>

              <span className="stat-description">
                From placed orders
              </span>
            </div>

          </div>

        </section>

        {/* =====================================
            ORDER STATUS OVERVIEW
        ====================================== */}

        <section className="status-grid">

          <div className="status-summary">

            <div className="summary-header">
              <div>
                <h2>
                  Order Overview
                </h2>

                <p>
                  Current order status
                </p>
              </div>

              <Link
                to="/manager/orders"
                className="view-link"
              >
                View All →
              </Link>
            </div>

            <div className="order-status-grid">

              <div className="order-status-card">
                <span className="status-number pending-text">
                  {pendingOrders}
                </span>

                <span>
                  Pending
                </span>
              </div>

              <div className="order-status-card">
                <span className="status-number confirmed-text">
                  {preparingOrders}
                </span>

                <span>
                  Preparing
                </span>
              </div>

              <div className="order-status-card">
                <span className="status-number delivery-text">
                  {deliveryOrders}
                </span>

                <span>
                  Out for Delivery
                </span>
              </div>

              <div className="order-status-card">
                <span className="status-number delivered-text">
                  {deliveredOrders}
                </span>

                <span>
                  Delivered
                </span>
              </div>

            </div>

          </div>

        </section>

        {/* =====================================
            QUICK ACTIONS
        ====================================== */}

        <section className="section">

          <div className="section-header">
            <div>
              <h2>
                Quick Actions
              </h2>

              <p>
                Manage your AQPF store
              </p>
            </div>
          </div>

          <div className="quick-actions">

            <Link
              to="/manager/products"
              className="quick-action blue-action"
            >
              <span className="quick-icon">
                ➕
              </span>

              <div>
                <strong>
                  Add Product
                </strong>

                <span>
                  Add fish or chicken
                </span>
              </div>
            </Link>

            <Link
              to="/manager/products"
              className="quick-action green-action"
            >
              <span className="quick-icon">
                📦
              </span>

              <div>
                <strong>
                  Manage Inventory
                </strong>

                <span>
                  Check stock levels
                </span>
              </div>
            </Link>

            <Link
              to="/manager/orders"
              className="quick-action orange-action"
            >
              <span className="quick-icon">
                🛒
              </span>

              <div>
                <strong>
                  Manage Orders
                </strong>

                <span>
                  Process customer orders
                </span>
              </div>
            </Link>

          </div>

        </section>

        {/* =====================================
            RECENT ORDERS + LOW STOCK
        ====================================== */}

        <div className="two-column">

          {/* RECENT ORDERS */}

          <section className="panel">

            <div className="panel-header">

              <div>
                <h2>
                  Recent Orders
                </h2>

                <p>
                  Latest customer orders
                </p>
              </div>

              <Link
                to="/manager/orders"
                className="view-link"
              >
                View All
              </Link>

            </div>

            {recentOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  🛒
                </div>

                <p>
                  No orders yet
                </p>

                <span>
                  Customer orders will appear
                  here.
                </span>
              </div>
            ) : (
              <div className="orders-list">

                {recentOrders.map(
                  (order) => {

                    const customerName =
                      typeof order.userId ===
                      "object" &&
                      order.userId
                        ? order.userId.name
                        : order.address
                            .fullName;

                    return (
                      <div
                        key={order._id}
                        className="order-row"
                      >

                        <div className="order-info">

                          <strong>
                            #
                            {order._id
                              .slice(-6)
                              .toUpperCase()}
                          </strong>

                          <span>
                            {customerName}
                          </span>

                        </div>

                        <div className="order-middle">

                          <span>
                            {order.items.length}{" "}
                            item
                            {order.items.length !==
                            1
                              ? "s"
                              : ""}
                          </span>

                          <small>
                            {formatDate(
                              order.createdAt
                            )}
                          </small>

                        </div>

                        <div className="order-right">

                          <strong>
                            {formatCurrency(
                              order.total
                            )}
                          </strong>

                          <span
                            className={getStatusClass(
                              order.status
                            )}
                          >
                            {formatStatus(
                              order.status
                            )}
                          </span>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>

          {/* LOW STOCK */}

          <section className="panel">

            <div className="panel-header">

              <div>
                <h2>
                  Inventory Alerts
                </h2>

                <p>
                  Products needing attention
                </p>
              </div>

              <Link
                to="/manager/products"
                className="view-link"
              >
                Manage
              </Link>

            </div>

            {outOfStockProducts.length ===
              0 &&
            lowStockProducts.length ===
              0 ? (
              <div className="empty-state">

                <div className="empty-icon">
                  ✓
                </div>

                <p>
                  Inventory looks good
                </p>

                <span>
                  No low-stock products.
                </span>

              </div>
            ) : (
              <div className="inventory-list">

                {[
                  ...outOfStockProducts,
                  ...lowStockProducts.filter(
                    (product) =>
                      !outOfStockProducts.some(
                        (item) =>
                          item._id ===
                          product._id
                      )
                  ),
                ]
                  .slice(0, 6)
                  .map((product) => (

                    <div
                      key={product._id}
                      className="inventory-row"
                    >

                      <div className="product-mini">

                        <div className="product-mini-image">

                          {product.image ? (
                            <img
                              src={product.image}
                              alt={
                                product.name
                              }
                            />
                          ) : (
                            product.category ===
                            "fish"
                              ? "🐟"
                              : "🍗"
                          )}

                        </div>

                        <div>
                          <strong>
                            {product.name}
                          </strong>

                          <span>
                            {product.category}
                          </span>
                        </div>

                      </div>

                      <div className="stock-info">

                        <strong
                          className={
                            product.stock <=
                            0
                              ? "out-stock"
                              : "low-stock"
                          }
                        >
                          {product.stock}{" "}
                          {product.stockUnit}
                        </strong>

                        <span>
                          {product.stock <=
                          0
                            ? "Out of stock"
                            : "Low stock"}
                        </span>

                      </div>

                    </div>

                  ))}

              </div>
            )}

          </section>

        </div>

        {/* =====================================
            STORE SUMMARY
        ====================================== */}

        <section className="store-summary">

          <div className="summary-box">

            <span className="summary-box-icon">
              🐟
            </span>

            <div>
              <strong>
                Fish Products
              </strong>

              <span>
                {
                  products.filter(
                    (p) =>
                      p.category ===
                      "fish"
                  ).length
                } products
              </span>
            </div>

          </div>

          <div className="summary-box">

            <span className="summary-box-icon">
              🍗
            </span>

            <div>
              <strong>
                Chicken Products
              </strong>

              <span>
                {
                  products.filter(
                    (p) =>
                      p.category ===
                      "chicken"
                  ).length
                } products
              </span>
            </div>

          </div>

          <div className="summary-box">

            <span className="summary-box-icon">
              ⚠️
            </span>

            <div>
              <strong>
                Stock Alerts
              </strong>

              <span>
                {lowStockProducts.length +
                  outOfStockProducts.length}{" "}
                products
              </span>
            </div>

          </div>

          <div className="summary-box">

            <span className="summary-box-icon">
              ❌
            </span>

            <div>
              <strong>
                Cancelled Orders
              </strong>

              <span>
                {cancelledOrders} orders
              </span>
            </div>

          </div>

        </section>

      </main>

      <style>{styles}</style>
    </div>
  );
};

const styles = `
* {
  box-sizing: border-box;
}

.manager-page {
  min-height: 100vh;
  background: #f5f7fa;
  color: #172033;
  display: flex;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

/* ================================
   SIDEBAR
================================ */

.sidebar {
  width: 250px;
  min-height: 100vh;
  background: #111827;
  color: white;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.brand {
  padding: 28px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.brand-name {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 6px;
}

.brand-subtitle {
  color: #9ca3af;
  font-size: 12px;
  margin-top: 4px;
}

.sidebar-nav {
  padding: 22px 12px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  margin-bottom: 6px;
  border-radius: 9px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: 0.2s;
}

.nav-item:hover {
  background: #1f2937;
  color: white;
}

.nav-item.active {
  background: #0f766e;
  color: white;
}

.nav-icon {
  width: 22px;
  text-align: center;
}

.nav-badge {
  margin-left: auto;
  background: #ef4444;
  color: white;
  min-width: 21px;
  height: 21px;
  padding: 0 6px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.sidebar-bottom {
  padding: 18px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.manager-profile {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 16px;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #0f766e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.profile-name {
  font-size: 13px;
  font-weight: 700;
}

.profile-role {
  color: #9ca3af;
  font-size: 11px;
  margin-top: 2px;
}

.logout-button {
  width: 100%;
  height: 40px;
  border: 1px solid #374151;
  background: transparent;
  color: #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.logout-button:hover {
  background: #1f2937;
  color: white;
}

/* ================================
   MAIN
================================ */

.main-content {
  margin-left: 250px;
  width: calc(100% - 250px);
  padding: 32px 38px 50px;
  max-width: 1600px;
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.top-header h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
}

.top-header p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 14px;
}

.refresh-button {
  border: 1px solid #d1d5db;
  background: white;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #374151;
}

.refresh-button:hover {
  background: #f8fafc;
}

.error-box {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 9px;
  padding: 13px 16px;
  margin-bottom: 22px;
}

/* ================================
   STATS
================================ */

.stats-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 13px;
  padding: 21px;
  display: flex;
  gap: 15px;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  font-weight: 800;
}

.stat-icon.blue {
  background: #eff6ff;
}

.stat-icon.orange {
  background: #fff7ed;
}

.stat-icon.green {
  background: #ecfdf5;
  color: #047857;
}

.stat-icon.purple {
  background: #f5f3ff;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  color: #64748b;
  font-size: 12px;
}

.stat-value {
  font-size: 24px;
  margin-top: 3px;
}

.stat-description {
  color: #94a3b8;
  font-size: 11px;
  margin-top: 2px;
}

/* ================================
   STATUS
================================ */

.status-grid {
  margin-bottom: 25px;
}

.status-summary,
.panel,
.section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 13px;
}

.status-summary {
  padding: 22px;
}

.summary-header,
.panel-header,
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-header h2,
.panel-header h2,
.section-header h2 {
  margin: 0;
  font-size: 17px;
}

.summary-header p,
.panel-header p,
.section-header p {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 12px;
}

.view-link {
  color: #0f766e;
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
}

.order-status-grid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 14px;
  margin-top: 20px;
}

.order-status-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 17px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  color: #64748b;
}

.status-number {
  font-size: 25px;
  font-weight: 800;
}

.pending-text {
  color: #d97706;
}

.confirmed-text {
  color: #2563eb;
}

.delivery-text {
  color: #7c3aed;
}

.delivered-text {
  color: #059669;
}

/* ================================
   QUICK ACTIONS
================================ */

.section {
  padding: 22px;
  margin-bottom: 25px;
}

.quick-actions {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: #172033;
  border: 1px solid #e5e7eb;
  border-radius: 11px;
  padding: 16px;
  transition: 0.2s;
}

.quick-action:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 20px
    rgba(15,23,42,0.06);
}

.quick-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  font-size: 19px;
}

.blue-action .quick-icon {
  background: #eff6ff;
}

.green-action .quick-icon {
  background: #ecfdf5;
}

.orange-action .quick-icon {
  background: #fff7ed;
}

.quick-action strong {
  display: block;
  font-size: 13px;
}

.quick-action span:not(.quick-icon) {
  display: block;
  color: #94a3b8;
  font-size: 11px;
  margin-top: 3px;
}

/* ================================
   TWO COLUMN
================================ */

.two-column {
  display: grid;
  grid-template-columns:
    minmax(0, 1.35fr)
    minmax(320px, 0.65fr);
  gap: 20px;
  margin-bottom: 25px;
}

.panel {
  padding: 22px;
  min-width: 0;
}

.orders-list {
  margin-top: 17px;
}

.order-row {
  display: grid;
  grid-template-columns:
    1.2fr
    0.9fr
    1fr;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid #f1f5f9;
}

.order-info,
.order-middle,
.order-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-info strong,
.order-right strong {
  font-size: 13px;
}

.order-info span,
.order-middle span {
  color: #64748b;
  font-size: 11px;
}

.order-middle small {
  color: #94a3b8;
  font-size: 10px;
}

.order-right {
  align-items: flex-end;
}

.status {
  display: inline-flex;
  width: fit-content;
  padding: 4px 7px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
}

.status.pending {
  background: #fff7ed;
  color: #c2410c;
}

.status.confirmed {
  background: #eff6ff;
  color: #1d4ed8;
}

.status.preparing {
  background: #eff6ff;
  color: #1d4ed8;
}

.status.delivery {
  background: #f5f3ff;
  color: #6d28d9;
}

.status.delivered {
  background: #ecfdf5;
  color: #047857;
}

.status.cancelled {
  background: #fef2f2;
  color: #b91c1c;
}

/* ================================
   INVENTORY
================================ */

.inventory-list {
  margin-top: 17px;
}

.inventory-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 0;
  border-top: 1px solid #f1f5f9;
}

.product-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.product-mini-image {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  font-size: 18px;
}

.product-mini-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-mini strong {
  display: block;
  font-size: 12px;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-mini span {
  display: block;
  text-transform: capitalize;
  color: #94a3b8;
  font-size: 10px;
  margin-top: 2px;
}

.stock-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stock-info strong {
  font-size: 12px;
}

.stock-info span {
  font-size: 9px;
  margin-top: 2px;
}

.low-stock {
  color: #d97706;
}

.out-stock {
  color: #dc2626;
}

/* ================================
   EMPTY
================================ */

.empty-state {
  padding: 38px 10px;
  text-align: center;
}

.empty-icon {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 19px;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.empty-state span {
  display: block;
  margin-top: 5px;
  color: #94a3b8;
  font-size: 11px;
}

/* ================================
   STORE SUMMARY
================================ */

.store-summary {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 15px;
}

.summary-box {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 11px;
  padding: 17px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-box-icon {
  font-size: 21px;
}

.summary-box strong {
  display: block;
  font-size: 12px;
}

.summary-box span:not(.summary-box-icon) {
  display: block;
  color: #94a3b8;
  font-size: 10px;
  margin-top: 3px;
}

/* ================================
   LOADING
================================ */

.loading-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #64748b;
}

.loading-spinner {
  width: 38px;
  height: 38px;
  border: 4px solid #e5e7eb;
  border-top-color: #0f766e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ================================
   RESPONSIVE
================================ */

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .store-summary {
    grid-template-columns:
      repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .sidebar {
    width: 210px;
  }

  .main-content {
    margin-left: 210px;
    width: calc(100% - 210px);
    padding: 25px;
  }

  .two-column {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .sidebar {
    position: static;
    width: 100%;
    min-height: auto;
  }

  .manager-page {
    display: block;
  }

  .sidebar-nav {
    display: flex;
    overflow-x: auto;
    padding: 10px;
  }

  .nav-item {
    white-space: nowrap;
  }

  .sidebar-bottom {
    display: none;
  }

  .main-content {
    margin-left: 0;
    width: 100%;
    padding: 20px 15px;
  }

  .stats-grid,
  .quick-actions,
  .order-status-grid,
  .store-summary {
    grid-template-columns: 1fr;
  }

  .top-header {
    align-items: flex-start;
    gap: 15px;
  }

  .top-header h1 {
    font-size: 24px;
  }
}
`;

export default ManagerDashboard;