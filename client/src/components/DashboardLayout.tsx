import React from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import RightSideBar from './RightSideBar';
/**
 * DashboardLayout is a layout wrapper for all dashboard-related pages.
 * It includes a sidebar navigation (using the existing SideNav component)
 * and an Outlet for nested dashboard routes.
 */
const DashboardLayout: React.FC = () => {
  return (
    <div className="grid grid-cols-5 gap-5 h-screen overflow-hidden bg-[#ECECEC]">
      <aside className="col-span-1 ">
        <SideNav />
      </aside>
      <main className="col-span-3 overflow-hidden">
        <Outlet />
      </main>
      <aside className="col-span-1">
        <RightSideBar />
      </aside>
    </div>
  );
};

export default DashboardLayout;