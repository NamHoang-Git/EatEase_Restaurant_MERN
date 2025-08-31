import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Axios from './../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import CardProduct from './../components/CardProduct';
import CardLoading from './../components/CardLoading';
import { debounce } from 'lodash';
import InfiniteScroll from 'react-infinite-scroll-component';
import { FaFilter } from 'react-icons/fa';
import { FaArrowUp } from 'react-icons/fa6';

const SearchPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [initialProducts, setInitialProducts] = useState([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [initialPage, setInitialPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        sortBy: 'newest',
        category: 'all',
    });
    const [categories, setCategories] = useState([]);
    const [showScrollToTop, setShowScrollToTop] = useState(false);

    const params = useLocation();

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
    };

    // Fetch initial products with filters
    const fetchInitialProducts = useCallback(async () => {
        try {
            if (initialPage === 1) {
                setLoadingInitial(true);
            }

            const requestData = {
                page: initialPage,
                limit: 12,
                ...(filters.minPrice && {
                    minPrice: parseInt(filters.minPrice),
                }),
                ...(filters.maxPrice && {
                    maxPrice: parseInt(filters.maxPrice),
                }),
                sort: filters.sortBy,
                category:
                    filters.category !== 'all' ? filters.category : undefined,
            };

            console.log('Fetching initial products with data:', requestData);

            const response = await Axios({
                ...SummaryApi.get_initial_products,
                data: requestData,
            });

            console.log('Initial products response:', response.data);

            if (response.data.success) {
                setInitialProducts((prev) =>
                    initialPage === 1
                        ? response.data.data
                        : [...prev, ...response.data.data]
                );
                setHasMore(response.data.data.length === 12);
                console.log(
                    'Initial products updated:',
                    initialPage === 1
                        ? response.data.data
                        : 'appended to existing'
                );
            } else {
                console.error(
                    'Failed to fetch initial products:',
                    response.data.message
                );
            }
        } catch (error) {
            console.error('Error in fetchInitialProducts:', error);
        } finally {
            setLoadingInitial(false);
        }
    }, [initialPage, filters]);

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

    // Update search function to include filters
    const searchProduct = useCallback(
        debounce(async (query, pageNum = 1) => {
            try {
                setLoading(true);
                const requestData = {
                    page: pageNum,
                    limit: 12,
                    search: query,
                    ...(filters.minPrice && {
                        minPrice: parseInt(filters.minPrice),
                    }),
                    ...(filters.maxPrice && {
                        maxPrice: parseInt(filters.maxPrice),
                    }),
                    sort: filters.sortBy,
                    ...(filters.category &&
                        filters.category !== 'all' && {
                            category: filters.category,
                        }),
                };

                const response = await Axios({
                    ...SummaryApi.search_product,
                    data: requestData,
                });

                if (response.data.success) {
                    setData(response.data.data || []);
                    setTotalPage(response.data.totalNoPage || 1);
                    setTotalCount(response.data.totalCount || 0);
                    setHasMore(pageNum < (response.data.totalNoPage || 1));
                }
            } catch (error) {
                console.error('Error searching products:', error);
            } finally {
                setLoading(false);
            }
        }, 300),
        [filters]
    );

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            minPrice: '',
            maxPrice: '',
            sortBy: 'newest',
            category: 'all',
        });
        setSearchQuery('');
        setPage(1);
        setInitialPage(1);
        setInitialProducts([]);
    };

    // Reset to first page when filters change
    useEffect(() => {
        if (searchQuery) {
            setPage(1);
            searchProduct(searchQuery, 1);
        } else {
            setInitialPage(1);
            setInitialProducts([]);
        }
    }, [filters]);

    // Fetch initial products when component mounts or when initialPage/filters change
    useEffect(() => {
        const fetchData = async () => {
            if (!searchQuery) {
                await fetchInitialProducts();
            }
        };
        fetchData();
    }, [initialPage, filters, searchQuery, fetchInitialProducts]);

    // Fetch categories
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Load more initial products
    const loadMoreInitialProducts = () => {
        if (hasMore && !loadingInitial) {
            setInitialPage((prev) => prev + 1);
        }
    };

    // Load more results
    const loadMore = () => {
        if (page < totalPage && !loading && searchQuery) {
            const nextPage = page + 1;
            setPage(nextPage);
            searchProduct(searchQuery, nextPage);
        }
    };

    // Handle scroll to load more
    const handleScroll = useCallback(() => {
        if (
            window.innerHeight + document.documentElement.scrollTop + 1 >=
                document.documentElement.scrollHeight - 100 &&
            !loading &&
            page < totalPage &&
            searchQuery
        ) {
            loadMore();
        }
    }, [loading, page, totalPage, searchQuery]);

    // Add scroll event listener
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Add filter UI component
    const renderFilterControls = () => (
        <div className="mb-6 bg-white sm:p-4 p-2 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Bộ lọc</h2>
                <button
                    onClick={resetFilters}
                    className="px-3 py-1 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                >
                    Đặt lại bộ lọc
                </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-6 text-secondary-200">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold">Giá từ</label>
                    <input
                        type="text"
                        name="minPrice"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        placeholder="Thấp nhất"
                        className="w-24 p-2 border rounded text-[14px]"
                    />
                    <span>-</span>
                    <input
                        type="text"
                        name="maxPrice"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        placeholder="Cao nhất"
                        className="w-24 p-2 border rounded text-[14px]"
                    />
                    <span className="text-[14px]">VNĐ</span>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold">Sắp xếp</label>
                    <select
                        name="sortBy"
                        value={filters.sortBy}
                        onChange={handleFilterChange}
                        className="p-2 border rounded text-[14px]"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                        <option value="name_asc">Tên A-Z</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold">Danh mục</label>
                    <select
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        className="p-2 border rounded text-[14px]"
                    >
                        <option value="all">Tất cả</option>
                        {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );

    // Extract search query from URL
    useEffect(() => {
        const query = new URLSearchParams(params.search).get('q') || '';
        setSearchQuery(query);
        if (query) {
            setPage(1);
            searchProduct(query, 1);
        } else {
            setData([]);
            setLoading(false);
        }
    }, [params.search]);

    // Cuộn lên đầu trang
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollToTop(window.pageYOffset > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Filter Controls */}
            <div className="mb-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-200 text-white hover:opacity-80 rounded-lg
                text-sm font-medium mb-2 shadow-lg"
                >
                    <FaFilter /> Bộ lọc
                </button>
                {showFilters && renderFilterControls()}
            </div>

            <div
                className={`w-full mx-auto mb-3 ${
                    !loading && searchQuery && data.length > 0
                        ? 'block'
                        : 'hidden'
                }`}
            >
                {!loading && searchQuery && data.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                        Tìm thấy{' '}
                        <span className="font-semibold text-secondary-200">
                            {totalCount}
                        </span>{' '}
                        kết quả cho "{searchQuery}"
                    </p>
                )}
            </div>

            {/* Search Results */}
            {searchQuery ? (
                loading && page === 1 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array(6)
                            .fill(null)
                            .map((_, index) => (
                                <CardLoading key={index} />
                            ))}
                    </div>
                ) : data.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {data.map((product) => (
                                <CardProduct key={product._id} data={product} />
                            ))}
                        </div>
                        {loading && page > 1 && (
                            <div className="flex justify-center mt-8">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600"></div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-4 grid gap-2">
                        <h3 className="text-xl font-semibold text-gray-700">
                            Không tìm thấy sản phẩm
                        </h3>
                        <p className="text-gray-500">
                            Không có sản phẩm nào phù hợp với từ khóa "
                            {searchQuery}"
                        </p>
                    </div>
                )
            ) : (
                /* Initial products display */
                <InfiniteScroll
                    dataLength={initialProducts.length}
                    next={loadMoreInitialProducts}
                    hasMore={hasMore}
                >
                    <div className="bg-white rounded-md pb-2">
                        <h2
                            className="px-4 py-2 bg-primary-4 rounded-md shadow-md shadow-secondary-100
                        font-bold text-secondary-200 sm:text-lg text-sm"
                        >
                            Sản phẩm nổi bật
                        </h2>
                        <div className="text-center pt-6 pb-4 grid gap-2">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-500">
                                Nhập từ khóa để tìm kiếm
                            </h3>
                            <p className="text-sm sm:text-base text-gray-500">
                                Tìm kiếm sản phẩm theo tên
                            </p>
                        </div>
                        {loadingInitial ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-2 px-4">
                                {Array(6)
                                    .fill(null)
                                    .map((_, index) => (
                                        <CardLoading key={index} />
                                    ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-2 px-4">
                                {initialProducts.map((product) => (
                                    <CardProduct
                                        key={product._id}
                                        data={product}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </InfiniteScroll>
            )}

            {showScrollToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-32 sm:bottom-28 right-4 sm:right-8 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                                focus:ring-rose-500 bg-secondary-200 rounded-full p-3 sm:p-4 md:p-4 hover:bg-secondary-100 text-white z-50"
                    aria-label="Lên đầu trang"
                >
                    <FaArrowUp size={24} className="hidden sm:block" />
                    <FaArrowUp className="block sm:hidden" />
                </button>
            )}
        </div>
    );
};

export default SearchPage;
