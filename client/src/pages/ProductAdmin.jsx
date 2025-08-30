import React, { useEffect, useState } from 'react';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import Axios from '../utils/Axios';
import Loading from '../components/Loading';
import NoData from '../components/NoData';
import ProductCartAdmin from '../components/ProductCartAdmin';
import { IoArrowBack, IoArrowForward, IoSearch } from 'react-icons/io5';

const ProductAdmin = () => {
    const [productData, setProductData] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [totalPageCount, setTotalPageCount] = useState(1);
    const [search, setSearch] = useState('');

    const fetchProduct = async () => {
        // API admin cần authentication - giữ nguyên check
        const accessToken = localStorage.getItem('accesstoken');
        if (!accessToken) return;

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_product,
                data: {
                    page: page,
                    limit: 8,
                    search: search,
                },
            });

            const { data: responseData } = response;

            if (responseData.success) {
                setTotalPageCount(responseData.totalNoPage);
                setProductData(responseData.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [page]);

    const handleNextPage = () => {
        if (page !== totalPageCount) {
            setPage((prev) => prev + 1);
        }
    };

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage((prev) => prev - 1);
        }
    };

    const handleOnChange = (e) => {
        const { value } = e.target;

        setSearch(value);
        setPage(1);
    };

    useEffect(() => {
        let flag = true;

        const interval = setTimeout(() => {
            if (flag) {
                fetchProduct();
                flag = false;
            }
        }, 300);

        return () => {
            clearTimeout(interval);
        };
    }, [search]);

    return (
        <section className="">
            <div
                className="px-3 py-4 mb-3 bg-primary-4 rounded-md shadow-md shadow-secondary-100
                font-bold text-secondary-200 sm:text-lg text-sm flex justify-between sm:flex-row flex-col
                sm:items-center gap-4"
            >
                <div className="flex-row sm:flex-col flex items-center sm:items-start gap-2 sm:gap-1">
                    <h2 className="text-ellipsis uppercase">
                        Sản phẩm
                    </h2>
                    <div className="w-[14px] h-[2px] bg-secondary-200 sm:hidden mb-[1px]"></div>
                    <p className="text-[12px] sm:text-base text-secondary-100">
                        Quản lý sản phẩm của bạn
                    </p>
                </div>

                {/* Search */}
                <div
                    className="h-full max-w-64 w-full mx-auto sm:mr-0 min-w-16 lg:min-w-24 bg-white px-4 sm:py-3 py-[6px]
                flex items-center gap-3 rounded-xl shadow-md shadow-secondary-100 focus-within:border-secondary-200"
                >
                    <IoSearch size={22} className="mb-[3px]" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        className="h-full w-full outline-none bg-transparent text-[12px] sm:text-base"
                        value={search}
                        onChange={handleOnChange}
                    />
                </div>
            </div>

            {!productData[0] && !loading && <NoData />}

            {loading ? (
                <div className="flex justify-center items-center">
                    <Loading />
                </div>
            ) : (
                <div className="">
                    <div className="min-h-[65vh]">
                        <div
                            className="py-4 px-1 sm:p-4 pb-8 grid grid-cols-2 sm:grid-cols-2
                md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
                        >
                            {productData.map((product, index) => {
                                return (
                                    <ProductCartAdmin
                                        key={product._id || index}
                                        data={product}
                                        fetchProduct={fetchProduct}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex justify-between px-4">
                        <button
                            onClick={handlePreviousPage}
                            className="bg-white border-2 border-slate-700 text-center text-slate-600 font-semibold
                    hover:bg-rose-100 hover:text-rose-600 hover:border-rose-600 px-4 py-1 rounded cursor-pointer"
                        >
                            <IoArrowBack size={22} />
                        </button>

                        {loading ? (
                            <div className="flex justify-center items-center">
                                <Loading />
                            </div>
                        ) : (
                            <button className="w-full font-semibold">
                                {page}/{totalPageCount}
                            </button>
                        )}

                        <button
                            onClick={handleNextPage}
                            className="bg-white border-2 border-slate-700 text-center text-slate-600 font-semibold
                    hover:bg-rose-100 hover:text-rose-600 hover:border-rose-600 px-4 py-1 rounded cursor-pointer"
                        >
                            <IoArrowForward size={22} />
                        </button>
                    </div>
                    <div className="p-[0.5px] bg-slate-300 my-2"></div>
                </div>
            )}
        </section>
    );
};

export default ProductAdmin;
