import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function AppHeader() {
  const { logout } = useAuth();

  return (
    <header className="border-b border-border-warm bg-canvas">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link
          to="/dashboard"
          className="font-display text-lg font-semibold text-plum"
        >
          MetaPulse
        </Link>
        <button
          onClick={logout}
          className="text-sm text-ink/60 hover:text-coral"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
