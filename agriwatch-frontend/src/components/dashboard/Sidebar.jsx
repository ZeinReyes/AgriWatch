import {
  NavLink,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";


const Sidebar = ({
  isOpen,
  onClose,
}) => {

  const {
    user,
    logout,
  } = useAuth();


  const role =
    user?.role;


  const commonLinks = [
    {
      label: "Dashboard",
      icon: "⌂",
      path: "/dashboard",
    },
    {
      label: "Monitoring",
      icon: "◉",
      path: "/monitoring",
    },
    {
      label: "Alerts",
      icon: "⚠",
      path: "/alerts",
    },
  ];


  const farmerLinks = [
    {
      label: "My Farm",
      icon: "🌱",
      path: "/farm",
    },
    {
      label: "My Crops",
      icon: "🍅",
      path: "/crops",
    },
  ];


  const adminLinks = [
    {
      label: "Users",
      icon: "♙",
      path: "/admin/users",
    },
    {
      label: "System Settings",
      icon: "⚙",
      path: "/admin/settings",
    },
  ];


  const analyticsLink = {
    label: "Analytics",
    icon: "▥",
    path: "/analytics",
  };


  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}


      <aside
        className={`sidebar ${
          isOpen
            ? "sidebar-open"
            : ""
        }`}
      >

        {/* ================================= */}
        {/* BRAND */}
        {/* ================================= */}

        <div className="sidebar-brand">

          <div className="brand-icon">
            🌱
          </div>

          <div>
            <div className="brand-name">
              AgriWatch
            </div>

            <div className="brand-subtitle">
              Smart Crop Monitoring
            </div>
          </div>

        </div>


        {/* ================================= */}
        {/* NAVIGATION */}
        {/* ================================= */}

        <nav className="sidebar-nav">

          <div className="nav-section-title">
            Overview
          </div>


          {commonLinks.map(
            (link) => (

              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive
                      ? "nav-item-active"
                      : ""
                  }`
                }
              >

                <span className="nav-icon">
                  {link.icon}
                </span>

                <span>
                  {link.label}
                </span>

              </NavLink>

            )
          )}


          {/* ================================= */}
          {/* FARMER */}
          {/* ================================= */}

          {role === "farmer" && (

            <>

              <div className="nav-section-title">
                Farm Management
              </div>


              {farmerLinks.map(
                (link) => (

                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `nav-item ${
                        isActive
                          ? "nav-item-active"
                          : ""
                      }`
                    }
                  >

                    <span className="nav-icon">
                      {link.icon}
                    </span>

                    <span>
                      {link.label}
                    </span>

                  </NavLink>

                )
              )}

            </>

          )}


          {/* ================================= */}
          {/* ANALYTICS */}
          {/* ================================= */}

          {(role === "admin" ||
            role === "viewer") && (

            <>
              <div className="nav-section-title">
                Insights
              </div>

              <NavLink
                to={analyticsLink.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive
                      ? "nav-item-active"
                      : ""
                  }`
                }
              >

                <span className="nav-icon">
                  {analyticsLink.icon}
                </span>

                <span>
                  {analyticsLink.label}
                </span>

              </NavLink>
            </>

          )}


          {/* ================================= */}
          {/* ADMIN */}
          {/* ================================= */}

          {role === "admin" && (

            <>

              <div className="nav-section-title">
                Administration
              </div>


              {adminLinks.map(
                (link) => (

                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `nav-item ${
                        isActive
                          ? "nav-item-active"
                          : ""
                      }`
                    }
                  >

                    <span className="nav-icon">
                      {link.icon}
                    </span>

                    <span>
                      {link.label}
                    </span>

                  </NavLink>

                )
              )}

            </>

          )}

        </nav>


        {/* ================================= */}
        {/* USER AREA */}
        {/* ================================= */}

        <div className="sidebar-bottom">

          <div className="sidebar-user">

            <div className="user-avatar">
              {user?.full_name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>


            <div className="user-info">

              <div className="user-name">
                {user?.full_name}
              </div>

              <div className="user-role">
                {role}
              </div>

            </div>

          </div>


          <button
            className="logout-button"
            onClick={logout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>
    </>
  );
};


export default Sidebar;