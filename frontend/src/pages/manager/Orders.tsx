import axios from "axios";
import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getAllOrders,
  updateOrderStatus
} from "../../services/orderService";
import type { Order } from "../../services/orderService";

const statusOptions: Order["status"][] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled"
];

const nextStatuses: Record<
  Order["status"],
  Order["status"][]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: []
};

const ManagerOrders = () => {

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [filter, setFilter] =
    useState<
      Order["status"] | "all"
    >("all");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let isCurrent = true;

    const loadOrders = async () => {
      try {
        const data = await getAllOrders();
        if (isCurrent) {
          setOrders(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    void loadOrders();
    return () => {
      isCurrent = false;
    };
  }, []);

  const filteredOrders =
    useMemo(
      () =>
        filter === "all"
          ? orders
          : orders.filter(
              (order) =>
                order.status ===
                filter
            )
      , [orders, filter]
    );

  const handleStatusChange =
    async (
      id: string,
      status: Order["status"]
    ) => {

      try {

        const updated =
          await updateOrderStatus(
            id,
            status
          );

        setOrders(
          (previous) =>
            previous.map(
              (order) =>
                order._id === id
                  ? updated
                  : order
            )
        );

      } catch (error: unknown) {
        const message = axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message
          : undefined;
        alert(message || "Unable to update order");

      }
    };

  return (
    <div className="manager-page">

      <div className="page-header">

        <div>
          <h1>
            Orders
          </h1>

          <p>
            Manage customer orders.
          </p>
        </div>

      </div>

      <div className="order-filters">

        <button
          className={
            filter === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setFilter("all")
          }
        >
          All ({orders.length})
        </button>

        {statusOptions.map(
          (status) => {

            const count =
              orders.filter(
                (order) =>
                  order.status ===
                  status
              ).length;

            return (
              <button
                key={status}
                className={
                  filter === status
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter(status)
                }
              >
                {status.replace(
                  /_/g,
                  " "
                )}{" "}
                ({count})
              </button>
            );

          }
        )}

      </div>

      {loading ? (

        <p>
          Loading orders...
        </p>

      ) : (

        <div className="manager-orders">

          {filteredOrders.map(
            (order) => (

              <div
                className="manager-order-card"
                key={order._id}
              >

                <div className="manager-order-header">

                  <div>

                    <strong>
                      #{order._id.slice(-8)}
                    </strong>

                    <span>
                      {new Date(
                        order.createdAt
                      ).toLocaleString()}
                    </span>

                  </div>

                  <strong>
                    ₹{order.total}
                  </strong>

                </div>

                <div className="manager-order-customer">

                  <strong>
                    Customer
                  </strong>

                  <span>
                    {typeof order.userId === "object" &&
                    order.userId !== null
                      ? order.userId.name
                      : "Customer"}
                  </span>

                </div>

                <div className="manager-order-items">

                  {order.items.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={index}
                      >

                        <span>
                          {item.name}
                          {" — "}
                          {item.packageWeight}
                          {item.packageUnit}
                          {" × "}
                          {item.quantity}
                        </span>

                        <strong>
                          ₹
                          {item.price *
                            item.quantity}
                        </strong>

                      </div>

                    )
                  )}

                </div>

                <div className="manager-order-address">

                  <strong>
                    Delivery
                  </strong>

                  <p>
                    {order.address.fullName}
                  </p>

                  <p>
                    {order.address.addressLine1}
                  </p>

                  <p>
                    {order.address.city},{" "}
                    {order.address.state}{" "}
                    {order.address.pincode}
                  </p>

                  <p>
                    {order.address.phone}
                  </p>

                </div>

                <div className="manager-order-footer">

                  <span
                    className={`order-status ${order.status}`}
                  >
                    {order.status.replace(
                      /_/g,
                      " "
                    )}
                  </span>

                  {nextStatuses[order.status].length > 0 && (
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(
                          order._id,
                          e.target.value as Order["status"]
                        )
                      }
                    >
                      <option value={order.status}>
                        {order.status.replace(/_/g, " ")}
                      </option>
                      {nextStatuses[order.status].map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  )}

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );
};

export default ManagerOrders;