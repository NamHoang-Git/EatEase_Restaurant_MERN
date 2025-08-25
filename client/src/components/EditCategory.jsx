import React, { useState } from 'react';
import { IoAddSharp, IoClose } from 'react-icons/io5';
import uploadImage from '../utils/UploadImage.js';
import Axios from '../utils/Axios.js';
import SummaryApi from '../common/SummaryApi.js';
import AxiosToastError from '../utils/AxiosToastError.js';
import Loading from './Loading.jsx';
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
            className="fixed top-0 bottom-0 left-0 right-0
                bg-neutral-800 z-50 bg-opacity-60 p-4 flex items-center justify-center"
        >
            <div className="bg-white max-w-4xl w-full p-4 rounded">
                <div className="flex items-center justify-between">
                    <h1 className="font-bold">Edit Category</h1>
                    <button
                        onClick={close}
                        className="text-neutral-900 w-fit block ml-auto"
                    >
                        <IoClose size={25} />
                    </button>
                </div>
                <form
                    action=""
                    className="mt-6 mb-2 grid gap-6"
                    onSubmit={handleSubmit}
                >
                    <div className="grid gap-2">
                        <label id="categoryName" htmlFor="">
                            Name (<span className="text-red-500">*</span>)
                        </label>
                        <input
                            type="text"
                            className="bg-blue-50 p-2 border rounded outline-none
                                    focus-within:border-primary-200"
                            id="categoryName"
                            placeholder="Enter category name!"
                            value={data.name}
                            name="name"
                            onChange={handleOnChange}
                        />
                    </div>
                    <div className="grid gap-2">
                        <p>
                            Image (<span className="text-red-500">*</span>)
                        </p>
                        <div className="flex gap-4 items-center flex-col lg:flex-row">
                            <div
                                className="bg-blue-50 p-2 h-36 w-full lg:w-36 border rounded
                                        flex items-center justify-center"
                            >
                                {data.image ? (
                                    <img
                                        src={data.image}
                                        alt="category"
                                        className="w-full h-full object-scale-down"
                                    />
                                ) : (
                                    <p className="text-sm text-neutral-500">
                                        No Image
                                    </p>
                                )}
                            </div>
                            <label htmlFor="uploadCategoryImage">
                                <div
                                    className={`${
                                        !data.name
                                            ? 'bg-gray-300 text-white cursor-no-drop'
                                            : 'bg-blue-400 text-white hover:bg-blue-600 cursor-pointer'
                                    } px-3 py-1 text-sm rounded-md`}
                                >
                                    {loading ? (
                                        <Loading />
                                    ) : (
                                        <IoAddSharp size={42} />
                                    )}
                                </div>
                                <input
                                    disabled={!data.name}
                                    onChange={handleUploadCategoryImage}
                                    type="file"
                                    accept="image/*"
                                    id="uploadCategoryImage"
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <button
                        className={`${
                            data.name && data.image
                                ? 'bg-orange-600 text-white hover:bg-orange-500 cursor-pointer'
                                : 'bg-gray-300 text-gray-700 font-semibold cursor-no-drop'
                        } py-2 rounded-md`}
                    >
                        Update
                    </button>
                </form>
            </div>
        </section>
    );
};

export default EditCategory;
