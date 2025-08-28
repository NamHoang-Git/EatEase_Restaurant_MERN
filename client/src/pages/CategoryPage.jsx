import React, { useState } from 'react';
import { useEffect } from 'react';
import UploadCategoryModel from '../components/UploadCategoryModel';
import SummaryApi from '../common/SummaryApi';
import Loading from './../components/Loading';
import NoData from '../components/NoData';
import Axios from '../utils/Axios';
import EditCategory from '../components/EditCategory';
import ConfirmBox from '../components/ConfirmBox';
import AxiosToastError from '../utils/AxiosToastError';
import successAlert from '../utils/successAlert';

const CategoryPage = () => {
    const [openUploadCaregory, setOpenUploadCaregory] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [openEdit, setOpenEdit] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        image: '',
    });

    const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false);
    const [deleteCategory, setDeleteCategory] = useState({
        _id: '',
    });

    const fetchCategory = async () => {
        // API admin cần authentication - giữ nguyên check
        const accessToken = localStorage.getItem('accesstoken');
        if (!accessToken) return;

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_category,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                setData(responseData.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategory();
    }, []);

    const handleDeleteCategory = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.delete_category,
                data: deleteCategory,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                successAlert(responseData.message);
                fetchCategory();
                setOpenConfirmBoxDelete(false);
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    return (
        <section className="">
            <div
                className="p-2 mb-2 bg-slate-50 rounded shadow-md flex items-center
            justify-between gap-4"
            >
                <h2 className="font-bold">Category</h2>
                <button
                    onClick={() => setOpenUploadCaregory(true)}
                    className="text-sm border border-green-400 hover:bg-green-200
                rounded py-1 px-2"
                >
                    Add Category
                </button>
            </div>

            {!data[0] && !loading && <NoData />}

            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {data.map((category, index) => {
                    return (
                        <div
                            className="relative group rounded shadow-md cursor-pointer"
                            key={category._id || index}
                        >
                            <div className="grid gap-2 place-items-center">
                                <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-32 h-32 object-cover rounded"
                                />
                                <span className="text-center">
                                    {category.name}
                                </span>
                            </div>
                            <div
                                className="absolute -bottom-12 left-0 right-0 z-10 hidden group-hover:flex
                                items-center gap-2 p-2 bg-white shadow-md rounded"
                            >
                                <button
                                    onClick={() => {
                                        setOpenEdit(true);
                                        setEditData(category);
                                    }}
                                    className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-600
                                    font-semibold rounded p-1"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        setOpenConfirmBoxDelete(true);
                                        setDeleteCategory(category);
                                    }}
                                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-600
                                    font-semibold rounded p-1"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {loading && <Loading />}

            {openUploadCaregory && (
                <UploadCategoryModel
                    fetchData={fetchCategory}
                    close={() => setOpenUploadCaregory(false)}
                />
            )}

            {openEdit && (
                <EditCategory
                    fetchData={fetchCategory}
                    data={editData}
                    close={() => setOpenEdit(false)}
                />
            )}

            {openConfirmBoxDelete && (
                <ConfirmBox
                    confirm={handleDeleteCategory}
                    cancel={() => setOpenConfirmBoxDelete(false)}
                    close={() => setOpenConfirmBoxDelete(false)}
                />
            )}
        </section>
    );
};

export default CategoryPage;
