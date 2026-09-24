import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "AQPF API is running 🚀"
  });
});

// Start server
const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 AQPF API running on http://localhost:${PORT}`);
  });
};

startServer();