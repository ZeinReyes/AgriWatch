import {
  useState,
} from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";


const DashboardLayout = ({
  children,
}) => {

  const [
    sidebarOpen,
    setSidebarOpen
  ] = useState(false);


  return (
    <div className="dashboard-layout">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />


      <div className="dashboard-main">

        <Topbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />


        <main className="dashboard-content">

          {children}

        </main>

      </div>

    </div>
  );
};


export default DashboardLayout;