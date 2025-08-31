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
import CardLoading from '../components/CardLoading';

const ProductListPage = () => {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const [loading, setLoading] = useState(false);

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
        <section className="min-h-screen py-4">
            <div className="container w-full mx-auto px-2 sm:px-4">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Mobile Toggle Button */}
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="lg:hidden flex items-center justify-between w-full p-3 bg-white rounded-lg shadow-lg
                        text-secondary-200 font-bold text-lg"
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
                        <div className="bg-white rounded-lg shadow-lg lg:sticky lg:top-24">
                            <h3 className="font-bold text-lg text-secondary-200 hidden lg:block shadow-lg p-3 rounded-lg">
                                Danh mục
                            </h3>
                            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto p-4">
                                {displayCategory.map((s) => {
                                    const link = `/${valideURLConvert(
                                        s.name
                                    )}-${s._id}`;
                                    return (
                                        <Link
                                            key={s._id}
                                            to={link}
                                            className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${
                                                categoryId === s._id
                                                    ? 'bg-rose-200 text-secondary-200'
                                                    : 'hover:bg-rose-100 text-gray-700'
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
                                                className="w-8 h-8 lg:w-10 lg:h-10 object-cover rounded-md border border-inset border-secondary-200"
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
                    <div className="w-full bg-white shadow-lg rounded-lg">
                        <div
                            className="px-4 py-6 sm:py-4 bg-primary-4 rounded-md shadow-md shadow-secondary-100
                        font-bold text-secondary-200 sm:text-lg text-sm"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <h1 className="text-ellipsis uppercase flex gap-2 items-baseline">
                                    {categoryName || 'Tất cả sản phẩm'}
                                    <span className="text-[12px] sm:text-base text-secondary-100">
                                        ({totalCount} sản phẩm)
                                    </span>
                                </h1>

                                {/* Filter */}
                                <div className="flex flex-col sm:flex-row sm:gap-2 gap-3 w-full sm:w-auto text-sm">
                                    <button
                                        onClick={() =>
                                            setShowFilters(!showFilters)
                                        }
                                        className="h-full sm:h-[38px] w-full mx-auto sm:mr-0 min-w-16 lg:min-w-24 bg-white px-4 py-2
                                    flex items-center sm:justify-center gap-2 rounded-xl shadow-md shadow-secondary-100 focus-within:border-secondary-200"
                                    >
                                        <FaFilter
                                            size={12}
                                            className="mb-[2px]"
                                        />
                                        <span>Bộ lọc</span>
                                    </button>

                                    <div
                                        className="relative h-full sm:h-[38px] w-full mx-auto sm:mr-0 min-w-16 lg:min-w-24 bg-white px-4
                                    flex items-center gap-2 rounded-xl shadow-md shadow-secondary-100 focus-within:border-secondary-200"
                                    >
                                        <select
                                            value={sortBy}
                                            onChange={handleSortChange}
                                            className="w-full py-2 bg-white focus:outline-none focus:border-transparent cursor-pointer appearance-none"
                                        >
                                            <option value="newest">
                                                Mới nhất
                                            </option>
                                            <option value="price_asc">
                                                Giá gốc tăng dần
                                            </option>
                                            <option value="price_desc">
                                                Giá gốc giảm dần
                                            </option>
                                            <option value="popular">
                                                Phổ biến
                                            </option>
                                        </select>
                                        <FaSort className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {showFilters && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-md shadow-secondary-100">
                                    <div className="flex justify-between text-base items-center mb-3 font-bold text-secondary-200">
                                        <h4 className="">
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
                                            className="hover:text-secondary-100 text-base underline"
                                        >
                                            Đặt lại bộ lọc
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-secondary-200 font-medium">
                                        <div>
                                            <label className="block text-[15px] font-medium mb-1">
                                                Giá thấp nhất
                                            </label>
                                            <input
                                                type="number"
                                                name="min"
                                                value={priceRange.min}
                                                onChange={handlePriceChange}
                                                placeholder="Từ"
                                                className="w-full p-2 border text-sm border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[15px] font-medium mb-1">
                                                Giá cao nhất
                                            </label>
                                            <input
                                                type="number"
                                                name="max"
                                                value={priceRange.max}
                                                onChange={handlePriceChange}
                                                placeholder="Đến"
                                                className="w-full p-2 border text-sm border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
                                {Array(9)
                                    .fill(null)
                                    .map((_, index) => (
                                        <div
                                            key={index}
                                            className="group bg-white rounded-xl shadow-md
                                    hover:shadow-lg transition-all duration-300 overflow-hidden"
                                        >
                                            <CardLoading />
                                        </div>
                                    ))}
                            </div>
                        ) : data.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-lg p-8 text-center font-semibold">
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
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    Không tìm thấy sản phẩm
                                </h3>
                                <p className="text-gray-500">
                                    Không có sản phẩm nào phù hợp với bộ lọc
                                    hiện tại.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 p-4">
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
                    className="fixed bottom-32 sm:bottom-28 right-4 sm:right-8 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                    focus:ring-rose-500 bg-secondary-200 rounded-full p-3 sm:p-4 md:p-4 hover:bg-secondary-100 text-white z-50"
                    aria-label="Lên đầu trang"
                >
                    <FaArrowUp size={24} className="hidden sm:block" />
                    <FaArrowUp className="block sm:hidden" />
                </button>
            )}
        </section>
    );
};

export default React.memo(ProductListPage);
