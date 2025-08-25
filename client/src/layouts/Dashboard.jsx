import React from 'react';
import UserMenu from '../components/UserMenu';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Dashboard = () => {
    const user = useSelector((state) => state.user);

    return (
        <section className="bg-white">
            <div className="container mx-auto p-2 gap-4 grid lg:grid-cols-[250px,1fr]">
                {/* Left for menu */}
                <div
                    className="py-4 px-3 static top-24 max-h-[calc(100vh - 96px)]
                    overflow-y-auto hidden lg:block border-r"
                >
                    <UserMenu />
                </div>

                {/* Right for menu */}
                <div className="bg-white p-4 min-h-[80vh]">
                    <Outlet />
                </div>
            </div>
        </section>
    );
};

export default Dashboard;
