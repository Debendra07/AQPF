import axios from "axios";
import {
  useEffect,
  useState
} from "react";
import type { FormEvent } from "react";

import {
  useNavigate
} from "react-router-dom";

import CustomerNavbar from "../../components/customer/CustomerNavbar";

import {
  createOrder,
  createRazorpayCheckoutOrder,
  getOrderQuote,
  verifyRazorpayPayment,
  type PaymentMethod
} from "../../services/orderService";
import type {
  Address,
  OrderQuote
} from "../../services/orderService";

import {
  useCartStore
} from "../../store/cartStore";

const Checkout = () => {

  const navigate =
    useNavigate();

  const items =
    useCartStore(
      (state) => state.items
    );

  const clearCart =
    useCartStore(
      (state) => state.clearCart
    );

  const [address, setAddress] =
    useState<Address>({
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      landmark: ""
    });

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cod");

  const quoteItems = items.map((item) => ({
    productId: item.productId,
    packageWeight: item.packageWeight,
    packageUnit: item.packageUnit,
    quantity: item.quantity
  }));
  const quoteKey = JSON.stringify(quoteItems);

  const [quoteResult, setQuoteResult] = useState<{
    key: string;
    quote?: OrderQuote;
    error?: string;
  } | null>(null);

  const quoteIsCurrent = quoteResult?.key === quoteKey;
  const quote = quoteIsCurrent ? quoteResult?.quote ?? null : null;
  const quoteError = quoteIsCurrent ? quoteResult?.error ?? "" : "";
  const quoteLoading = items.length > 0 && !quoteIsCurrent;

  useEffect(() => {
    let isCurrent = true;

    if (items.length === 0) {
      return;
    }

    getOrderQuote(
      items.map((item) => ({
        productId: item.productId,
        packageWeight: item.packageWeight,
        packageUnit: item.packageUnit,
        quantity: item.quantity
      }))
    )
      .then((nextQuote) => {
        if (isCurrent) {
          setQuoteResult({
            key: quoteKey,
            quote: nextQuote
          });
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          const message = axios.isAxiosError<{ message?: string }>(error)
            ? error.response?.data?.message
            : undefined;
          setQuoteResult({
            key: quoteKey,
            error: message || "Unable to calculate your order total"
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [items, quoteKey]);

  const updateField = (
    field: keyof Address,
    value: string
  ) => {

    setAddress(
      (previous) => ({
        ...previous,
        [field]: value
      })
    );
  };

  const handleSubmit =
    async (
      event: FormEvent
    ) => {

      event.preventDefault();

      if (items.length === 0) {
        navigate(
          "/customer/cart"
        );
        return;
      }

      if (!quote || !quote.canPlaceOrder || quoteLoading) {
        return;
      }

      try {

        setPlacingOrder(true);

        if (paymentMethod === "razorpay") {
          const response =
            await createRazorpayCheckoutOrder(
              items.map(
                (item) => ({
                  productId:
                    item.productId,

                  packageWeight:
                    item.packageWeight,

                  packageUnit:
                    item.packageUnit,

                  quantity:
                    item.quantity
                })
              ),
              address
            );

          const scriptId = "razorpay-checkout-script";
          let script = document.getElementById(scriptId) as HTMLScriptElement | null;

          if (!script) {
            script = document.createElement("script");
            script.id = scriptId;
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
          }

          await new Promise<void>((resolve, reject) => {
            const check = () => {
              if ((window as typeof window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay) {
                resolve();
                return;
              }

              if (script?.dataset.failed === "true") {
                reject(new Error("Razorpay script failed to load"));
                return;
              }

              setTimeout(check, 200);
            };

            script.onload = () => {
              script!.dataset.loaded = "true";
              resolve();
            };
            script.onerror = () => {
              script!.dataset.failed = "true";
              reject(new Error("Unable to load Razorpay checkout"));
            };

            check();
          });

          const RazorpayCtor = (window as typeof window & {
            Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
          }).Razorpay;

          if (!RazorpayCtor) {
            throw new Error("Razorpay is not available in this browser");
          }

          const razorpayInstance = new RazorpayCtor({
            key: response.razorpay.key,
            amount: response.razorpay.order.amount,
            currency: response.razorpay.order.currency,
            name: "AQPF",
            description: "AQPF order payment",
            order_id: response.razorpay.order.id,
            handler: async (paymentResponse: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              const verification = await verifyRazorpayPayment({
                orderId: response.order._id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature
              });

              if (!verification.success) {
                alert(verification.message || "Payment verification failed");
                return;
              }

              clearCart();
              navigate(`/customer/orders/${response.order._id}`);
            },
            theme: {
              color: "#2563eb"
            },
            modal: {
              ondismiss: () => {
                alert("Payment cancelled. Your order remains pending.");
              }
            }
          });

          razorpayInstance.open();
          return;
        }

        const order =
          await createOrder(
            items.map(
              (item) => ({
                productId:
                  item.productId,

                packageWeight:
                  item.packageWeight,

                packageUnit:
                  item.packageUnit,

                quantity:
                  item.quantity
              })
            ),
            address,
            paymentMethod
          );

        clearCart();

        navigate(
          `/customer/orders/${order._id}`
        );

      } catch (error: unknown) {
        const message = axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message
          : undefined;
        alert(message || "Unable to place order");

      } finally {

        setPlacingOrder(false);

      }
    };

  if (items.length === 0) {
    return (
      <>
        <CustomerNavbar />

        <div className="empty-cart">
          <div>
            <h1>
              Your cart is empty
            </h1>
          </div>
        </div>
      </>
    );
  }

  return (
    <div>

      <CustomerNavbar />

      <main className="checkout-page">

        <div className="checkout-main">

          <h1>
            Checkout
          </h1>

          <form
            onSubmit={
              handleSubmit
            }
          >

            <section className="checkout-section">

              <h2>
                Delivery Address
              </h2>

              <div className="checkout-grid">

                <div>
                  <label>
                    Full Name
                  </label>

                  <input
                    required
                    value={
                      address.fullName
                    }
                    onChange={(e) =>
                      updateField(
                        "fullName",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    Phone
                  </label>

                  <input
                    required
                    type="tel"
                    value={
                      address.phone
                    }
                    onChange={(e) =>
                      updateField(
                        "phone",
                        e.target.value
                      )
                    }
                  />
                </div>

              </div>

              <div>
                <label>
                  Address Line 1
                </label>

                <input
                  required
                  value={
                    address.addressLine1
                  }
                  onChange={(e) =>
                    updateField(
                      "addressLine1",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>
                  Address Line 2
                </label>

                <input
                  value={
                    address.addressLine2
                  }
                  onChange={(e) =>
                    updateField(
                      "addressLine2",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="checkout-grid">

                <div>
                  <label>
                    City
                  </label>

                  <input
                    required
                    value={
                      address.city
                    }
                    onChange={(e) =>
                      updateField(
                        "city",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    State
                  </label>

                  <input
                    required
                    value={
                      address.state
                    }
                    onChange={(e) =>
                      updateField(
                        "state",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    PIN Code
                  </label>

                  <input
                    required
                    pattern="[0-9]{6}"
                    value={
                      address.pincode
                    }
                    onChange={(e) =>
                      updateField(
                        "pincode",
                        e.target.value
                      )
                    }
                  />
                </div>

              </div>

              <div>
                <label>
                  Landmark
                </label>

                <input
                  value={
                    address.landmark
                  }
                  onChange={(e) =>
                    updateField(
                      "landmark",
                      e.target.value
                    )
                  }
                />
              </div>

            </section>

            <section className="checkout-section">

              <h2>
                Payment Method
              </h2>

              <div className="payment-option">

                <input
                  type="radio"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />

                <div>
                  <strong>
                    Cash on Delivery
                  </strong>

                  <p>
                    Pay when your order
                    arrives.
                  </p>
                </div>

              </div>

              <div className="payment-option">

                <input
                  type="radio"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                />

                <div>
                  <strong>
                    Razorpay Online Payment
                  </strong>

                  <p>
                    Pay instantly with UPI,
                    cards, or net banking.
                  </p>
                </div>

              </div>

            </section>

            {quoteError && (
              <p role="alert">
                {quoteError}
              </p>
            )}

            {quote && quote.errors.length > 0 && (
              <ul className="checkout-errors" role="alert">
                {quote.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}

            <button
              className="place-order-button"
              disabled={placingOrder || quoteLoading || !quote || !quote.canPlaceOrder}
              type="submit"
            >
              {placingOrder
                ? paymentMethod === "razorpay"
                  ? "Preparing Razorpay checkout..."
                  : "Placing Order..."
                : quoteLoading
                  ? "Calculating total..."
                  : quote
                    ? quote.canPlaceOrder
                      ? paymentMethod === "razorpay"
                        ? `Pay ₹${quote.total} with Razorpay`
                        : `Place Order · ₹${quote.total}`
                      : "Fix unavailable items"
                    : "Order total unavailable"}
            </button>

          </form>

        </div>

        <aside className="checkout-summary">

          <h2>
            Order Summary
          </h2>

          {items.map(
            (item, index) => (

              <div
                className="checkout-item"
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
                  {quote?.items[index]?.lineTotal ??
                    "—"}
                </strong>

              </div>

            )
          )}

          <hr />

          <div>
            <span>
              Subtotal
            </span>

            <strong>
              ₹{quote?.subtotal ?? "—"}
            </strong>
          </div>

          <div>
            <span>
              Delivery
            </span>

            <strong>
              ₹{quote?.deliveryFee ?? "—"}
            </strong>
          </div>

          <hr />

          <div className="summary-total">

            <strong>
              Total
            </strong>

            <strong>
              ₹{quote?.total ?? "—"}
            </strong>

          </div>

        </aside>

      </main>

    </div>
  );
};

export default Checkout;