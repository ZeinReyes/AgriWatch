import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";


import {
  AuthProvider,
} from "./context/AuthContext";


import ProtectedRoute from "./components/common/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";


import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyResetOTP from "./pages/auth/VerifyResetOTP";
import ResetPassword from "./pages/auth/ResetPassword";
import AdminUsers from "./pages/admin/AdminUsers";
import MyFarm from "./pages/farm/MyFarm";
import MyCrops from "./pages/crops/MyCrops";
import Monitoring from "./pages/monitoring/Monitoring";
import Alerts from "./pages/alerts/Alerts";


import Dashboard from "./pages/Dashboard";


const PlaceholderPage = ({
  title,
}) => {

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Poppins, sans-serif",
      }}
    >

      <h1>
        {title}
      </h1>

      <p>
        This section is under development.
      </p>

    </div>
  );
};


const App = () => {

  return (
    <BrowserRouter>

      <AuthProvider>

        <Routes>

          {/* ===================================== */}
          {/* AUTH */}
          {/* ===================================== */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/signup"
            element={<Signup />}
          />

          <Route
            path="/verify-email"
            element={<VerifyEmail />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/verify-reset-otp"
            element={<VerifyResetOTP />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />


          {/* ===================================== */}
          {/* DASHBOARD */}
          {/* ===================================== */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />


          {/* ===================================== */}
          {/* FARMER + ADMIN */}
          {/* ===================================== */}

          <Route
            path="/farm"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["farmer", "admin"]}>
                  <MyFarm />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          <Route
            path="/crops"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={["farmer", "admin"]}
                >
                  <MyCrops />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* ===================================== */}
          {/* ALL ROLES */}
          {/* ===================================== */}

          <Route
            path="/monitoring"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["farmer", "admin", "viewer"]}>
                  <Monitoring />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin", "farmer", "viewer"]}>
                  <Alerts />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* ===================================== */}
          {/* ADMIN + VIEWER */}
          {/* ===================================== */}

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "viewer",
                  ]}
                >
                  <PlaceholderPage
                    title="Analytics"
                  />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* ===================================== */}
          {/* ADMIN */}
          {/* ===================================== */}

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin"]}>
                  <AdminUsers />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={[
                    "admin",
                  ]}
                >
                  <PlaceholderPage
                    title="System Settings"
                  />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* ===================================== */}
          {/* DEFAULT */}
          {/* ===================================== */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />


          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </AuthProvider>

    </BrowserRouter>
  );
};


export default App;