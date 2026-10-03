import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  role?: "customer" | "manager";
}

const ProtectedRoute = ({
  children,
  role,
}: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;