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


  return (
    <header className="topbar">

      <button
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
          Dashboard
        </span>

      </div>


      <div className="topbar-right">

        <button
          className="notification-button"
          aria-label="Notifications"
        >
          🔔

          <span className="notification-dot" />
        </button>


        <div className="topbar-user">

          <div className="topbar-avatar">
            {user?.full_name
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </div>


          <div className="topbar-user-info">

            <div className="topbar-user-name">
              {user?.full_name}
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