import React from 'react';
import { IoClose } from 'react-icons/io5';

const ViewImage = ({ url, close }) => {
    return (
        <div
            onClick={close}
            className="fixed top-0 bottom-0 left-0 right-0
        bg-neutral-800 z-50 bg-opacity-60 p-4 flex items-center justify-center"
        >
            <div
                className="w-full max-w-md max-h-[70vh] p-4
            bg-neutral-200 rounded-md flex flex-col gap-2"
            >
                <button
                    onClick={close}
                    className="text-neutral-900 w-fit block ml-auto"
                >
                    <IoClose size={25} />
                </button>
                <img
                    src={url}
                    alt="Full Screen"
                    title={url}
                    className="w-full h-full object-scale-down"
                />
            </div>
        </div>
    );
};

export default ViewImage;
