import React from 'react';
import UserMenu from '../components/UserMenu';
import { Outlet, useLocation } from 'react-router-dom';

const Dashboard = () => {
    const { pathname } = useLocation();

    // Các trang cần full width
    const fullWidthRoutes = ['/dashboard/bill', '/dashboard/report'];
    const isFullWidthPage = fullWidthRoutes.some((route) =>
        pathname.startsWith(route)
    );

    return (
        <div
            className={`min-h-screen flex flex-col bg-white p-4 ${
                isFullWidthPage ? 'w-full' : 'container mx-auto'
            }`}
        >
            {/* Header sẽ render ở layout cha */}

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="hidden lg:block w-64 bg-white border-r border-gray-200 overflow-y-auto">
                    <div className="p-4">
                        <UserMenu />
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-4">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
