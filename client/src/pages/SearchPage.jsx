import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Axios from './../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from './../utils/AxiosToastError';
import CardProduct from './../components/CardProduct';
import CardLoading from './../components/CardLoading';
import InfiniteScroll from 'react-infinite-scroll-component';
import NoData from '../components/NoData';

const SearchPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadingArrayCard = new Array(15).fill(null);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const params = useLocation();
    const searchText = params?.search?.slice(3);

    const fetchData = async () => {
        // API search sản phẩm là public, không cần authentication
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.search_product,
                data: {
                    search: searchText,
                    page: page,
                },
            });

            const { data: responseData } = response;

            if (responseData.success) {
                if (responseData.page == 1) {
                    setData(responseData.data);
                } else {
                    setData((preve) => {
                        return [...preve, ...responseData.data];
                    });
                }
                setTotalPage(responseData.totalPage);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let flag = true;
        const interval = setTimeout(() => {
            if (flag) {
                fetchData();
                flag = false;
            }
        }, 400);
        return () => {
            clearTimeout(interval);
        };
    }, [page, searchText]);

    const handleFetchMore = () => {
        if (totalPage > page) {
            setPage((preve) => preve + 1);
        }
    };

    return (
        <section className="bg-primary-100 mt-2">
            <div className="container mx-auto px-2 py-3 sm:p-4 min-h-[80vh]">
                <p className="font-bold text-secondary-200 sm:text-base text-sm">
                    Kết quả tìm kiếm: {data.length}
                </p>

                <InfiniteScroll
                    dataLength={data.length}
                    hasMore={true}
                    next={handleFetchMore}
                >
                    <div
                        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
                    p-2 sm:p-4 gap-3 sm:gap-6"
                    >
                        {data.map((p, index) => {
                            return (
                                <CardProduct
                                    data={p}
                                    key={p?._id + 'searchProduct' + index}
                                />
                            );
                        })}

                        {/* Loading Data */}
                        {loading &&
                            loadingArrayCard.map((_, index) => {
                                return (
                                    <CardLoading
                                        key={'loadingsearchpage' + index}
                                    />
                                );
                            })}
                    </div>
                </InfiniteScroll>

                {!data[0] && !loading && <NoData />}
            </div>
        </section>
    );
};

export default SearchPage;
