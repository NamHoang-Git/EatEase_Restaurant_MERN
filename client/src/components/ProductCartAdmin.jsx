import React, { useState } from 'react';
import EditProductAdmin from './EditProductAdmin';
import ConfirmBox from './ConfirmBox';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import AxiosToastError from '../utils/AxiosToastError';
import successAlert from '../utils/successAlert';

const ProductCartAdmin = ({ data, fetchProduct }) => {
    const [openEdit, setOpenEdit] = useState(false);
    const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false);

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
        <div className="flex flex-col gap-2 bg-white p-2">
            <div
                className="relative w-full h-48 group rounded shadow-md cursor-pointer"
                key={data._id}
            >
                <img
                    src={data?.image[0]}
                    alt={data?.name}
                    className="w-full h-full object-scale-down"
                />
                <div
                    className="absolute -bottom-12 left-0 right-0 z-10 hidden group-hover:flex
                                items-center gap-2 p-2 bg-white shadow-md rounded"
                >
                    <button
                        onClick={() => {
                            setOpenEdit(true);
                        }}
                        className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-600
                                    font-semibold rounded p-1"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => {
                            setOpenConfirmBoxDelete(true);
                        }}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-600
                                    font-semibold rounded p-1"
                    >
                        Delete
                    </button>
                </div>
            </div>
            <div>
                <p className="text-ellipsis line-clamp-2 font-semibold">
                    {data?.name}
                </p>
                <p className="text-slate-500">{data?.unit}</p>
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
                />
            )}
        </div>
    );
};

export default ProductCartAdmin;
