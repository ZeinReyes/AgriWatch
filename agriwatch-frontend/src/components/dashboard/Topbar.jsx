import {
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

import RoleBadge from "./RoleBadge";


const Topbar = ({
  onMenuClick,
}) => {

  const {
    user,
  } = useAuth();


  const location =
    useLocation();


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


  return (
    <header className="topbar">

      {/* LEFT */}

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


      {/* RIGHT */}

      <div className="topbar-right">

        <button
          type="button"
          className="notification-button"
          aria-label="Notifications"
        >

          🔔

          <span className="notification-dot" />

        </button>


        <div className="topbar-user">

          <div className="topbar-avatar">

            {userInitial}

          </div>


          <div className="topbar-user-info">

            <div className="topbar-user-name">
              {user?.full_name || "User"}
            </div>


            <RoleBadge
              role={user?.role}
            />

          </div>

        </div>

      </div>

    </header>
  );
};


export default Topbar;