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


  const navigationSections = [
    {
      title: "Overview",

      links: [
        {
          label: "Dashboard",
          icon: "⌂",
          path: "/dashboard",
          roles: [
            "admin",
            "farmer",
            "viewer",
          ],
        },
      ],
    },


    {
      title: "Monitoring",

      links: [
        {
          label: "Crop Monitoring",
          icon: "◉",
          path: "/monitoring",
          roles: [
            "admin",
            "farmer",
          ],
        },

        {
          label: "Sensor Data",
          icon: "▥",
          path: "/sensor-data",
          roles: [
            "admin",
            "farmer",
          ],
        },

        {
          label: "Pest & Disease",
          icon: "🐛",
          path: "/pest-disease",
          roles: [
            "admin",
            "farmer",
          ],
        },
      ],
    },


    {
      title: "Alerts & Conditions",

      links: [
        {
          label: "Alerts",
          icon: "⚠",
          path: "/alerts",
          roles: [
            "admin",
            "farmer",
          ],
        },

        {
          label: "Weather",
          icon: "☁",
          path: "/weather",
          roles: [
            "admin",
            "farmer",
          ],
        },

        {
          label: "Irrigation",
          icon: "💧",
          path: "/irrigation",
          roles: [
            "admin",
            "farmer",
          ],
        },
      ],
    },


    {
      title: "Reporting",

      links: [
        {
          label: "Reports",
          icon: "▤",
          path: "/reports",
          roles: [
            "admin",
            "farmer",
            "viewer",
          ],
        },
      ],
    },


    {
      title: "Account",

      links: [
        {
          label: "Settings",
          icon: "⚙",
          path: "/settings",
          roles: [
            "admin",
            "farmer",
          ],
        },
      ],
    },


    {
      title: "Administration",

      links: [
        {
          label: "User Management",
          icon: "♙",
          path: "/admin/users",
          roles: [
            "admin",
          ],
        },
      ],
    },
  ];


  const canAccess = (
    link
  ) => {

    return link.roles.includes(
      role
    );

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

        {/* BRAND */}

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


        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          {navigationSections.map(
            (section) => {

              const visibleLinks =
                section.links.filter(
                  canAccess
                );


              if (
                visibleLinks.length === 0
              ) {
                return null;
              }


              return (
                <div
                  key={section.title}
                  className="sidebar-section"
                >

                  <div className="nav-section-title">
                    {section.title}
                  </div>


                  {visibleLinks.map(
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


                        <span className="nav-label">
                          {link.label}
                        </span>

                      </NavLink>

                    )
                  )}

                </div>
              );

            }
          )}

        </nav>


        {/* LOGOUT ONLY */}

        <div className="sidebar-bottom">

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >

            <span className="logout-icon">
              ↪
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

    </>
  );
};


export default Sidebar;