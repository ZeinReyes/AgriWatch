import { useEffect, useState } from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";

import {
  getAlerts,
  markAlertAsRead,
  resolveAlert,
} from "../../services/alertService";

import "./Alerts.css";


const Alerts = () => {

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const loadAlerts = async () => {

    try {

      setLoading(true);
      setError("");

      const data = await getAlerts();

      setAlerts(data.alerts || []);

    } catch (err) {

      console.error("Failed to load alerts:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load alerts. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {
    loadAlerts();
  }, []);


  const handleMarkAsRead = async (alertId) => {

    try {

      await markAlertAsRead(alertId);

      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                is_read: true,
              }
            : alert
        )
      );

    } catch (err) {

      console.error(
        "Failed to mark alert as read:",
        err
      );

      alert(
        err.response?.data?.message ||
        "Unable to mark alert as read."
      );

    }

  };


  const handleResolve = async (alertId) => {

    try {

      await resolveAlert(alertId);

      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                is_read: true,
                is_resolved: true,
              }
            : alert
        )
      );

    } catch (err) {

      console.error(
        "Failed to resolve alert:",
        err
      );

      alert(
        err.response?.data?.message ||
        "Unable to resolve alert."
      );

    }

  };


  const formatDate = (dateString) => {

    if (!dateString) {
      return "Unknown";
    }

    return new Date(dateString).toLocaleString(
      "en-PH",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );

  };


  const activeCount = alerts.filter(
    (alert) => !alert.is_resolved
  ).length;


  const unreadCount = alerts.filter(
    (alert) => !alert.is_read
  ).length;


  const criticalCount = alerts.filter(
    (alert) =>
      !alert.is_resolved &&
      alert.severity?.toLowerCase() === "critical"
  ).length;


  return (

    <DashboardLayout>

      <div className="alerts-page">

        {/* ========================================
            PAGE HEADER
        ======================================== */}

        <div className="alerts-header">

          <div className="alerts-header-content">

            <h1>Alerts</h1>

            <p>
              Monitor important conditions affecting
              your tomato crops.
            </p>

          </div>


          <button
            className="alerts-refresh-btn"
            onClick={loadAlerts}
            disabled={loading}
          >

            {loading ? "Refreshing..." : "Refresh"}

          </button>

        </div>


        {/* ========================================
            SUMMARY
        ======================================== */}

        <div className="alerts-summary">

          <div className="alert-summary-card">

            <div className="summary-icon">
              !
            </div>

            <div>

              <span>Active Alerts</span>

              <strong>
                {activeCount}
              </strong>

            </div>

          </div>


          <div className="alert-summary-card">

            <div className="summary-icon">
              ●
            </div>

            <div>

              <span>Unread</span>

              <strong>
                {unreadCount}
              </strong>

            </div>

          </div>


          <div className="alert-summary-card">

            <div className="summary-icon critical">
              !
            </div>

            <div>

              <span>Critical</span>

              <strong>
                {criticalCount}
              </strong>

            </div>

          </div>

        </div>


        {/* ========================================
            ERROR
        ======================================== */}

        {error && (

          <div className="alerts-error">
            {error}
          </div>

        )}


        {/* ========================================
            LOADING
        ======================================== */}

        {loading ? (

          <div className="alerts-empty">

            <div className="alerts-spinner"></div>

            <p>
              Loading alerts...
            </p>

          </div>

        ) : alerts.length === 0 ? (

          /* ========================================
             EMPTY STATE
          ======================================== */

          <div className="alerts-empty">

            <div className="empty-icon">
              ✓
            </div>

            <h3>
              No alerts
            </h3>

            <p>
              Your crops currently have no
              recorded alerts.
            </p>

          </div>

        ) : (

          /* ========================================
             ALERT LIST
          ======================================== */

          <div className="alerts-list">

            {alerts.map((alert) => {

              const severity =
                alert.severity?.toLowerCase() ||
                "warning";


              return (

                <div
                  key={alert.id}
                  className={`alert-card
                    ${alert.is_resolved ? "resolved" : ""}
                    ${!alert.is_read ? "unread" : ""}
                  `}
                >

                  {/* Severity indicator */}

                  <div
                    className={`alert-severity-indicator ${severity}`}
                  />


                  {/* Main content */}

                  <div className="alert-card-content">

                    <div className="alert-title-row">

                      <h3>
                        {alert.alert_type}
                      </h3>


                      {!alert.is_read &&
                        !alert.is_resolved && (

                        <span className="unread-badge">
                          New
                        </span>

                      )}


                      {alert.is_resolved && (

                        <span className="resolved-badge">
                          Resolved
                        </span>

                      )}

                    </div>


                    <p className="alert-message">
                      {alert.message}
                    </p>


                    <div className="alert-meta">

                      <span>
                        Crop #{alert.crop_id}
                      </span>

                      <span>
                        Monitoring #{alert.monitoring_id}
                      </span>

                      <span>
                        {formatDate(
                          alert.created_at
                        )}
                      </span>

                    </div>

                  </div>


                  {/* Right side */}

                  <div className="alert-card-right">

                    {/* Severity badge */}

                    <span
                      className={`severity-badge ${severity}`}
                    >
                      {alert.severity}
                    </span>


                    {!alert.is_resolved && (

                      <div className="alert-actions">

                        {!alert.is_read && (

                          <button
                            className="alert-action secondary"
                            onClick={() =>
                              handleMarkAsRead(
                                alert.id
                              )
                            }
                          >
                            Mark as Read
                          </button>

                        )}


                        <button
                          className="alert-action primary"
                          onClick={() =>
                            handleResolve(
                              alert.id
                            )
                          }
                        >
                          Resolve
                        </button>

                      </div>

                    )}

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </div>

    </DashboardLayout>

  );

};


export default Alerts;