import React, { useEffect, useState } from 'react';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import Axios from '../utils/Axios';
import Loading from '../components/Loading';
import NoData from '../components/NoData';
import ProductCartAdmin from '../components/ProductCartAdmin';
import { IoSearch } from 'react-icons/io5';

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
                    limit: 12,
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
                className="p-2 mb-3 bg-slate-50 rounded shadow-md flex items-center
            justify-between gap-4"
            >
                <h2 className="font-bold">Product</h2>
                <div
                    className="h-full w-full max-w-72 ml-auto min-w-16 lg:min-w-24 bg-blue-50 px-4 py-2
                flex items-center gap-2 rounded-md border focus-within:border-primary-200"
                >
                    <IoSearch size={20} className="mr-1" />
                    <input
                        type="text"
                        placeholder="Search product here..."
                        className="h-full w-full outline-none bg-transparent"
                        value={search}
                        onChange={handleOnChange}
                    />
                </div>
            </div>

            {!productData[0] && !loading && <NoData />}

            <div className="">
                <div className="min-h-[65vh]">
                    <div
                        className="p-4 pb-10 grid grid-cols-2 sm:grid-cols-3
                md:grid-cols-4 lg:grid-cols-6 gap-6"
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
                <div className="flex justify-between">
                    <button
                        onClick={handlePreviousPage}
                        className="bg-white border border-slate-700 text-center text-slate-600 font-semibold
                    hover:bg-rose-100 hover:text-rose-600 hover:border-rose-600 px-4 py-1 rounded cursor-pointer"
                    >
                        Previous
                    </button>

                    <button className="w-full font-semibold">
                        {page}/{totalPageCount}
                    </button>

                    <button
                        onClick={handleNextPage}
                        className="bg-white border border-slate-700 text-center text-slate-600 font-semibold
                    hover:bg-rose-100 hover:text-rose-600 hover:border-rose-600 px-4 py-1 rounded cursor-pointer"
                    >
                        Next
                    </button>
                </div>
                <div className="p-[0.5px] bg-slate-300 my-2"></div>
            </div>

            {loading && <Loading />}
        </section>
    );
};

export default ProductAdmin;
