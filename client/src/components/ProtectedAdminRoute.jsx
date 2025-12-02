// client/src/components/ProtectedAdminRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

/**
 * Use this to protect /admin routes.
 */
export default function ProtectedAdminRoute({ redirectTo = "/login" }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to={redirectTo} replace />;
  return <Outlet />;
}
