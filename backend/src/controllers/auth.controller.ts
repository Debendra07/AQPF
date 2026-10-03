import { Request, Response } from "express";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  comparePassword,
  generateToken,
  hashPassword
} from "../services/auth.service.js";

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      password,
      managerCode
    } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
      return;
    }

    /*
     * -----------------------------------------
     * DETERMINE USER ROLE
     * -----------------------------------------
     *
     * Normal registration:
     *     role = customer
     *
     * Manager registration:
     *     managerCode must match the backend
     *     environment variable.
     */

    let role: "customer" | "manager" = "customer";

    if (managerCode) {
      const configuredManagerCode =
        process.env.MANAGER_REGISTRATION_CODE;

      if (!configuredManagerCode) {
        console.error(
          "MANAGER_REGISTRATION_CODE is not configured"
        );

        res.status(500).json({
          success: false,
          message:
            "Manager registration is not configured"
        });

        return;
      }

      if (managerCode !== configuredManagerCode) {
        res.status(401).json({
          success: false,
          message:
            "Invalid manager registration code"
        });

        return;
      }

      role = "manager";
    }

    const hashedPassword =
      await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      password: hashedPassword,
      role
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message:
        role === "manager"
          ? "Manager registration successful"
          : "Registration successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
      return;
    }

    const passwordMatch = await comparePassword(
      password,
      user.password
    );

    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
      return;
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    const user = await User.findById(req.user.id).select(
      "-password"
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      success: false,
      message: "Could not retrieve user"
    });
  }
};