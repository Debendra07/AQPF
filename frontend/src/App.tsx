import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import ManagerDashboard from "./pages/manager/ManagerDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

import Products from "./pages/manager/Products";

import Home from "./pages/customer/Home";
import Shop from "./pages/customer/Shop";
import ProductDetails from "./pages/customer/ProductDetails";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Orders from "./pages/customer/Orders";
import OrderDetails from "./pages/customer/OrderDetails";

import ManagerOrders from "./pages/manager/Orders";
import ManagerRegister from "./pages/manager/ManagerRegister";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            ROOT
        ========================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* =========================
            AUTH
        ========================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =========================
            MANAGER REGISTRATION
        ========================== */}

        <Route
          path="/manager/register"
          element={<ManagerRegister />}
        />

        {/* =========================
            MANAGER DASHBOARD
        ========================== */}

        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute role="manager">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Keep old /manager URL working */}
        <Route
          path="/manager"
          element={
            <Navigate
              to="/manager/dashboard"
              replace
            />
          }
        />

        {/* =========================
            MANAGER PRODUCTS
        ========================== */}

        <Route
          path="/manager/products"
          element={
            <ProtectedRoute role="manager">
              <Products />
            </ProtectedRoute>
          }
        />

        {/* =========================
            MANAGER ORDERS
        ========================== */}

        <Route
          path="/manager/orders"
          element={
            <ProtectedRoute role="manager">
              <ManagerOrders />
            </ProtectedRoute>
          }
        />

        {/* =========================
            CUSTOMER DASHBOARD
        ========================== */}

        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute role="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* =========================
            CUSTOMER HOME
        ========================== */}

        <Route
          path="/customer"
          element={
            <ProtectedRoute role="customer">
              <Home />
            </ProtectedRoute>
          }
        />

        {/* =========================
            CUSTOMER SHOP
        ========================== */}

        <Route
          path="/customer/shop"
          element={
            <ProtectedRoute role="customer">
              <Shop />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PRODUCT DETAILS
        ========================== */}

        <Route
          path="/customer/product/:id"
          element={
            <ProtectedRoute role="customer">
              <ProductDetails />
            </ProtectedRoute>
          }
        />

        {/* =========================
            CART
        ========================== */}

        <Route
          path="/customer/cart"
          element={
            <ProtectedRoute role="customer">
              <Cart />
            </ProtectedRoute>
          }
        />

        {/* =========================
            CHECKOUT
        ========================== */}

        <Route
          path="/customer/checkout"
          element={
            <ProtectedRoute role="customer">
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* =========================
            CUSTOMER ORDERS
        ========================== */}

        <Route
          path="/customer/orders"
          element={
            <ProtectedRoute role="customer">
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* =========================
            ORDER DETAILS
        ========================== */}

        <Route
          path="/customer/orders/:id"
          element={
            <ProtectedRoute role="customer">
              <OrderDetails />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;