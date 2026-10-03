import React, {
  useState,
  type FormEvent
} from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

interface ManagerRegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  managerCode: string;
}

interface RegisterResponse {
  message?: string;
  token?: string;
  accessToken?: string;
  user?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

const ManagerRegister: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<ManagerRegisterForm>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    managerCode: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return false;
    }

    if (form.name.trim().length < 3) {
      setError("Name must contain at least 3 characters.");
      return false;
    }

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return false;
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(form.phone.trim())) {
      setError("Please enter a valid 10-digit Indian phone number.");
      return false;
    }

    if (!form.password) {
      setError("Please enter a password.");
      return false;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    if (!form.managerCode.trim()) {
      setError("Please enter the manager registration code.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await axios.post<RegisterResponse>(
        `${API_URL}/api/auth/register`,
        {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          role: "manager",
          managerCode: form.managerCode.trim(),
        }
      );

      const data = response.data;

      /*
       * Save authentication token if the backend
       * returns one after registration.
       */
      const token = data.token || data.accessToken;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("accessToken", token);
      }

      /*
       * Save user information if returned.
       */
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      setSuccess(
        data.message ||
          "Manager account created successfully!"
      );

      /*
       * Give the success message a moment before
       * navigating to the manager dashboard.
       */
      setTimeout(() => {
        navigate("/manager/dashboard", { replace: true });
      }, 1000);
    } catch (err: unknown) {
      let message =
        "Manager registration failed. Please try again.";

      if (axios.isAxiosError(err)) {
        if (err.response?.data?.message) {
          message = err.response.data.message;
        } else if (err.response?.data?.error) {
          message = err.response.data.error;
        } else if (err.response?.status === 409) {
          message =
            "An account with this email already exists.";
        } else if (err.response?.status === 400) {
          message =
            "Invalid registration details. Please check your information.";
        } else if (err.response?.status === 401) {
          message =
            "Invalid manager registration code.";
        } else if (!err.response) {
          message =
            "Cannot connect to the backend server. Make sure the backend is running.";
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.backgroundCircleOne} />
      <div style={styles.backgroundCircleTwo} />

      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>AQPF</div>
          <div style={styles.logoSubtitle}>
            Fresh Fish & Chicken
          </div>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.managerIcon}>♟</div>

            <h1 style={styles.title}>
              Manager Registration
            </h1>

            <p style={styles.subtitle}>
              Create your AQPF manager account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.messageIcon}>!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={styles.successBox}>
              <span style={styles.messageIcon}>✓</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={styles.field}>
              <label style={styles.label}>
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={loading}
                style={styles.input}
              />
            </div>

            {/* Email */}
            <div style={styles.field}>
              <label style={styles.label}>
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="manager@example.com"
                autoComplete="email"
                disabled={loading}
                style={styles.input}
              />
            </div>

            {/* Phone */}
            <div style={styles.field}>
              <label style={styles.label}>
                Phone Number
              </label>

              <div style={styles.phoneWrapper}>
                <span style={styles.countryCode}>
                  +91
                </span>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  autoComplete="tel"
                  disabled={loading}
                  style={styles.phoneInput}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.field}>
              <label style={styles.label}>
                Password
              </label>

              <div style={styles.passwordWrapper}>
                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  disabled={loading}
                  style={styles.passwordInput}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  disabled={loading}
                  style={styles.showButton}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={styles.field}>
              <label style={styles.label}>
                Confirm Password
              </label>

              <div style={styles.passwordWrapper}>
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  disabled={loading}
                  style={styles.passwordInput}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  style={styles.showButton}
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
            </div>

            {/* Manager Code */}
            <div style={styles.field}>
              <label style={styles.label}>
                Manager Registration Code
              </label>

              <input
                type="password"
                name="managerCode"
                value={form.managerCode}
                onChange={handleChange}
                placeholder="Enter manager code"
                autoComplete="off"
                disabled={loading}
                style={styles.input}
              />

              <p style={styles.helperText}>
                This code is required to create a manager
                account.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                ...(loading
                  ? styles.submitButtonDisabled
                  : {}),
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner} />
                  Creating Account...
                </>
              ) : (
                "Create Manager Account"
              )}
            </button>
          </form>

          {/* Login */}
          <div style={styles.loginSection}>
            <span style={styles.loginText}>
              Already have a manager account?
            </span>

            <Link
              to="/login"
              style={styles.loginLink}
            >
              Login
            </Link>
          </div>

          {/* Customer registration */}
          <div style={styles.customerSection}>
            <span style={styles.customerText}>
              Want to create a customer account?
            </span>

            <Link
              to="/register"
              style={styles.customerLink}
            >
              Customer Registration
            </Link>
          </div>
        </div>

        <p style={styles.footer}>
          © {new Date().getFullYear()} AQPF. All rights
          reserved.
        </p>
      </div>
    </div>
  );
};

