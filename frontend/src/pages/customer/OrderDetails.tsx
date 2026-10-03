import {
  useEffect,
  useState
} from "react";

import {
  useParams
} from "react-router-dom";

import CustomerNavbar
  from "../../components/customer/CustomerNavbar";

import {
  getMyOrder
} from "../../services/orderService";
import type { Order } from "../../services/orderService";

const statusSteps = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered"
];

const OrderDetails = () => {

  const { id } = useParams();

  const [order, setOrder] =
    useState<Order | null>(null);

  useEffect(() => {

    if (!id) return;

    getMyOrder(id)
      .then(setOrder)
      .catch(console.error);

  }, [id]);

  if (!order) {
    return (
      <>
        <CustomerNavbar />

        <div className="loading">
          Loading order...
        </div>
      </>
    );
  }

  const currentIndex =
    statusSteps.indexOf(
      order.status
    );

  return (
    <div>

      <CustomerNavbar />

      <main className="order-details-page">

        <h1>
          Order #
          {order._id.slice(-8)}
        </h1>

        <p>
          {new Date(
            order.createdAt
          ).toLocaleString()}
        </p>

        {order.status ===
        "cancelled" ? (

          <div className="cancelled-order">
            This order has been
            cancelled.
          </div>

        ) : (

          <div className="order-tracker">

            {statusSteps.map(
              (step, index) => (

                <div
                  key={step}
                  className={
                    index <= currentIndex
                      ? "tracker-step active"
                      : "tracker-step"
                  }
                >

                  <div className="tracker-dot" />

                  <span>
                    {step.replace(
                      /_/g,
                      " "
                    )}
                  </span>

                </div>

              )
            )}

          </div>

        )}

        <section className="order-section">

          <h2>
            Items
          </h2>

          {order.items.map(
            (item, index) => (

              <div
                className="order-item"
                key={index}
              >

                <div>
                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    {item.packageWeight}
                    {item.packageUnit}
                    {" × "}
                    {item.quantity}
                  </span>
                </div>

                <strong>
                  ₹
                  {item.price *
                    item.quantity}
                </strong>

              </div>

            )
          )}

        </section>

        <section className="order-section">

          <h2>
            Delivery Address
          </h2>

          <p>
            <strong>
              {order.address.fullName}
            </strong>
          </p>

          <p>
            {order.address.addressLine1}
          </p>

          {order.address.addressLine2 && (
            <p>
              {order.address.addressLine2}
            </p>
          )}

          <p>
            {order.address.city},{" "}
            {order.address.state}{" "}
            {order.address.pincode}
          </p>

          <p>
            Phone:{" "}
            {order.address.phone}
          </p>

        </section>

        <section className="order-total">

          <div>
            <span>
              Subtotal
            </span>

            <strong>
              ₹{order.subtotal}
            </strong>
          </div>

          <div>
            <span>
              Delivery
            </span>

            <strong>
              ₹{order.deliveryFee}
            </strong>
          </div>

          <div className="grand-total">

            <span>
              Total
            </span>

            <strong>
              ₹{order.total}
            </strong>

          </div>

          <p>
            Payment: {order.paymentMethod === "razorpay" ? "Razorpay Online Payment" : "Cash on Delivery"}
          </p>

        </section>

      </main>

    </div>
  );
};

export default OrderDetails;