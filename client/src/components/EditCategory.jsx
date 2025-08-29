import React, { useState } from 'react';
import { IoAddSharp, IoClose } from 'react-icons/io5';
import uploadImage from '../utils/UploadImage.js';
import Axios from '../utils/Axios.js';
import SummaryApi from '../common/SummaryApi.js';
import AxiosToastError from '../utils/AxiosToastError.js';
import successAlert from '../utils/successAlert.js';

const EditCategory = ({ close, fetchData, data: CategoryData }) => {
    const [data, setData] = useState({
        _id: CategoryData._id,
        name: CategoryData.name,
        image: CategoryData.image,
    });

    const [loading, setLoading] = useState(false);

    const handleOnChange = (e) => {
        const { name, value } = e.target;

        setData((prev) => {
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const handleUploadCategoryImage = async (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        setLoading(true);
        const response = await uploadImage(file);
        const { data: ImageResponse } = response;
        setLoading(false);

        setData((prev) => {
            return {
                ...prev,
                image: ImageResponse.data.url,
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.update_category,
                data: data,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                successAlert(responseData.message);
                close();
                fetchData();
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section
            onClick={close}
            className="bg-neutral-800 z-50 bg-opacity-60 fixed top-0 left-0 right-0 bottom-0 overflow-auto
        flex items-center justify-center px-2"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-secondary-200">
                            Chỉnh sửa danh mục
                        </h3>
                        <button
                            onClick={close}
                            className="text-gray-400 hover:text-secondary-200 transition-colors"
                        >
                            <IoClose size={24} />
                        </button>
                    </div>
                </div>

                <form className="px-6 py-4 space-y-5" onSubmit={handleSubmit}>
                    {/* Category Name */}
                    <div className="space-y-2">
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Tên danh mục <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={data.name}
                            onChange={handleOnChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-200 focus:outline-none transition-all"
                            placeholder="Nhập tên danh mục"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Hình ảnh <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="file"
                            id="uploadCategoryImage"
                            accept="image/*"
                            onChange={handleUploadCategoryImage}
                            className="hidden"
                            disabled={loading}
                        />
                        <label
                            htmlFor="uploadCategoryImage"
                            className={`block border-2 border-dashed rounded-xl sm:p-6 p-4 text-center cursor-pointer
                            transition-all duration-200 ${
                                data.image
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-gray-300 hover:border-primary-200'
                            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {data.image ? (
                                <div className="relative">
                                    <img
                                        src={data.image}
                                        alt="Preview"
                                        className="sm:h-40 h-32 mx-auto object-contain rounded-lg"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                                        <span className="text-white bg-black/70 text-xs px-2 py-1 rounded">
                                            Nhấn để thay đổi ảnh
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <IoAddSharp
                                                className="text-gray-400"
                                                size={24}
                                            />
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <p className="font-medium">
                                            Tải ảnh lên
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            PNG, JPG (tối đa 5MB)
                                        </p>
                                    </div>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={close}
                            className="px-6 py-[6px] border-2 border-secondary-100 rounded-lg text-secondary-200 hover:bg-secondary-100
                            focus:outline-none focus:ring-2 focus:ring-offset-2 hover:text-white font-semibold focus:ring-secondary-200"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-[6px] bg-primary text-secondary-200 shadow-lg rounded-lg hover:opacity-80
                            focus:outline-none flex items-center disabled:opacity-50 font-semibold"
                            disabled={!data.name || !data.image || loading}
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Đang lưu...
                                </>
                            ) : (
                                'Cập nhật'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default EditCategory;
