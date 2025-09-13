import React from 'react';
import UserMenu from '../components/UserMenu';
import { FaArrowCircleLeft } from 'react-icons/fa';

const UserMenuMobile = () => {
    return (
        <section className="bg-white h-full w-full py-2 px-3 mt-2 shadow-lg">
            <div className="container mx-auto pb-4 flex items-start gap-3">
                <button
                    onClick={() => window.history.back()}
                    className="text-secondary-200 hover:opacity-70 mt-[1px]"
                >
                    <FaArrowCircleLeft size={20} />
                </button>
                <div className="w-full">
                    <UserMenu />
                </div>
            </div>
        </section>
    );
};

export default UserMenuMobile;
