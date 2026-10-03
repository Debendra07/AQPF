import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import { hashPassword } from "./services/auth.service.js";

dotenv.config();

const createManager = async (): Promise<void> => {
  try {
    const email = process.env.MANAGER_EMAIL?.trim().toLowerCase();
    const password = process.env.MANAGER_PASSWORD;
    const mongoUri = process.env.MONGODB_URI;

    if (!email) {
      throw new Error("MANAGER_EMAIL is required");
    }

    if (!password) {
      throw new Error("MANAGER_PASSWORD is required");
    }

    if (
      password.length < 12 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      throw new Error(
        "MANAGER_PASSWORD must be at least 12 characters and include lowercase, uppercase, numeric, and special characters"
      );
    }

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected");

    const existingManager = await User.findOne({
      email
    });

    /*
     * Manager already exists
     */
    if (existingManager) {
      if (existingManager.role !== "manager") {
        console.log(
          `Cannot seed manager: ${email} already belongs to a non-manager account.`
        );
        await mongoose.disconnect();
        process.exitCode = 1;
        return;
      }

      console.log("Manager account already exists.");
      await mongoose.disconnect();
      return;
    }

    /*
     * Create new manager
     */
    const hashedPassword =
      await hashPassword(password);

    await User.create({
      name: "AQPF Manager",
      email,
      password: hashedPassword,
      role: "manager"
    });

    console.log("");
    console.log("================================");
    console.log(`Manager account created for ${email}.`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Failed to create manager:", error);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exitCode = 1;
  }
};

createManager();