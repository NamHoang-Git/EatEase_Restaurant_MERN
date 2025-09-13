import React from 'react';
import UserMenu from '../components/UserMenu';
import { IoClose } from 'react-icons/io5';

const UserMenuMobile = () => {
    return (
        <section className="bg-white h-full w-full py-2 px-2 mt-2 shadow-lg">
            <button
                onClick={() => window.history.back()}
                className="text-secondary-200 hover:opacity-70 block w-fit ml-auto"
            >
                <IoClose size={22} />
            </button>
            <div className="container mx-auto px-3 pb-8">
                <UserMenu />
            </div>
        </section>
    );
};

export default UserMenuMobile;
