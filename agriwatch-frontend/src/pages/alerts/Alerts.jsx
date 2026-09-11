import { useEffect, useState } from "react";
import {
  getAlerts,
  markAlertAsRead,
  resolveAlert,
} from "../../services/alertService";
import "./Alerts.css";

function Alerts() {
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
            ? { ...alert, is_read: true }
            : alert
        )
      );
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
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
                is_resolved: true,
                is_read: true,
              }
            : alert
        )
      );
    } catch (err) {
      console.error("Failed to resolve alert:", err);
      alert(
        err.response?.data?.message ||
          "Unable to resolve alert."
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";

    return new Date(dateString).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const unreadCount = alerts.filter(
    (alert) => !alert.is_read
  ).length;

  const activeCount = alerts.filter(
    (alert) => !alert.is_resolved
  ).length;

  const criticalCount = alerts.filter(
    (alert) =>
      !alert.is_resolved &&
      alert.severity?.toLowerCase() === "critical"
  ).length;

  return (
    <div className="alerts-page">

      {/* Header */}
      <div className="alerts-header">
        <div>
          <h1>Alerts</h1>
          <p>
            Monitor important conditions affecting your tomato crops.
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

      {/* Summary cards */}
      <div className="alerts-summary">

        <div className="alert-summary-card">
          <div className="summary-icon">
            !
          </div>

          <div>
            <span>Active Alerts</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="alert-summary-card">
          <div className="summary-icon">
            ●
          </div>

          <div>
            <span>Unread</span>
            <strong>{unreadCount}</strong>
          </div>
        </div>

        <div className="alert-summary-card">
          <div className="summary-icon critical">
            !
          </div>

          <div>
            <span>Critical</span>
            <strong>{criticalCount}</strong>
          </div>
        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="alerts-error">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="alerts-empty">
          <div className="alerts-spinner"></div>
          <p>Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="alerts-empty">
          <div className="empty-icon">✓</div>
          <h3>No alerts</h3>
          <p>
            Your crops currently have no recorded alerts.
          </p>
        </div>
      ) : (
        <div className="alerts-list">

          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-card ${
                alert.is_resolved ? "resolved" : ""
              } ${!alert.is_read ? "unread" : ""}`}
            >

              <div className="alert-card-main">

                <div
                  className={`alert-severity ${
                    alert.severity?.toLowerCase()
                  }`}
                >
                  {alert.severity}
                </div>

                <div className="alert-content">

                  <div className="alert-title-row">
                    <h3>{alert.alert_type}</h3>

                    {!alert.is_read && (
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
                      {formatDate(alert.created_at)}
                    </span>
                  </div>

                </div>

              </div>

              {!alert.is_resolved && (
                <div className="alert-actions">

                  {!alert.is_read && (
                    <button
                      className="alert-action secondary"
                      onClick={() =>
                        handleMarkAsRead(alert.id)
                      }
                    >
                      Mark as Read
                    </button>
                  )}

                  <button
                    className="alert-action primary"
                    onClick={() =>
                      handleResolve(alert.id)
                    }
                  >
                    Resolve
                  </button>

                </div>
              )}

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default Alerts;