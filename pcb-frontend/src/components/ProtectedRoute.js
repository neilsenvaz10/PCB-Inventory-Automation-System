import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  if (adminOnly) {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (user?.role !== "admin") return <Navigate to="/dashboard" />;
  }

  return children;
}
