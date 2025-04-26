import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import SideNav from "./SideNav";
import RightSideBar from "./RightSideBar";
import { Toaster } from "react-hot-toast";
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

    return (
        <div className={`grid gap-1 sm:gap-5 h-full overflow-hidden bg-[#ECECEC] ${shouldShowRightSidebar ? "grid-cols-[auto_1fr_auto]" : "grid-cols-[auto_1fr] pr-5"}` }>
            {/* Left Side Navigation with fixed width */}
            <aside>
                <SideNav />
            </aside>
            {/* Main Content Area */}
            <Toaster />
            <main className="overflow-hidden col-span-1">
                <div className="w-full bg-blue-100 border-b-2 border-blue-500">
                    <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center">
                        <span className="text-blue-500 font-bold mr-2">BETA</span>
                        <p className="text-sm text-blue-700">
                            This is a beta version of the application. Features may change and bugs may exist.
                        </p>
                    </div>
                </div>
                <Outlet />
            </main>
            {/* Right Side Bar (conditionally rendered and responsive) */}
            {shouldShowRightSidebar && (
                <aside className="hidden xl:block">
                    {/* <RightSideBar /> */}
                </aside>
            )}
        </div>
    );
};

export default DashboardLayout;
