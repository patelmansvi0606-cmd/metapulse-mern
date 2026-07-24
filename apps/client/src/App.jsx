<<<<<<< HEAD
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
=======
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
>>>>>>> 64c3c44eb5acaf338a9cfcb7bf034ad0b9d71942
import { AuthPage } from "./pages/AuthPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { StudioPage } from "./pages/StudioPage.jsx";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
<<<<<<< HEAD
          <Route path="/" element={<LandingPage />} />
=======
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
>>>>>>> 64c3c44eb5acaf338a9cfcb7bf034ad0b9d71942
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/w/:workspaceId/studio"
            element={
              <ProtectedRoute>
                <StudioPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
