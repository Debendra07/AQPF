import {
  useEffect,
  useState
} from "react";

import {
  Link
} from "react-router-dom";

import CustomerNavbar
  from "../../components/customer/CustomerNavbar";

import {
  getMyOrders
} from "../../services/orderService";
import type { Order } from "../../services/orderService";

const Orders = () => {

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const loadOrders =
      async () => {

        try {

          const data =
            await getMyOrders();

          setOrders(data);

        } catch (error) {

          console.error(
            error
          );

        } finally {

          setLoading(false);

        }
      };

    loadOrders();

  }, []);

  return (
    <div>

      <CustomerNavbar />

      <main className="orders-page">

        <h1>
          My Orders
        </h1>

        {loading ? (

          <p>
            Loading orders...
          </p>

        ) : orders.length === 0 ? (

          <div className="empty-state">

            <h2>
              No orders yet
            </h2>

            <Link
              to="/customer/shop"
              className="hero-button"
            >
              Start Shopping
            </Link>

          </div>

        ) : (

          <div className="orders-list">

            {orders.map(
              (order) => (

                <Link
                  key={order._id}
                  to={`/customer/orders/${order._id}`}
                  className="order-card"
                >

                  <div>

                    <strong>
                      Order #
                      {order._id.slice(-8)}
                    </strong>

                    <span>
                      {new Date(
                        order.createdAt
                      ).toLocaleDateString()}
                    </span>

                  </div>

                  <div>

                    <span>
                      {order.items.length}
                      {" item"}
                      {order.items.length !== 1
                        ? "s"
                        : ""}
                    </span>

                    <strong>
                      ₹{order.total}
                    </strong>

                  </div>

                  <span
                    className={`order-status ${order.status}`}
                  >
                    {order.status.replace(
                      /_/g,
                      " "
                    )}
                  </span>

                </Link>

              )
            )}

          </div>

        )}

      </main>

    </div>
  );
};

export default Orders;