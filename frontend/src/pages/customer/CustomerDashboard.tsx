import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const CustomerDashboard = () => {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <h1>Welcome to AQPF 🐟🍗</h1>

      <h2>Hello, {user?.name}</h2>

      <p>Customer Dashboard</p>

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default CustomerDashboard;