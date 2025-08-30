import React, { useState } from 'react';
import EditProductAdmin from './EditProductAdmin';
import ConfirmBox from './ConfirmBox';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import AxiosToastError from '../utils/AxiosToastError';
import successAlert from '../utils/successAlert';
import { DisplayPriceInVND } from '../utils/DisplayPriceInVND';
import ViewImage from './ViewImage';

const ProductCartAdmin = ({ data, fetchProduct }) => {
    const [openEdit, setOpenEdit] = useState(false);
    const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false);
    const [imageURL, setImageURL] = useState('');

    const handleDeleteProduct = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.delete_product,
                data: {
                    _id: data._id,
                },
            });

            const { data: responseData } = response;

            if (responseData.success) {
                successAlert(responseData.message);
                if (fetchProduct) {
                    fetchProduct();
                }
                setOpenConfirmBoxDelete(false);
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    return (
        <div
            className="group bg-white rounded-xl shadow-md shadow-secondary-100
        hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
            key={data._id}
        >
            <div className="w-full h-32 sm:h-40 md:h-48 overflow-hidden">
                <img
                    src={data?.image[0]}
                    alt={data?.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 border"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-product.jpg';
                    }}
                    onClick={() => setImageURL(data?.image[0])}
                />
            </div>

            <div
                className="px-2 py-3 sm:px-3 sm:py-4 flex flex-col gap-2 lg:gap-2
            text-xs md:text-base"
            >
                <h2
                    title={data?.name}
                    className="font-bold sm:text-base text-xs line-clamp-2 h-8 sm:h-12 md:h-11 lg:h-12"
                >
                    {data?.name}
                </h2>
                <div className="flex gap-3 md:text-base text-sm justify-between">
                    <p
                        title={data?.unit}
                        className="font-semibold line-clamp-1 text-slate-500"
                    >
                        {data?.unit}
                    </p>
                    <p className="text-secondary-200 font-bold">
                        {DisplayPriceInVND(data?.price)}
                    </p>
                </div>

                {/* PC & Tablet */}
                <div className="mt-1 md:flex hidden gap-2">
                    <button
                        onClick={() => {
                            setOpenEdit(true);
                        }}
                        className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-600
                    font-semibold rounded p-1 flex items-center justify-center gap-1"
                    >
                        <svg
                            className="w-4 h-4 mb-[2px]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                        </svg>
                        <span>Sửa</span>
                    </button>
                    <button
                        onClick={() => {
                            setOpenConfirmBoxDelete(true);
                        }}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-600
                    font-semibold rounded p-1 flex items-center justify-center gap-1"
                    >
                        <svg
                            className="w-4 h-4 mb-[2px]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                        <span>Xóa</span>
                    </button>
                </div>

                {/* Mobile */}
                <div className="mt-1 md:hidden flex gap-2">
                    <button
                        onClick={() => {
                            setOpenEdit(true);
                        }}
                        className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-600
                    font-semibold rounded p-1 flex items-center justify-center gap-1"
                    >
                        <svg
                            className="w-4 h-4 mb-[2px]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => {
                            setOpenConfirmBoxDelete(true);
                        }}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-600
                    font-semibold rounded p-1 flex items-center justify-center gap-1"
                    >
                        <svg
                            className="w-4 h-4 mb-[2px]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {openEdit && (
                <EditProductAdmin
                    close={() => setOpenEdit(false)}
                    fetchProduct={fetchProduct}
                    data={data}
                />
            )}

            {openConfirmBoxDelete && (
                <ConfirmBox
                    close={() => setOpenConfirmBoxDelete(false)}
                    cancel={() => setOpenConfirmBoxDelete(false)}
                    confirm={handleDeleteProduct}
                    title="Xác nhận xóa sản phẩm"
                    content="Bạn có chắc chắn muốn xóa sản phẩm này?"
                    cancelText="Hủy"
                    confirmText="Xóa"
                />
            )}

            {imageURL && (
                <ViewImage url={imageURL} close={() => setImageURL('')} />
            )}
        </div>
    );
};

export default ProductCartAdmin;