const styles: {
  [key: string]: React.CSSProperties;
} = {
  page: {
    minHeight: "100vh",
    background: "#f4f7f9",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: "border-box",
  },

  backgroundCircleOne: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background:
      "rgba(0, 128, 128, 0.06)",
    top: "-250px",
    right: "-180px",
    pointerEvents: "none",
  },

  backgroundCircleTwo: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background:
      "rgba(0, 128, 128, 0.04)",
    bottom: "-220px",
    left: "-150px",
    pointerEvents: "none",
  },

  container: {
    width: "100%",
    maxWidth: "480px",
    position: "relative",
    zIndex: 1,
  },

  logoContainer: {
    textAlign: "center",
    marginBottom: "24px",
  },

  logo: {
    fontSize: "38px",
    fontWeight: 900,
    letterSpacing: "7px",
    color: "#111827",
  },

  logoSubtitle: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "3px",
    letterSpacing: "0.5px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "36px",
    boxShadow:
      "0 15px 45px rgba(15, 23, 42, 0.10)",
    border: "1px solid #e5e7eb",
  },

  header: {
    textAlign: "center",
    marginBottom: "28px",
  },

  managerIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    background: "#111827",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 16px",
    fontSize: "24px",
  },

  title: {
    margin: 0,
    fontSize: "27px",
    fontWeight: 750,
    color: "#111827",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#6b7280",
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    padding: "12px 14px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  successBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    padding: "12px 14px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  messageIcon: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "currentColor",
    color: "#ffffff",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 700,
    fontSize: "13px",
    flexShrink: 0,
  },

  field: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "7px",
  },

  input: {
    width: "100%",
    height: "46px",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    padding: "0 14px",
    fontSize: "14px",
    color: "#111827",
    background: "#ffffff",
    outline: "none",
  },

  phoneWrapper: {
    display: "flex",
    height: "46px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    overflow: "hidden",
    background: "#ffffff",
  },

  countryCode: {
    display: "flex",
    alignItems: "center",
    padding: "0 13px",
    background: "#f9fafb",
    borderRight: "1px solid #d1d5db",
    color: "#374151",
    fontSize: "14px",
    fontWeight: 600,
  },

  phoneInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    padding: "0 14px",
    fontSize: "14px",
    color: "#111827",
  },

  passwordWrapper: {
    display: "flex",
    height: "46px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    overflow: "hidden",
    background: "#ffffff",
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    padding: "0 14px",
    fontSize: "14px",
    color: "#111827",
  },

  showButton: {
    border: "none",
    background: "transparent",
    padding: "0 13px",
    color: "#0f766e",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "13px",
  },

  helperText: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#6b7280",
  },

  submitButton: {
    width: "100%",
    height: "48px",
    border: "none",
    borderRadius: "9px",
    background: "#111827",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    marginTop: "8px",
  },

  submitButtonDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },

  spinner: {
    width: "17px",
    height: "17px",
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },

  loginSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "5px",
    marginTop: "24px",
    fontSize: "13px",
  },

  loginText: {
    color: "#6b7280",
  },

  loginLink: {
    color: "#0f766e",
    fontWeight: 700,
    textDecoration: "none",
  },

  customerSection: {
    borderTop: "1px solid #e5e7eb",
    marginTop: "22px",
    paddingTop: "20px",
    textAlign: "center",
  },

  customerText: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "6px",
  },

  customerLink: {
    color: "#111827",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
  },

  footer: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "12px",
    color: "#9ca3af",
  },
};

export default ManagerRegister;