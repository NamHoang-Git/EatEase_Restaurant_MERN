import React from 'react';
import { IoClose } from 'react-icons/io5';

const AddFieldComponent = ({ close, value, onChange, onSubmit }) => {
    return (
        <section
            className="fixed top-0 bottom-0 left-0 right-0
        bg-neutral-800 z-50 bg-opacity-60 p-4 flex items-center justify-center"
        >
            <div className="bg-white max-w-4xl w-full p-4 rounded flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="font-bold">Add Field</h1>
                    <button
                        onClick={close}
                        className="text-neutral-900 w-fit block ml-auto"
                    >
                        <IoClose size={25} />
                    </button>
                </div>
                <input
                    type="text"
                    className="bg-blue-50 p-2 mt-1 border rounded outline-none
                            focus-within:border-primary-200"
                    placeholder="Enter field name!"
                    value={value}
                    onChange={onChange}
                />
                <button
                    disabled={!value}
                    onClick={onSubmit}
                    className={`${
                        value
                            ? 'bg-green-700 text-white font-semibold hover:bg-green-600 cursor-pointer'
                            : 'bg-gray-300 text-gray-700 font-medium cursor-no-drop'
                    } py-2 rounded-md`}
                >
                    Add
                </button>
            </div>
        </section>
    );
};

export default AddFieldComponent;
