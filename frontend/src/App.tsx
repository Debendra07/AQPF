import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [message, setMessage] = useState("Connecting to AQPF API...");

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await api.get("/");
        setMessage(response.data.message);
      } catch (error) {
        console.error(error);
        setMessage("❌ Could not connect to AQPF backend");
      }
    };

    testConnection();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        fontFamily: "Arial"
      }}
    >
      <h1>AQPF</h1>

      <p>Fresh Fish & Chicken</p>

      <h2>{message}</h2>
    </div>
  );
}

export default App;