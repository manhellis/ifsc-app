import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import SideNav from "./SideNav";
import RightSideBar from "./RightSideBar";

/**
 * DashboardLayout is a layout wrapper for all dashboard-related pages.
 * It includes a sidebar navigation (using the existing SideNav component)
 * and an Outlet for nested dashboard routes.
 */
const DashboardLayout: React.FC = () => {
    const location = useLocation();

    // Define routes where the right sidebar should be hidden
    const hideSidebarRoutes = [
        "/dashboard/profile",
        "/dashboard/league",
        "/dashboard/leaderboards",
        "/dashboard/my-picks",
    ];
    // Determine if the right sidebar should be shown
    const shouldShowRightSidebar = !hideSidebarRoutes.some((route) =>
        location.pathname.startsWith(route)
    );

    // Define grid template columns with a fixed width for the left side nav (16rem)
    // When the right sidebar is shown: left nav, main content, right sidebar
    // When hidden: left nav, main content
    const gridTemplate = shouldShowRightSidebar
        ? "grid-cols-[14rem_auto_auto]"
        : "grid-cols-[14rem_auto]";

    return (
        <div className={`grid ${gridTemplate} gap-5 h-screen overflow-hidden bg-[#ECECEC]`}>
            {/* Left Side Navigation with fixed width */}
            <aside>
                <SideNav />
            </aside>
            {/* Main Content Area */}
            <main className="overflow-hidden">
                <Outlet />
            </main>
            {/* Right Side Bar (conditionally rendered) */}
            {shouldShowRightSidebar && (
                <aside>
                    <RightSideBar />
                </aside>
            )}
        </div>
    );
};

export default DashboardLayout;
