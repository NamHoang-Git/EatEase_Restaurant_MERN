import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Axios from './../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from './../utils/AxiosToastError';
import CardProduct from './../components/CardProduct';
import CardLoading from './../components/CardLoading';
import { debounce } from 'lodash';

const SearchPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const params = useLocation();
    const navigate = useNavigate();

    // Extract search query from URL
    useEffect(() => {
        const query = new URLSearchParams(params.search).get('q') || '';
        setSearchQuery(query);
        if (query) {
            setPage(1);
            fetchData(query, 1);
        } else {
            setData([]);
            setLoading(false);
        }
    }, [params.search]);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((query, pageNum) => {
            fetchData(query, pageNum);
        }, 500),
        []
    );

    // Handle search input change
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        setIsTyping(true);

        // Update URL without page reload
        const searchParams = new URLSearchParams();
        if (query) {
            searchParams.set('q', query);
            navigate(`/search?${searchParams.toString()}`, { replace: true });
        } else {
            navigate('/search', { replace: true });
        }

        // Reset to first page when search changes
        setPage(1);

        // Only search if query is not empty
        if (query.trim()) {
            debouncedSearch(query, 1);
        } else {
            setData([]);
            setLoading(false);
        }
    };

    // Fetch data function
    const fetchData = async (query, pageNum) => {
        if (!query.trim()) {
            setData([]);
            setLoading(false);
            setIsTyping(false);
            return;
        }

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.search_product,
                data: {
                    search: query,
                    page: pageNum,
                    limit: 12, // Adjust limit as needed
                },
            });

            const { data: responseData } = response;

            if (responseData.success) {
                if (pageNum === 1) {
                    setData(responseData.data);
                    setTotalCount(responseData.totalCount || 0);
                } else {
                    setData((prevData) => [...prevData, ...responseData.data]);
                }
                setTotalPage(responseData.totalPage || 1);
            }
        } catch (error) {
            console.error('Search error:', error);
            AxiosToastError(error);
        } finally {
            setLoading(false);
            setIsTyping(false);
        }
    };

    // Load more results
    const loadMore = () => {
        if (page < totalPage && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchData(searchQuery, nextPage);
        }
    };

    // Handle scroll to load more
    const handleScroll = useCallback(() => {
        if (
            window.innerHeight + document.documentElement.scrollTop + 1 >=
                document.documentElement.scrollHeight - 100 &&
            !loading &&
            page < totalPage
        ) {
            loadMore();
        }
    }, [loading, page, totalPage]);

    // Add scroll event listener
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="w-full mx-auto mb-3">
                {/* Display search result count */}
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

            {loading && page === 1 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array(10)
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
            ) : searchQuery ? (
                <div className="text-center py-4 grid gap-2">
                    <h3 className="text-xl font-semibold text-gray-700">
                        Không tìm thấy sản phẩm
                    </h3>
                    <p className="text-gray-500">
                        Không có sản phẩm nào phù hợp với từ khóa "{searchQuery}
                        "
                    </p>
                </div>
            ) : (
                <div className="text-center py-4 grid gap-2">
                    <h3 className="text-xl font-semibold text-gray-700">
                        Nhập từ khóa để tìm kiếm
                    </h3>
                    <p className="text-gray-500">
                        Tìm kiếm sản phẩm theo tên, mô tả hoặc thương hiệu
                    </p>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
