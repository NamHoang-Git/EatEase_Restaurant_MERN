import React from 'react';
import { IoClose } from 'react-icons/io5';

const ConfirmBox = ({ cancel, confirm, close }) => {
    return (
        <div
            className="fixed top-0 bottom-0 left-0 right-0
        bg-neutral-800 z-50 bg-opacity-60 p-4 flex items-center justify-center"
        >
            <div className="bg-white max-w-md w-full p-4 rounded">
                <div className="flex items-center justify-between">
                    <h1 className="font-semibold">Permanent Delete</h1>
                    <button
                        onClick={close}
                        className="text-neutral-900 w-fit block ml-auto"
                    >
                        <IoClose size={25} />
                    </button>
                </div>
                <p className="my-4">Are you sure permanent delete?</p>
                <div className="w-fit ml-auto flex items-center gap-3 bg-white">
                    <button
                        onClick={confirm}
                        className="bg-white text-green-600 hover:bg-green-500 hover:text-white
                        font-semibold rounded px-3 py-1 border border-green-500"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={cancel}
                        className="bg-white text-red-600 hover:bg-red-500 hover:text-white
                        font-semibold rounded px-3 py-1 border border-red-500"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmBox;
