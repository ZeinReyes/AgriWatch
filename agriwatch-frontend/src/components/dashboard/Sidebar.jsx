import {
  NavLink,
} from "react-router-dom";

import {
  LayoutDashboard,
  House,
  Sprout,
  CircleDot,
  Table2,
  Bug,
  TriangleAlert,
  Cloud,
  Droplets,
  FileText,
  Settings,
  UserRoundCog,
  LogOut,
} from "lucide-react";

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


  const role = user?.role;


  const navigationSections = [
    {
      title: "Overview",

      links: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
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
      title: "Farm Management",

      links: [
        {
          label: "My Farm",
          icon: House,
          path: "/farm",
          roles: [
            "admin",
            "farmer",
          ],
        },

        {
          label: "My Crops",
          icon: Sprout,
          path: "/crops",
          roles: [
            "admin",
            "farmer",
          ],
        },
      ],
    },

    {
      title: "Monitoring",

      links: [
        {
          label: "Crop Monitoring",
          icon: CircleDot,
          path: "/monitoring",
          roles: [
            "admin",
            "farmer",
            "viewer",
          ],
        },

        {
          label: "Sensor Data",
          icon: Table2,
          path: "/sensor-data",
          roles: [
            "admin",
            "farmer",
            "viewer",
          ],
        },

        {
          label: "Pest & Disease",
          icon: Bug,
          path: "/pest-disease",
          roles: [
            "admin",
            "farmer",
            "viewer",
          ],
        },
      ],
    },

    {
      title: "Alerts & Conditions",

      links: [
        {
          label: "Alerts",
          icon: TriangleAlert,
          path: "/alerts",
          roles: [
            "admin",
            "farmer",
            "viewer",
          ],
        },

        {
          label: "Weather",
          icon: Cloud,
          path: "/weather",
          roles: [
            "admin",
            "farmer",
            "viewer",
          ],
        },

        {
          label: "Irrigation",
          icon: Droplets,
          path: "/irrigation",
          roles: [
            "admin",
            "farmer",
            "viewer",
          ],
        },
      ],
    },

    {
      title: "Reporting",

      links: [
        {
          label: "Reports",
          icon: FileText,
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
          icon: Settings,
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
          icon: UserRoundCog,
          path: "/admin/users",
          roles: [
            "admin",
          ],
        },
      ],
    },
  ];


  const canAccess = (link) => {
    return link.roles.includes(role);
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

        <div className="sidebar-brand">

          <div className="brand-icon">
            <Sprout
              size={22}
              strokeWidth={2.2}
            />
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


        <nav
          className={`sidebar-nav ${
            role === "admin"
              ? "sidebar-nav-admin"
              : "sidebar-nav-standard"
          }`}
        >

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
                    (link) => {

                      const Icon =
                        link.icon;


                      return (
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
                            <Icon
                              size={18}
                              strokeWidth={2}
                            />
                          </span>


                          <span className="nav-label">
                            {link.label}
                          </span>

                        </NavLink>
                      );

                    }
                  )}

                </div>
              );

            }
          )}

        </nav>


        <div className="sidebar-bottom">

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >

            <span className="logout-icon">
              <LogOut
                size={18}
                strokeWidth={2}
              />
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
