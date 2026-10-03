import { Link } from "react-router-dom";
import CustomerNavbar from "../../components/customer/CustomerNavbar";

const Home = () => {
  return (
    <>
      <CustomerNavbar />

      <main className="customer-home">
        <section className="hero">
          <div className="hero-content">
            <p className="hero-label">FRESH • CLEAN • DELIVERED</p>

            <h1>
              Fresh Fish & Chicken
              <br />
              Delivered to Your Door
            </h1>

            <p>
              Quality fish and chicken, cleaned and packed fresh for you.
            </p>

            <Link to="/customer/shop" className="hero-button">
              Shop Now
            </Link>
          </div>
        </section>

        <section className="category-section">
          <div className="section-heading">
            <p>SHOP BY CATEGORY</p>
            <h2>What are you looking for?</h2>
          </div>

          <div className="category-grid">
            <Link
              to="/customer/shop?category=fish"
              className="category-card fish-card"
            >
              <div className="category-icon">🐟</div>
              <h3>Fresh Fish</h3>
              <p>Fresh fish, cleaned and cut to your preference.</p>
              <span>Explore Fish →</span>
            </Link>

            <Link
              to="/customer/shop?category=chicken"
              className="category-card chicken-card"
            >
              <div className="category-icon">🍗</div>
              <h3>Fresh Chicken</h3>
              <p>Fresh chicken with convenient cuts and packages.</p>
              <span>Explore Chicken →</span>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;