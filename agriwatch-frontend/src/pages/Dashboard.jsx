import {
  useAuth,
} from "../context/AuthContext";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import StatCard from "../components/dashboard/StatCard";
import RoleBadge from "../components/dashboard/RoleBadge";


const Dashboard = () => {

  const {
    user,
  } = useAuth();


  const role =
    user?.role;


  const firstName =
    user?.full_name
      ?.split(" ")[0] ||
    "there";


  return (
    <DashboardLayout>

      {/* ========================================= */}
      {/* PAGE HEADER */}
      {/* ========================================= */}

      <section className="dashboard-header">

        <div>

          <div className="dashboard-eyebrow">
            {role === "admin"
              ? "SYSTEM OVERVIEW"
              : "CROP MONITORING"}
          </div>


          <h1>
            Good day, {firstName}.
          </h1>


          <p>
            {role === "admin"
              ? "Here's an overview of your AgriWatch system."
              : role === "viewer"
                ? "Here's the latest crop monitoring information."
                : "Here's the latest information about your crops."
            }
          </p>

        </div>


        <RoleBadge
          role={role}
        />

      </section>


      {/* ========================================= */}
      {/* STAT CARDS */}
      {/* ========================================= */}

      <section className="stats-grid">

        {role === "admin" ? (

          <>

            <StatCard
              icon="♙"
              label="Total Users"
              value="128"
              description="Registered accounts"
            />

            <StatCard
              icon="🌱"
              label="Active Farms"
              value="47"
              description="Currently monitored"
            />

            <StatCard
              icon="⚠"
              label="Active Alerts"
              value="12"
              description="Require attention"
            />

            <StatCard
              icon="✓"
              label="System Status"
              value="Healthy"
              description="All services operational"
            />

          </>

        ) : (

          <>

            <StatCard
              icon="🍅"
              label="Total Crops"
              value="12"
              description="Registered tomato crops"
            />

            <StatCard
              icon="✓"
              label="Healthy Crops"
              value="10"
              description="Currently healthy"
            />

            <StatCard
              icon="⚠"
              label="Active Alerts"
              value="2"
              description="Need attention"
            />

            <StatCard
              icon="◉"
              label="Monitoring"
              value="Active"
              description="Data collection running"
            />

          </>

        )}

      </section>


      {/* ========================================= */}
      {/* MAIN GRID */}
      {/* ========================================= */}

      <section className="dashboard-grid">


        {/* ======================================= */}
        {/* CROP HEALTH */}
        {/* ======================================= */}

        <div className="dashboard-panel chart-panel">

          <div className="panel-header">

            <div>

              <h2>
                Crop Health Overview
              </h2>

              <p>
                Monitoring status over time
              </p>

            </div>


            <button className="panel-action">
              View details
            </button>

          </div>


          <div className="chart-placeholder">

            <div className="chart-placeholder-icon">
              📈
            </div>

            <strong>
              Monitoring analytics
            </strong>

            <span>
              Your crop health chart will appear here.
            </span>

          </div>

        </div>


        {/* ======================================= */}
        {/* ALERTS */}
        {/* ======================================= */}

        <div className="dashboard-panel alerts-panel">

          <div className="panel-header">

            <div>

              <h2>
                Recent Alerts
              </h2>

              <p>
                Latest monitoring notifications
              </p>

            </div>


            <button className="panel-action">
              View all
            </button>

          </div>


          <div className="alert-list">

            <div className="alert-item alert-warning">

              <div className="alert-icon">
                ⚠
              </div>


              <div className="alert-content">

                <strong>
                  High humidity detected
                </strong>

                <span>
                  Tomato Field A
                </span>

                <small>
                  10 minutes ago
                </small>

              </div>

            </div>


            <div className="alert-item alert-success">

              <div className="alert-icon">
                ✓
              </div>


              <div className="alert-content">

                <strong>
                  Crop condition normal
                </strong>

                <span>
                  Tomato Field B
                </span>

                <small>
                  32 minutes ago
                </small>

              </div>

            </div>


            <div className="alert-item alert-info">

              <div className="alert-icon">
                ◉
              </div>


              <div className="alert-content">

                <strong>
                  Monitoring updated
                </strong>

                <span>
                  Tomato Field C
                </span>

                <small>
                  1 hour ago
                </small>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================= */}
      {/* ROLE INFORMATION */}
      {/* ========================================= */}

      <section className="welcome-panel">

        <div className="welcome-icon">
          {role === "admin"
            ? "🛡️"
            : role === "viewer"
              ? "👁️"
              : "🌱"}
        </div>


        <div>

          <h2>
            {role === "admin"
              ? "Administrator access"
              : role === "viewer"
                ? "Read-only monitoring access"
                : "Your farm is being monitored"}
          </h2>


          <p>
            {role === "admin"
              ? "You have access to system administration, user management, analytics, and monitoring."
              : role === "viewer"
                ? "You can view monitoring data, alerts, and analytics but cannot modify system data."
                : "Use the monitoring tools to keep track of crop health and respond to alerts."
            }
          </p>

        </div>

      </section>

    </DashboardLayout>
  );
};


export default Dashboard;