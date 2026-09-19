import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  History,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

import {
  getAlerts,
  markAlertAsRead,
  resolveAlert,
} from "../../services/alertService";

import "./Alerts.css";


const Alerts = () => {
  const { user } = useAuth();
  const isViewer = user?.role === "viewer";

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


  const sortAlerts = (alertList) => {
    return [...alertList].sort((a, b) => {
      const dateA = a.created_at
        ? new Date(a.created_at).getTime()
        : 0;

      const dateB = b.created_at
        ? new Date(b.created_at).getTime()
        : 0;

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });
  };


  const activeAlerts = useMemo(
    () =>
      sortAlerts(
        alerts.filter((item) => !item.is_resolved)
      ),
    [alerts]
  );


  const alertHistory = useMemo(
    () =>
      sortAlerts(
        alerts.filter((item) => item.is_resolved)
      ),
    [alerts]
  );


  const handleMarkAsRead = async (alertId) => {
    if (isViewer) {
      setError("Viewers cannot modify alerts.");
      return;
    }

    try {
      await markAlertAsRead(alertId);

      setAlerts((currentAlerts) =>
        currentAlerts.map((item) =>
          item.id === alertId
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to mark alert as read:", err);

      window.alert(
        err.response?.data?.message ||
          "Unable to mark alert as read."
      );
    }
  };


  const handleResolve = async (alertId) => {
    if (isViewer) {
      setError("Viewers cannot modify alerts.");
      return;
    }

    try {
      const response = await resolveAlert(alertId);
      const updatedAlert = response?.alert;

      setAlerts((currentAlerts) =>
        currentAlerts.map((item) => {
          if (item.id !== alertId) {
            return item;
          }

          return {
            ...item,
            is_read: true,
            is_resolved: true,
            resolved_at:
              updatedAlert?.resolved_at ||
              new Date().toISOString(),
          };
        })
      );
    } catch (err) {
      console.error("Failed to resolve alert:", err);

      window.alert(
        err.response?.data?.message ||
          "Unable to resolve alert."
      );
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) {
      return "Unknown";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };


  const activeCount = activeAlerts.length;

  const unreadCount = alerts.filter(
    (item) => !item.is_read && !item.is_resolved
  ).length;

  const criticalCount = activeAlerts.filter(
    (item) => item.severity?.toLowerCase() === "critical"
  ).length;


  return (
    <DashboardLayout>
      <div className="alerts-page">

        <div className="alerts-header">
          <div className="alerts-header-content">
            <div className="alerts-title-icon">
              <Bell size={20} strokeWidth={2} />
            </div>

            <div>
              <span className="alerts-eyebrow">
                CROP MONITORING
              </span>

              <h1>Alerts</h1>

              <p>
                {isViewer
                  ? "Review current and historical crop alerts across the AgriWatch system."
                  : "Review current crop conditions that require attention and review previous alert activity."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="alerts-refresh-btn"
            onClick={loadAlerts}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              strokeWidth={2}
              className={
                loading
                  ? "alerts-refresh-icon spinning"
                  : "alerts-refresh-icon"
              }
            />

            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>


        <div className="alerts-summary">
          <div className="alert-summary-card">
            <div className="summary-icon">
              <Bell size={18} strokeWidth={2} />
            </div>

            <div>
              <span>Active Alerts</span>
              <strong>{activeCount}</strong>
            </div>
          </div>

          <div className="alert-summary-card">
            <div className="summary-icon">
              <CircleAlert size={18} strokeWidth={2} />
            </div>

            <div>
              <span>Unread</span>
              <strong>{unreadCount}</strong>
            </div>
          </div>

          <div className="alert-summary-card">
            <div className="summary-icon critical">
              <ShieldAlert size={18} strokeWidth={2} />
            </div>

            <div>
              <span>Critical</span>
              <strong>{criticalCount}</strong>
            </div>
          </div>
        </div>


        {error && (
          <div className="alerts-error">
            <span>
              <AlertTriangle size={15} strokeWidth={2} />
            </span>

            <p>{error}</p>
          </div>
        )}


        {loading ? (
          <div className="alerts-empty">
            <div className="alerts-spinner" />

            <h3>Loading alerts</h3>

            <p>
              Retrieving the latest crop monitoring alerts.
            </p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="alerts-empty">
            <div className="empty-icon">
              <CheckCircle2 size={22} strokeWidth={2} />
            </div>

            <h3>No alerts</h3>

            <p>
              The system currently has no recorded alerts.
            </p>
          </div>
        ) : (
          <>

            <section className="alerts-section">
              <div className="alerts-section-header">
                <div>
                  <span className="alerts-section-eyebrow">
                    NEEDS ATTENTION
                  </span>

                  <h2>Active Alerts</h2>

                  <p>
                    Current conditions requiring attention.
                  </p>
                </div>

                <span className="alerts-section-count">
                  {activeAlerts.length}{" "}
                  {activeAlerts.length === 1
                    ? "alert"
                    : "alerts"}
                </span>
              </div>


              {activeAlerts.length === 0 ? (
                <div className="alerts-section-empty">
                  <div className="section-empty-icon">
                    <Check size={18} strokeWidth={2} />
                  </div>

                  <div>
                    <strong>No active alerts</strong>
                    <p>
                      There are currently no unresolved crop conditions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="alerts-list">
                  {activeAlerts.map((item) => {
                    const severity =
                      item.severity?.toLowerCase() ||
                      "warning";

                    return (
                      <div
                        key={item.id}
                        className={`alert-card active-alert ${
                          !item.is_read ? "unread" : ""
                        }`}
                      >
                        <div
                          className={`alert-severity-indicator ${severity}`}
                        />

                        <div className="alert-card-content">
                          <div className="alert-title-row">
                            <div className="alert-title-icon">
                              {severity === "critical" ? (
                                <ShieldAlert
                                  size={16}
                                  strokeWidth={2}
                                />
                              ) : (
                                <AlertTriangle
                                  size={16}
                                  strokeWidth={2}
                                />
                              )}
                            </div>

                            <h3>{item.alert_type}</h3>

                            {!item.is_read && (
                              <span className="unread-badge">
                                <span className="unread-dot" />
                                New
                              </span>
                            )}
                          </div>

                          <p className="alert-message">
                            {item.message}
                          </p>

                          <div className="alert-meta">
                            <span>Crop #{item.crop_id}</span>

                            <span>
                              Monitoring #{item.monitoring_id}
                            </span>

                            <span className="alert-date">
                              <Clock3
                                size={12}
                                strokeWidth={2}
                              />

                              {formatDate(item.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="alert-card-right">
                          <span
                            className={`severity-badge ${severity}`}
                          >
                            {severity === "critical" ? (
                              <ShieldAlert
                                size={12}
                                strokeWidth={2}
                              />
                            ) : (
                              <AlertTriangle
                                size={12}
                                strokeWidth={2}
                              />
                            )}

                            {item.severity}
                          </span>

                          {!isViewer && (
                            <div className="alert-actions">
                              {!item.is_read && (
                                <button
                                  type="button"
                                  className="alert-action secondary"
                                  onClick={() =>
                                    handleMarkAsRead(item.id)
                                  }
                                >
                                  <Check
                                    size={14}
                                    strokeWidth={2}
                                  />
                                  Mark as Read
                                </button>
                              )}

                              <button
                                type="button"
                                className="alert-action primary"
                                onClick={() =>
                                  handleResolve(item.id)
                                }
                              >
                                <CheckCircle2
                                  size={14}
                                  strokeWidth={2}
                                />
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
            </section>


            <section className="alerts-section history-section">
              <div className="alerts-section-header">
                <div>
                  <span className="alerts-section-eyebrow">
                    RECORDS
                  </span>

                  <h2>Alert History</h2>

                  <p>
                    Previous alerts retained for reference and reporting.
                  </p>
                </div>

                <span className="alerts-section-count history-count">
                  <History size={12} strokeWidth={2} />
                  {alertHistory.length}{" "}
                  {alertHistory.length === 1
                    ? "record"
                    : "records"}
                </span>
              </div>


              {alertHistory.length === 0 ? (
                <div className="alerts-section-empty">
                  <div className="section-empty-icon muted">
                    <History size={17} strokeWidth={2} />
                  </div>

                  <div>
                    <strong>No previous alerts</strong>
                    <p>Resolved alerts will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="alerts-list history-list">
                  {alertHistory.map((item) => {
                    const severity =
                      item.severity?.toLowerCase() ||
                      "warning";

                    return (
                      <div
                        key={item.id}
                        className="alert-card resolved"
                      >
                        <div
                          className={`alert-severity-indicator ${severity}`}
                        />

                        <div className="alert-card-content">
                          <div className="alert-title-row">
                            <div className="alert-title-icon">
                              <CheckCircle2
                                size={16}
                                strokeWidth={2}
                              />
                            </div>

                            <h3>{item.alert_type}</h3>

                            <span className="resolved-badge">
                              <Check size={11} strokeWidth={2} />
                              Resolved
                            </span>
                          </div>

                          <p className="alert-message">
                            {item.message}
                          </p>

                          <div className="alert-meta">
                            <span>Crop #{item.crop_id}</span>

                            <span>
                              Monitoring #{item.monitoring_id}
                            </span>

                            <span className="alert-date">
                              <Clock3
                                size={12}
                                strokeWidth={2}
                              />
                              Created: {formatDate(item.created_at)}
                            </span>

                            {item.resolved_at && (
                              <span className="alert-date">
                                <CheckCircle2
                                  size={12}
                                  strokeWidth={2}
                                />
                                Resolved: {formatDate(item.resolved_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="alert-card-right history-right">
                          <span
                            className={`severity-badge ${severity}`}
                          >
                            {severity === "critical" ? (
                              <ShieldAlert
                                size={12}
                                strokeWidth={2}
                              />
                            ) : (
                              <AlertTriangle
                                size={12}
                                strokeWidth={2}
                              />
                            )}

                            {item.severity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};


export default Alerts;
