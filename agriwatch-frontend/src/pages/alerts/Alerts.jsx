import {
  useEffect,
  useMemo,
  useState,
} from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";

import {
  getAlerts,
  markAlertAsRead,
  resolveAlert,
} from "../../services/alertService";

import "./Alerts.css";


const Alerts = () => {

  const [
    alerts,
    setAlerts
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");


  // =========================================================
  // LOAD ALERTS
  // =========================================================

  const loadAlerts = async () => {

    try {

      setLoading(true);
      setError("");

      const data =
        await getAlerts();


      setAlerts(
        data.alerts || []
      );

    } catch (err) {

      console.error(
        "Failed to load alerts:",
        err
      );

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


  // =========================================================
  // SORT ALERTS
  // =========================================================

  const sortAlerts = (
    alertList
  ) => {

    return [
      ...alertList
    ].sort(
      (a, b) => {

        const dateA =
          a.created_at
            ? new Date(
                a.created_at
              ).getTime()
            : 0;


        const dateB =
          b.created_at
            ? new Date(
                b.created_at
              ).getTime()
            : 0;


        if (dateA !== dateB) {

          return (
            dateB - dateA
          );

        }


        return (
          Number(b.id || 0) -
          Number(a.id || 0)
        );

      }
    );

  };


  // =========================================================
  // ACTIVE ALERTS
  // =========================================================

  const activeAlerts =
    useMemo(
      () =>
        sortAlerts(
          alerts.filter(
            (item) =>
              !item.is_resolved
          )
        ),
      [alerts]
    );


  // =========================================================
  // ALERT HISTORY
  // =========================================================

  const alertHistory =
    useMemo(
      () =>
        sortAlerts(
          alerts.filter(
            (item) =>
              item.is_resolved
          )
        ),
      [alerts]
    );


  // =========================================================
  // MARK AS READ
  // =========================================================

  const handleMarkAsRead = async (
    alertId
  ) => {

    try {

      await markAlertAsRead(
        alertId
      );


      setAlerts(
        (currentAlerts) =>
          currentAlerts.map(
            (item) =>
              item.id === alertId
                ? {
                    ...item,
                    is_read: true,
                  }
                : item
          )
      );

    } catch (err) {

      console.error(
        "Failed to mark alert as read:",
        err
      );

      window.alert(
        err.response?.data?.message ||
        "Unable to mark alert as read."
      );

    }

  };


  // =========================================================
  // RESOLVE
  // =========================================================

  const handleResolve = async (
    alertId
  ) => {

    try {

      const response =
        await resolveAlert(
          alertId
        );


      const updatedAlert =
        response?.alert;


      setAlerts(
        (currentAlerts) =>
          currentAlerts.map(
            (item) => {

              if (
                item.id !==
                alertId
              ) {

                return item;

              }


              return {
                ...item,

                is_read:
                  true,

                is_resolved:
                  true,

                resolved_at:
                  updatedAlert?.resolved_at ||
                  new Date().toISOString(),
              };

            }
          )
      );

    } catch (err) {

      console.error(
        "Failed to resolve alert:",
        err
      );

      window.alert(
        err.response?.data?.message ||
        "Unable to resolve alert."
      );

    }

  };


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (
    dateString
  ) => {

    if (!dateString) {
      return "Unknown";
    }


    const date =
      new Date(
        dateString
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "Unknown";

    }


    return date.toLocaleString(
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


  // =========================================================
  // SUMMARY COUNTS
  // =========================================================

  const activeCount =
    activeAlerts.length;


  const unreadCount =
    alerts.filter(
      (item) =>
        !item.is_read &&
        !item.is_resolved
    ).length;


  const criticalCount =
    activeAlerts.filter(
      (item) =>
        item.severity
          ?.toLowerCase() ===
        "critical"
    ).length;


  return (

    <DashboardLayout>

      <div className="alerts-page">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="alerts-header">

          <div className="alerts-header-content">

            <span className="alerts-eyebrow">
              CROP MONITORING
            </span>

            <h1>
              Alerts
            </h1>

            <p>
              Review current crop conditions
              that need attention and view
              previous alert activity.
            </p>

          </div>


          <button
            type="button"
            className="alerts-refresh-btn"
            onClick={loadAlerts}
            disabled={loading}
          >

            {loading
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </div>


        {/* ===================================================
            SUMMARY
        =================================================== */}

        <div className="alerts-summary">

          <div className="alert-summary-card">

            <div className="summary-icon">
              !
            </div>

            <div>

              <span>
                Active Alerts
              </span>

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

              <span>
                Unread
              </span>

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

              <span>
                Critical
              </span>

              <strong>
                {criticalCount}
              </strong>

            </div>

          </div>

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div className="alerts-error">

            <span>
              !
            </span>

            {error}

          </div>

        )}


        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (

          <div className="alerts-empty">

            <div className="alerts-spinner"></div>

            <p>
              Loading alerts...
            </p>

          </div>

        ) : alerts.length === 0 ? (

          <div className="alerts-empty">

            <div className="empty-icon">
              ✓
            </div>

            <h3>
              No alerts
            </h3>

            <p>
              Your crops currently have
              no recorded alerts.
            </p>

          </div>

        ) : (

          <>

            {/* =================================================
                ACTIVE ALERTS
            ================================================= */}

            <section className="alerts-section">

              <div className="alerts-section-header">

                <div>

                  <span className="alerts-section-eyebrow">
                    NEEDS ATTENTION
                  </span>

                  <h2>
                    Active Alerts
                  </h2>

                  <p>
                    These are the current
                    conditions requiring
                    attention.
                  </p>

                </div>


                <span className="alerts-section-count">
                  {activeAlerts.length}
                  {" "}
                  {activeAlerts.length === 1
                    ? "active"
                    : "active"}
                </span>

              </div>


              {activeAlerts.length === 0 ? (

                <div className="alerts-section-empty">

                  <div className="section-empty-icon">
                    ✓
                  </div>

                  <div>

                    <strong>
                      Everything looks okay
                    </strong>

                    <p>
                      There are currently no
                      unresolved crop alerts.
                    </p>

                  </div>

                </div>

              ) : (

                <div className="alerts-list">

                  {activeAlerts.map(
                    (item) => {

                      const severity =
                        item.severity
                          ?.toLowerCase() ||
                        "warning";


                      return (

                        <div
                          key={item.id}
                          className={
                            `alert-card active-alert ${
                              !item.is_read
                                ? "unread"
                                : ""
                            }`
                          }
                        >

                          {/* Severity */}

                          <div
                            className={
                              `alert-severity-indicator ${severity}`
                            }
                          />


                          {/* Content */}

                          <div className="alert-card-content">

                            <div className="alert-title-row">

                              <h3>
                                {item.alert_type}
                              </h3>


                              {!item.is_read && (

                                <span className="unread-badge">
                                  New
                                </span>

                              )}

                            </div>


                            <p className="alert-message">
                              {item.message}
                            </p>


                            <div className="alert-meta">

                              <span>
                                Crop #{item.crop_id}
                              </span>

                              <span>
                                Monitoring #
                                {item.monitoring_id}
                              </span>

                              <span>
                                {formatDate(
                                  item.created_at
                                )}
                              </span>

                            </div>

                          </div>


                          {/* Right */}

                          <div className="alert-card-right">

                            <span
                              className={
                                `severity-badge ${severity}`
                              }
                            >
                              {item.severity}
                            </span>


                            <div className="alert-actions">

                              {!item.is_read && (

                                <button
                                  type="button"
                                  className="alert-action secondary"
                                  onClick={() =>
                                    handleMarkAsRead(
                                      item.id
                                    )
                                  }
                                >
                                  Mark as Read
                                </button>

                              )}


                              <button
                                type="button"
                                className="alert-action primary"
                                onClick={() =>
                                  handleResolve(
                                    item.id
                                  )
                                }
                              >
                                Resolve
                              </button>

                            </div>

                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              )}

            </section>


            {/* =================================================
                ALERT HISTORY
            ================================================= */}

            <section className="alerts-section history-section">

              <div className="alerts-section-header">

                <div>

                  <span className="alerts-section-eyebrow">
                    RECORD
                  </span>

                  <h2>
                    Alert History
                  </h2>

                  <p>
                    Previous alerts are kept
                    here for reference and
                    reporting.
                  </p>

                </div>


                <span className="alerts-section-count history-count">
                  {alertHistory.length}
                  {" "}
                  {alertHistory.length === 1
                    ? "record"
                    : "records"}
                </span>

              </div>


              {alertHistory.length === 0 ? (

                <div className="alerts-section-empty">

                  <div className="section-empty-icon">
                    —
                  </div>

                  <div>

                    <strong>
                      No previous alerts
                    </strong>

                    <p>
                      Resolved alerts will
                      appear here.
                    </p>

                  </div>

                </div>

              ) : (

                <div className="alerts-list history-list">

                  {alertHistory.map(
                    (item) => {

                      const severity =
                        item.severity
                          ?.toLowerCase() ||
                        "warning";


                      return (

                        <div
                          key={item.id}
                          className="alert-card resolved"
                        >

                          <div
                            className={
                              `alert-severity-indicator ${severity}`
                            }
                          />


                          <div className="alert-card-content">

                            <div className="alert-title-row">

                              <h3>
                                {item.alert_type}
                              </h3>


                              <span className="resolved-badge">
                                Resolved
                              </span>

                            </div>


                            <p className="alert-message">
                              {item.message}
                            </p>


                            <div className="alert-meta">

                              <span>
                                Crop #{item.crop_id}
                              </span>

                              <span>
                                Monitoring #
                                {item.monitoring_id}
                              </span>

                              <span>
                                Created:
                                {" "}
                                {formatDate(
                                  item.created_at
                                )}
                              </span>

                              {item.resolved_at && (

                                <span>
                                  Resolved:
                                  {" "}
                                  {formatDate(
                                    item.resolved_at
                                  )}
                                </span>

                              )}

                            </div>

                          </div>


                          <div className="alert-card-right history-right">

                            <span
                              className={
                                `severity-badge ${severity}`
                              }
                            >
                              {item.severity}
                            </span>

                          </div>

                        </div>

                      );

                    }
                  )}

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