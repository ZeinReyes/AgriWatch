import {
  useState,
} from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import "./DashboardLayout.css";


const DashboardLayout = ({
  children,
}) => {

  const [
    sidebarOpen,
    setSidebarOpen
  ] = useState(false);


  return (
    <div className="dashboard-layout">

      <Topbar
        onMenuClick={() =>
          setSidebarOpen(true)
        }
      />


      <Sidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />


      <main className="dashboard-content">

        {children}

      </main>

    </div>
  );
};


export default DashboardLayout;