import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import Loading from './Loading';

const ConfirmBox = ({
    cancel,
    confirm,
    close,
    title,
    message,
    confirmText,
    cancelText,
}) => {
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    return (
        <section
            onClick={close}
            className="bg-neutral-800 z-50 bg-opacity-60 fixed top-0 left-0 right-0 bottom-0 overflow-auto
        flex items-center justify-center px-2"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white px-4 py-6 w-full max-w-md mx-auto rounded-md shadow-md
            flex flex-col gap-4"
            >
                <div className="flex justify-between items-center gap-4">
                    <h1 className="font-semibold text-lg text-secondary-200">{title}</h1>
                    <button
                        onClick={close}
                        className="hover:text-secondary-200"
                    >
                        <IoClose size={25} />
                    </button>
                </div>
                <p className="my-2 text-base font-medium">{message}</p>
                <div className="w-fit ml-auto flex items-center gap-3 bg-white">
                    <button
                        onClick={async () => {
                            setConfirmLoading(true);
                            try {
                                await Promise.resolve(confirm());
                            } finally {
                                setConfirmLoading(false);
                            }
                        }}
                        disabled={cancelLoading}
                        className="bg-white text-green-600 hover:bg-green-500 hover:text-white
                        font-semibold rounded px-6 py-1 border border-green-500 disabled:opacity-50"
                    >
                        {confirmLoading ? <Loading /> : confirmText}
                    </button>
                    <button
                        onClick={async () => {
                            setCancelLoading(true);
                            try {
                                await Promise.resolve(cancel());
                            } finally {
                                setCancelLoading(false);
                            }
                        }}
                        disabled={confirmLoading}
                        className="bg-white text-red-600 hover:bg-red-500 hover:text-white
                        font-semibold rounded px-6 py-1 border border-red-500 disabled:opacity-50"
                    >
                        {cancelLoading ? <Loading /> : cancelText}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ConfirmBox;
