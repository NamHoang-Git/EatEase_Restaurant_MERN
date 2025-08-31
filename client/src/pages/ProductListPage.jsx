import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { valideURLConvert } from '../utils/valideURLConvert';
import Loading from '../components/Loading';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { FaArrowUp, FaFilter, FaSort, FaChevronDown } from 'react-icons/fa';
import CardProduct from '../components/CardProduct';
import debounce from 'lodash.debounce'; // Thêm lodash.debounce

const ProductListPage = () => {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);

    const observer = useRef();
    const params = useParams();
    const AllCategory = useSelector((state) => state.product.allCategory);
    const [displayCategory, setDisplayCategory] = useState([]);

    const category = params?.category?.split('-');
    const categoryId = category?.slice(-1)[0];
    const categoryInfo = AllCategory.find((cat) => cat._id === categoryId);
    const categoryName = categoryInfo ? categoryInfo.name : '';
    const [showSidebar, setShowSidebar] = useState(false);

    const lastProductRef = useCallback(
        (node) => {
            if (loading || loadingMore) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prevPage) => prevPage + 1);
                }
            });
            if (node) observer.current.observe(node);
        },
        [loading, loadingMore, hasMore]
    );

    // Handle price range input changes
    const handlePriceChange = (e) => {
        const { name, value } = e.target;

        // Only allow numbers or empty string
        if (value === '' || /^\d*$/.test(value)) {
            setPriceRange((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // Handle price range validation before fetching
    const validatePriceRange = useCallback(() => {
        const min = priceRange.min ? parseInt(priceRange.min, 10) : null;
        const max = priceRange.max ? parseInt(priceRange.max, 10) : null;

        if (min !== null && max !== null && min > max) {
            return false;
        }
        return true;
    }, [priceRange.min, priceRange.max]);

    // Hàm fetchProduct với kiểm tra giá
    const fetchProduct = useCallback(
        async (isInitialLoad = false) => {
            if (isInitialLoad) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            try {
                const requestData = {
                    categoryId,
                    page: isInitialLoad ? 1 : page,
                    limit: 12,
                    sort: sortBy,
                };

                // Only add price filters if they have valid values
                const minPrice = priceRange.min?.trim();
                const maxPrice = priceRange.max?.trim();

                if (minPrice) {
                    requestData.minPrice = parseInt(minPrice, 10);
                }
                if (maxPrice) {
                    requestData.maxPrice = parseInt(maxPrice, 10);
                }

                const response = await Axios({
                    ...SummaryApi.get_product_by_category_list,
                    data: requestData,
                });

                const { data: responseData } = response;

                if (responseData?.success) {
                    setData((prev) =>
                        isInitialLoad
                            ? [...(responseData.data || [])]
                            : [...prev, ...(responseData.data || [])]
                    );
                    setTotalCount(responseData.totalCount || 0);
                    setHasMore((responseData.data?.length || 0) === 12);
                } else {
                    // Only show error toast if there's a meaningful message
                    const errorMessage = responseData?.message?.trim();
                    if (errorMessage && errorMessage.length > 0) {
                        AxiosToastError({ message: errorMessage });
                    }
                }
            } catch (error) {
                console.error('Lỗi khi tải sản phẩm:', error);
                // Only show error toast if there's a meaningful message
                const errorMessage =
                    error.response?.data?.message?.trim() ||
                    error.message?.trim();

                if (errorMessage && errorMessage.length > 0) {
                    AxiosToastError({
                        message: errorMessage || 'Đã xảy ra lỗi không xác định',
                    });
                } else {
                    console.warn('API error but no meaningful message');
                }
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [categoryId, page, sortBy, priceRange.min, priceRange.max]
    );

    // Update the filter effect to validate before fetching
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only validate if both fields have values
            if (priceRange.min && priceRange.max) {
                if (!validatePriceRange()) {
                    AxiosToastError({
                        message: 'Giá tối thiểu không được lớn hơn giá tối đa',
                    });
                    return;
                }
            }

            // Reset to first page when filters change
            setPage(1);
            // Clear existing data
            setData([]);
            setHasMore(true);
            // Fetch new data with updated filters
            fetchProduct(true);
        }, 1000);

        return () => clearTimeout(timer);
    }, [
        priceRange.min,
        priceRange.max,
        sortBy,
        categoryId,
        validatePriceRange,
        fetchProduct,
    ]);

    // Load thêm sản phẩm khi page thay đổi
    useEffect(() => {
        if (page > 1) {
            fetchProduct();
        }
    }, [page, fetchProduct]);

    // Xử lý cuộn để hiển thị nút "Lên đầu trang"
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollToTop(window.pageYOffset > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Cập nhật danh mục hiển thị
    useEffect(() => {
        setDisplayCategory(AllCategory);
    }, [AllCategory]);

    // Xử lý thay đổi sắp xếp
    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    // Xử lý lỗi hình ảnh
    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = '/placeholder-category.jpg';
    };

    // Cuộn lên đầu trang
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section className="bg-gray-50 min-h-screen pt-4">
            <div className="container mx-auto px-2 sm:px-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Mobile Toggle Button */}
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="lg:hidden flex items-center justify-between w-full p-3 bg-white rounded-lg shadow-sm mb-2"
                    >
                        <span className="font-medium">Danh mục sản phẩm</span>
                        <FaChevronDown
                            className={`transition-transform ${
                                showSidebar ? 'transform rotate-180' : ''
                            }`}
                        />
                    </button>

                    {/* Category Sidebar */}
                    <div
                        className={`${
                            showSidebar ? 'block' : 'hidden'
                        } lg:block w-full lg:w-72 flex-shrink-0`}
                    >
                        <div className="bg-white rounded-lg shadow-sm p-4 lg:sticky lg:top-24">
                            <h3 className="font-semibold text-lg mb-4 text-gray-800 hidden lg:block">
                                Danh mục
                            </h3>
                            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                                {displayCategory.map((s) => {
                                    const link = `/${valideURLConvert(
                                        s.name
                                    )}-${s._id}`;
                                    return (
                                        <Link
                                            key={s._id}
                                            to={link}
                                            className={`flex items-center p-2 rounded-lg transition-colors ${
                                                categoryId === s._id
                                                    ? 'bg-rose-100 text-rose-700'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                            onClick={() =>
                                                setShowSidebar(false)
                                            }
                                        >
                                            <img
                                                src={
                                                    s.image ||
                                                    '/placeholder-category.jpg'
                                                }
                                                alt={s.name}
                                                onError={handleImageError}
                                                className="w-8 h-8 lg:w-10 lg:h-10 object-cover rounded-full mr-2 lg:mr-3"
                                            />
                                            <span className="text-sm font-medium">
                                                {s.name}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Product List */}
                    <div className="w-full">
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                    {categoryName || 'Tất cả sản phẩm'}
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        ({totalCount} sản phẩm)
                                    </span>
                                </h1>

                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() =>
                                            setShowFilters(!showFilters)
                                        }
                                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full sm:w-auto"
                                    >
                                        <FaFilter />
                                        <span>Bộ lọc</span>
                                    </button>

                                    <div className="relative w-full sm:w-48">
                                        <select
                                            value={sortBy}
                                            onChange={handleSortChange}
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                        >
                                            <option value="newest">
                                                Mới nhất
                                            </option>
                                            <option value="price_asc">
                                                Giá tăng dần
                                            </option>
                                            <option value="price_desc">
                                                Giá giảm dần
                                            </option>
                                            <option value="popular">
                                                Phổ biến
                                            </option>
                                        </select>
                                        <FaSort className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {showFilters && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium text-gray-700">
                                            {isFiltering
                                                ? 'Đang lọc...'
                                                : 'Lọc theo giá'}
                                        </h4>
                                        <button
                                            onClick={() => {
                                                setPriceRange({
                                                    min: '',
                                                    max: '',
                                                });
                                                setSortBy('newest');
                                            }}
                                            className="text-sm text-rose-600 hover:text-rose-800 font-medium"
                                        >
                                            Đặt lại bộ lọc
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Giá thấp nhất
                                            </label>
                                            <input
                                                type="number"
                                                name="min"
                                                value={priceRange.min}
                                                onChange={handlePriceChange}
                                                placeholder="Từ"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Giá cao nhất
                                            </label>
                                            <input
                                                type="number"
                                                name="max"
                                                value={priceRange.max}
                                                onChange={handlePriceChange}
                                                placeholder="Đến"
                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[...Array(10)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse"
                                    >
                                        <div className="aspect-square bg-gray-200"></div>
                                        <div className="p-3">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : data.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg
                                        className="w-16 h-16 mx-auto"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                    Không tìm thấy sản phẩm
                                </h3>
                                <p className="text-gray-500">
                                    Không có sản phẩm nào phù hợp với bộ lọc
                                    hiện tại.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                {data.map((product, index) => (
                                    <div
                                        key={product._id}
                                        ref={
                                            index === data.length - 1
                                                ? lastProductRef
                                                : null
                                        }
                                        className="group bg-white rounded-xl shadow-md shadow-secondary-100
                                    hover:shadow-lg transition-all duration-300 overflow-hidden"
                                    >
                                        <CardProduct data={product} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {loadingMore && (
                            <div className="flex justify-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showScrollToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-ange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                    aria-label="Lên đầu trang"
                >
                    <FaArrowUp />
                </button>
            )}
        </section>
    );
};

export default React.memo(ProductListPage);
