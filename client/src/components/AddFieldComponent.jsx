import React from 'react';
import { IoClose } from 'react-icons/io5';

const AddFieldComponent = ({ close, value, onChange, onSubmit }) => {
    return (
        <section
            onClick={close}
            className="bg-neutral-800 z-50 bg-opacity-60 fixed top-0 left-0 right-0 bottom-0 overflow-auto
        flex items-center justify-center px-2"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-secondary-200">
                            Thêm trường mới
                        </h3>
                        <button
                            onClick={close}
                            className="text-gray-400 hover:text-secondary-200 transition-colors"
                        >
                            <IoClose size={24} />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-6 space-y-6 text-sm">
                    <div className="space-y-2">
                        <label
                            htmlFor="fieldName"
                            className="block font-semibold text-gray-700"
                        >
                            Tên trường <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="fieldName"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary-100
                            focus:border-secondary-100 focus:outline-none transition-all"
                            placeholder="Nhập tên trường"
                            value={value}
                            onChange={onChange}
                            autoFocus
                        />
                    </div>

                    <div className="flex sm:text-sm text-xs justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={close}
                            className="px-6 py-[6px] border-2 border-secondary-100 rounded-lg text-secondary-200 hover:bg-secondary-100
                            focus:outline-none focus:ring-2 focus:ring-offset-2 hover:text-white font-semibold focus:ring-secondary-200"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={!value}
                            className="px-6 py-[6px] bg-primary text-secondary-200 shadow-lg rounded-lg hover:opacity-80
                            focus:outline-none disabled:opacity-50 font-semibold"
                        >
                            Thêm
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AddFieldComponent;
