import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center text-ink/60">
        <p>Loading…</p>
      </div>
    );
  }
  if (status === "anonymous") return <Navigate to="/login" replace />;
  return children;
}
