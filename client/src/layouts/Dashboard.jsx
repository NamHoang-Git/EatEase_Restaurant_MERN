import React from 'react';
import UserMenu from '../components/UserMenu';
import { Outlet } from 'react-router-dom';

const Dashboard = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Header will be rendered here by the layout */}
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
                        <div className="max-w-full mx-auto">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
