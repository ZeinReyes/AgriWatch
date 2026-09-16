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


/* =====================================================
   AUTH
===================================================== */

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyResetOTP from "./pages/auth/VerifyResetOTP";
import ResetPassword from "./pages/auth/ResetPassword";


/* =====================================================
   ADMIN
===================================================== */

import AdminUsers from "./pages/admin/AdminUsers";


/* =====================================================
   FARM / CROP
===================================================== */

import MyFarm from "./pages/farm/MyFarm";
import MyCrops from "./pages/crops/MyCrops";


/* =====================================================
   MONITORING
===================================================== */

import Monitoring from "./pages/monitoring/Monitoring";
import Alerts from "./pages/alerts/Alerts";
import SensorData from "./pages/monitoring/SensorData";
import PestDisease from "./pages/monitoring/PestDisease";


/* =====================================================
   WEATHER
===================================================== */

import Weather from "./pages/weather/Weather";


/* =====================================================
   IRRIGATION
===================================================== */

import Irrigation from "./pages/irrigation/Irrigation";


/* =====================================================
   REPORTS
===================================================== */

import Reports from "./pages/reports/Reports";


/* =====================================================
   DASHBOARD
===================================================== */

import Dashboard from "./pages/Dashboard";

import Settings from "./pages/settings/Settings";


/* =====================================================
   PLACEHOLDER
===================================================== */

const PlaceholderPage = ({
  title,
  description,
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
        {description ||
          "This section is under development."}
      </p>

    </div>
  );
};


/* =====================================================
   APP
===================================================== */

const App = () => {

  return (
    <BrowserRouter>

      <AuthProvider>

        <Routes>

          {/* =================================================
              AUTH
          ================================================= */}

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


          {/* =================================================
              DASHBOARD
              ADMIN + FARMER + VIEWER
          ================================================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "farmer",
                    "viewer",
                  ]}
                >
                  <Dashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* =================================================
              CROP MONITORING
              ADMIN + FARMER
          ================================================= */}

          <Route
            path="/monitoring"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "farmer",
                  ]}
                >
                  <Monitoring />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          <Route
            path="/sensor-data"
            element={
              <ProtectedRoute>
                <SensorData />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pest-disease"
            element={
              <ProtectedRoute>
                <PestDisease />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              ALERTS
              ADMIN + FARMER
          ================================================= */}

          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "farmer",
                  ]}
                >
                  <Alerts />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* =================================================
              WEATHER
              ADMIN + FARMER
          ================================================= */}

          <Route
            path="/weather"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "farmer",
                  ]}
                >
                  <Weather />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* =================================================
              IRRIGATION
              ADMIN + FARMER
          ================================================= */}

          <Route
            path="/irrigation"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "farmer",
                  ]}
                >
                  <Irrigation />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* =================================================
              REPORTS
              ADMIN + FARMER + VIEWER
          ================================================= */}

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "farmer",
                    "viewer",
                  ]}
                >
                  <Reports />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* =================================================
              SETTINGS
              ADMIN + FARMER
          ================================================= */}

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin", "farmer"]}>
                  <Settings />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* =================================================
              FARM
              ADMIN + FARMER
          ================================================= */}

          <Route
            path="/farm"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "farmer",
                  ]}
                >
                  <MyFarm />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* =================================================
              CROPS
              ADMIN + FARMER
          ================================================= */}

          <Route
            path="/crops"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "farmer",
                  ]}
                >
                  <MyCrops />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* =================================================
              ADMIN USER MANAGEMENT
              ADMIN ONLY
          ================================================= */}

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <RoleRoute
                  allowedRoles={[
                    "admin",
                  ]}
                >
                  <AdminUsers />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* =================================================
              ADMIN SYSTEM SETTINGS
              ADMIN ONLY
          ================================================= */}

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
                    description="Manage system-level AgriWatch settings."
                  />
                </RoleRoute>
              </ProtectedRoute>
            }
          />


          {/* =================================================
              LEGACY ANALYTICS
          ================================================= */}

          <Route
            path="/analytics"
            element={
              <Navigate
                to="/reports"
                replace
              />
            }
          />


          {/* =================================================
              ROOT
          ================================================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />


          {/* =================================================
              UNKNOWN ROUTE
          ================================================= */}

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