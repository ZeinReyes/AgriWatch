import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Menu,
  Bell,
  BellOff,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";

import {
  useAuth,
} from "../../context/AuthContext";

import RoleBadge from "./RoleBadge";

import api from "../../services/api";


const Topbar = ({
  onMenuClick,
}) => {

  const {
    user,
  } = useAuth();


  const location =
    useLocation();


  const navigate =
    useNavigate();


  const [
    notificationsOpen,
    setNotificationsOpen
  ] = useState(false);


  const [
    alerts,
    setAlerts
  ] = useState([]);


  const [
    notificationsEnabled,
    setNotificationsEnabled
  ] = useState(true);


  const pageTitles = {

    "/dashboard":
      "Dashboard",

    "/monitoring":
      "Crop Monitoring",

    "/sensor-data":
      "Sensor Data",

    "/pest-disease":
      "Pest & Disease",

    "/alerts":
      "Alerts",

    "/weather":
      "Weather",

    "/irrigation":
      "Irrigation",

    "/reports":
      "Reports",

    "/settings":
      "Settings",

    "/farm":
      "My Farm",

    "/crops":
      "My Crops",

    "/admin/users":
      "User Management",

    "/admin/settings":
      "System Settings",

  };


  const pageTitle =
    pageTitles[
      location.pathname
    ] ||
    "Dashboard";


  const userInitial =
    user?.full_name
      ?.charAt(0)
      ?.toUpperCase() ||
    "U";


  useEffect(() => {

    loadAlerts();

    loadNotificationPreference();

  }, []);


  useEffect(() => {

    const refresh =
      setInterval(
        loadAlerts,
        30000
      );


    return () =>
      clearInterval(
        refresh
      );

  }, []);


  const loadNotificationPreference =
    () => {

      try {

        const saved =
          localStorage.getItem(
            "agriwatch_notification_preferences"
          );


        if (!saved) {
          return;
        }


        const parsed =
          JSON.parse(saved);


        setNotificationsEnabled(
          parsed.inAppAlerts !== false
        );

      } catch (err) {

        console.error(
          "Failed to load notification preference:",
          err
        );

      }

    };


  const loadAlerts =
    async () => {

      try {

        const response =
          await api.get(
            "/alerts"
          );


        const alertData =
          Array.isArray(
            response.data
          )
            ? response.data
            : response.data?.alerts ||
              response.data?.data ||
              [];


        setAlerts(
          alertData
        );

      } catch (err) {

        console.error(
          "Failed to load notifications:",
          err
        );

      }

    };


  const unreadAlerts =
    alerts.filter(
      (alert) =>
        !alert.is_read
    );


  const criticalUnread =
    unreadAlerts.filter(
      (alert) =>
        String(
          alert.severity || ""
        ).toLowerCase() ===
        "critical"
    );


  const visibleAlerts =
    alerts
      .filter(
        (alert) =>
          notificationsEnabled
            ? true
            : false
      )
      .slice(
        0,
        5
      );


  const handleAlertClick =
    () => {

      setNotificationsOpen(
        false
      );

      navigate(
        "/alerts"
      );

    };


  return (

    <header className="topbar">

      <div className="topbar-left">

        <button
          type="button"
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          ☰
        </button>


        <div className="topbar-title">

          <span className="topbar-title-main">
            AgriWatch
          </span>


          <span className="topbar-divider">
            /
          </span>


          <span className="topbar-title-page">
            {pageTitle}
          </span>

        </div>

      </div>


      <div className="topbar-right">

        {/* =========================================
            NOTIFICATIONS
        ========================================== */}

        <div className="notification-wrapper">

          <button
            type="button"
            className={
              `notification-button ${
                notificationsOpen
                  ? "notification-active"
                  : ""
              }`
            }
            onClick={() =>
              setNotificationsOpen(
                (previous) =>
                  !previous
              )
            }
            aria-label="Notifications"
            aria-expanded={
              notificationsOpen
            }
          >

            <span className="notification-icon">
              <Bell size={19} strokeWidth={2} />
            </span>


            {criticalUnread.length > 0 && (

              <span className="notification-dot"></span>

            )}

          </button>


          {notificationsOpen && (

            <>

              <button
                type="button"
                className="notification-backdrop"
                onClick={() =>
                  setNotificationsOpen(
                    false
                  )
                }
                aria-label="Close notifications"
              />


              <div className="notification-panel">

                <div className="notification-panel-header">

                  <div>

                    <strong>
                      Notifications
                    </strong>

                    <span>
                      {unreadAlerts.length > 0
                        ? `${unreadAlerts.length} unread`
                        : "You're all caught up"}
                    </span>

                  </div>


                  {alerts.length > 0 && (

                    <button
                      type="button"
                      onClick={
                        handleAlertClick
                      }
                      className="notification-view-all"
                    >
                      View all
                    </button>

                  )}

                </div>


                <div className="notification-list">

                  {!notificationsEnabled && (

                    <div className="notification-empty">

                      <div className="notification-empty-icon">
                        <BellOff size={30} strokeWidth={1.8} />
                      </div>

                      <strong>
                        Notifications are off
                      </strong>

                      <span>
                        Turn on in-app notifications
                        in Settings.
                      </span>

                      <button
                        type="button"
                        className="notification-settings-link"
                        onClick={() => {
                          setNotificationsOpen(
                            false
                          );

                          navigate(
                            "/settings"
                          );
                        }}
                      >
                        Open Settings
                      </button>

                    </div>

                  )}


                  {notificationsEnabled &&
                    visibleAlerts.length === 0 && (

                      <div className="notification-empty">

                        <div className="notification-empty-icon">
                          <CheckCircle2 size={30} strokeWidth={1.8} />
                        </div>

                        <strong>
                          No recent alerts
                        </strong>

                        <span>
                          New crop monitoring
                          alerts will appear here.
                        </span>

                      </div>

                    )}


                  {notificationsEnabled &&
                    visibleAlerts.map(
                      (alert) => (

                        <button
                          type="button"
                          className={
                            `notification-item ${
                              !alert.is_read
                                ? "unread"
                                : ""
                            }`
                          }
                          key={
                            alert.id
                          }
                          onClick={
                            handleAlertClick
                          }
                        >

                          <span
                            className={
                              `notification-item-icon ${
                                String(
                                  alert.severity ||
                                  ""
                                ).toLowerCase() ===
                                "critical"
                                  ? "critical"
                                  : "warning"
                              }`
                            }
                          >
                            <TriangleAlert size={19} strokeWidth={2} />
                          </span>


                          <span className="notification-item-content">

                            <strong>
                              {
                                alert.alert_type ||
                                "Crop Alert"
                              }
                            </strong>


                            <span>
                              {
                                alert.message ||
                                "A crop monitoring alert was generated."
                              }
                            </span>


                            <small>
                              {
                                alert.created_at
                                  ? new Date(
                                      alert.created_at
                                    ).toLocaleString(
                                      "en-PH",
                                      {
                                        month:
                                          "short",
                                        day:
                                          "numeric",
                                        hour:
                                          "numeric",
                                        minute:
                                          "2-digit",
                                      }
                                    )
                                  : ""
                              }
                            </small>

                          </span>


                          {!alert.is_read && (
                            <span className="notification-unread-dot"></span>
                          )}

                        </button>

                      )
                    )}

                </div>

              </div>

            </>

          )}

        </div>


        {/* =========================================
            USER
        ========================================== */}

        <div className="topbar-user">

          <div className="topbar-avatar">

            {userInitial}

          </div>


          <div className="topbar-user-info">

            <div className="topbar-user-name">
              {user?.full_name ||
                "User"}
            </div>


            <RoleBadge
              role={
                user?.role
              }
            />

          </div>

        </div>

      </div>

    </header>

  );
};


export default Topbar;