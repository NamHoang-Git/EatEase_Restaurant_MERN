import React, { useEffect, useState, useCallback } from 'react';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import AxiosToastError from '../utils/AxiosToastError';
import Loading from '../components/Loading';
import NoData from '../components/NoData';
import ProductCartAdmin from '../components/ProductCartAdmin';
import {
    IoArrowBack,
    IoArrowForward,
    IoSearch,
    IoFilter,
    IoClose,
} from 'react-icons/io5';
import { debounce } from 'lodash';

const ProductAdmin = () => {
    const [productData, setProductData] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [totalPageCount, setTotalPageCount] = useState(1);
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        sortBy: 'newest',
        category: 'all',
    });

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const response = await Axios({
                ...SummaryApi.get_category,
                method: 'get',
            });
            if (response.data.success) {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }, []);

    const fetchProduct = useCallback(async () => {
        const accessToken = localStorage.getItem('accesstoken');
        if (!accessToken) return;

        try {
            setLoading(true);

            // Prepare request data with proper parameter names
            const requestData = {
                page,
                limit: 8,
                search: search.trim(),
                minPrice: filters.minPrice
                    ? Number(filters.minPrice)
                    : undefined,
                maxPrice: filters.maxPrice
                    ? Number(filters.maxPrice)
                    : undefined,
                sort: filters.sortBy,
                category:
                    filters.category !== 'all' ? filters.category : undefined,
            };

            // Remove undefined values
            Object.keys(requestData).forEach((key) => {
                if (requestData[key] === undefined || requestData[key] === '') {
                    delete requestData[key];
                }
            });

            const response = await Axios({
                ...SummaryApi.get_product,
                data: requestData,
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
    }, [page, search, filters]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        // Only allow numbers or empty string for price inputs
        if (
            (name === 'minPrice' || name === 'maxPrice') &&
            value !== '' &&
            !/^\d*$/.test(value)
        ) {
            return;
        }

        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
        setPage(1);
    };

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            minPrice: '',
            maxPrice: '',
            sortBy: 'newest',
            category: 'all',
        });
        setPage(1);
    };

    // Add debounce for filters
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProduct();
        }, 300);

        return () => clearTimeout(timer);
    }, [filters, search, page]);

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

    const debouncedSearch = React.useCallback(
        debounce(() => {
            fetchProduct();
        }, 500),
        [filters, search]
    );

    useEffect(() => {
        debouncedSearch();
        return () => debouncedSearch.cancel();
    }, [search]);

    // Render filter controls
    const renderFilterControls = () => (
        <div className="bg-white p-4 rounded-lg shadow-lg mb-4 border border-secondary-100 text-secondary-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Bộ lọc</h3>
                <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-secondary-200"
                >
                    <IoClose size={24} />
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="grid gap-1">
                    <label className="block text-sm font-medium text-secondary-200">
                        Giá từ
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            name="minPrice"
                            value={filters.minPrice}
                            onChange={handleFilterChange}
                            placeholder="Tối thiểu"
                            className="w-full p-2 border rounded text-sm"
                        />
                        <span>-</span>
                        <input
                            type="text"
                            name="maxPrice"
                            value={filters.maxPrice}
                            onChange={handleFilterChange}
                            placeholder="Tối đa"
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                </div>

                <div className="grid gap-1">
                    <label className="block text-sm font-medium text-secondary-200">
                        Sắp xếp
                    </label>
                    <select
                        name="sortBy"
                        value={filters.sortBy}
                        onChange={handleFilterChange}
                        className="w-full p-2 border rounded text-sm text-secondary-100"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                        <option value="name_asc">Tên A-Z</option>
                    </select>
                </div>

                <div className="grid gap-1">
                    <label className="block text-sm font-medium text-secondary-200">
                        Danh mục
                    </label>
                    <select
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        className="w-full p-2 border rounded text-sm text-secondary-100"
                    >
                        <option value="all">Tất cả danh mục</option>
                        {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 bg-primary-2 text-secondary-200 rounded hover:opacity-80 transition-colors
                    text-sm font-semibold shadow-lg"
                    >
                        Đặt lại bộ lọc
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <section className="">
            <div
                className="px-3 py-4 mb-3 bg-primary-4 rounded-md shadow-md shadow-secondary-100
                font-bold text-secondary-200 sm:text-lg text-sm flex justify-between sm:flex-row flex-col
                sm:items-center gap-4"
            >
                <div className="flex-row sm:flex-col flex items-center sm:items-start gap-2 sm:gap-1">
                    <h2 className="text-ellipsis uppercase">Sản phẩm</h2>
                    <p className="hidden sm:block sm:text-base text-secondary-100">
                        Quản lý sản phẩm của bạn
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filter Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="sm:h-[42px] h-11 flex items-center gap-1 px-3 py-2 bg-white text-secondary-200 rounded-md
                        hover:bg-gray-100 transition-colors text-sm font-medium shadow-md shadow-secondary-100"
                    >
                        <IoFilter className="mb-[2px]" />
                        <span>Lọc</span>
                    </button>

                    {/* Search */}
                    <div
                        className="sm:h-[42px] h-11 max-w-64 w-full min-w-16 lg:min-w-24 bg-white px-4 sm:py-3 py-[6px]
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
            </div>

            {showFilters && renderFilterControls()}

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
                            {productData.map((product, index) => (
                                <ProductCartAdmin
                                    key={product._id || index}
                                    data={product}
                                    fetchProduct={fetchProduct}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between px-4">
                        <button
                            onClick={handlePreviousPage}
                            disabled={page === 1}
                            className={`flex items-center gap-1 px-3 py-1 rounded ${
                                page === 1
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-white border-2 border-slate-700 text-slate-600 hover:bg-rose-100 hover:text-rose-600 hover:border-rose-600'
                            }`}
                        >
                            <IoArrowBack size={20} />
                            <span className="hidden sm:inline">Trước</span>
                        </button>

                        <div className="flex items-center font-medium">
                            Trang {page} / {totalPageCount}
                        </div>

                        <button
                            onClick={handleNextPage}
                            disabled={page === totalPageCount}
                            className={`flex items-center gap-1 px-3 py-1 rounded ${
                                page === totalPageCount
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-white border-2 border-slate-700 text-slate-600 hover:bg-rose-100 hover:text-rose-600 hover:border-rose-600'
                            }`}
                        >
                            <span className="hidden sm:inline">Tiếp</span>
                            <IoArrowForward size={20} />
                        </button>
                    </div>
                    <div className="p-[0.5px] bg-slate-300 my-4"></div>
                </div>
            )}
        </section>
    );
};

export default ProductAdmin;
