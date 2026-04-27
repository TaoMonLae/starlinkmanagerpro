import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm dark:bg-[#090b10]">Loading secure session...</div>;
  return token ? children : <Navigate to="/login" replace />;
}

