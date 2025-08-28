import React from 'react';

const CardLoading = () => {
    return (
        <div
            className="border grid gap-2 lg:gap-3
        rounded-xl cursor-pointer bg-white animate-pulse"
        >
            <div className="w-full h-40 sm:h-52 bg-blue-50"></div>
            <div className="p-2 lg:p-3 bg-blue-50 rounded w-20"></div>
            <div className="p-2 lg:p-3 bg-blue-50 rounded"></div>
            <div className="p-2 lg:p-3 bg-blue-50 rounded w-14"></div>

            <div className="flex items-center justify-between gap-3">
                <div className="p-2 lg:p-3 bg-blue-50 rounded w-20"></div>
                <div className="p-2 lg:p-3 bg-blue-50 rounded w-20"></div>
            </div>
        </div>
    );
};

export default CardLoading;
