import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * JWT payload used by AQPF authentication.
 *
 * This matches auth.service.ts:
 * {
 *   id: user._id.toString(),
 *   role: user.role
 * }
 */
export interface TokenPayload {
  id: string;
  role: string;
}

/**
 * Express request with authenticated user information.
 */
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Authenticate user using JWT Bearer token.
 *
 * Expected header:
 * Authorization: Bearer <JWT_TOKEN>
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Authorization header is required",
      });
      return;
    }

    // Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7).trim();

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
      return;
    }

    // Check JWT secret
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("❌ JWT_SECRET is not configured");

      res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
      return;
    }

    // Verify JWT
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;

    // Validate decoded payload
    if (!decoded || !decoded.id || !decoded.role) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    // Attach authenticated user to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    console.log("🔐 Authentication successful");
    console.log("   User ID:", decoded.id);
    console.log("   Role:", decoded.role);

    next();
  } catch (error) {
    console.error("❌ Authentication error:", error);

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Authentication token has expired",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};