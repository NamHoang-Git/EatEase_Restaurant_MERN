import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa6';
import { FaCaretRight } from 'react-icons/fa';
import { valideURLConvert } from '../utils/valideURLConvert';
import Axios from './../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from './../utils/AxiosToastError';
import CardProduct from './CardProduct';
import CardLoading from './CardLoading';

const CategoryWiseProductDisplay = ({ id, name }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef();

    const loadingCardNumber = new Array(6).fill(null);

    const fetchCategoryWiseProduct = async () => {
        // API lấy sản phẩm theo category là public, không cần authentication
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_product_by_category_home,
                data: {
                    id: id,
                },
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
        fetchCategoryWiseProduct();
    }, []);

    const handleScrollLeft = () => {
        containerRef.current.scrollLeft -= 500;
    };

    const handleScrollRight = () => {
        containerRef.current.scrollLeft += 500;
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const redirectURL = `/${valideURLConvert(name)}-${id}`;

    return (
        <div
            className="container mx-auto px-4 sm:px-8 sm:py-6 py-4 bg-primary-100 shadow-md shadow-secondary-100
        sm:rounded-xl rounded-[20px]"
        >
            <div className="container mx-auto pb-1 flex items-center justify-between gap-4 text-sm sm:text-lg">
                <h3 className="font-bold">{name}</h3>
                <Link
                    to={redirectURL}
                    onClick={scrollToTop}
                    className="flex items-center gap-1 text-secondary-200 hover:text-secondary-100 font-bold text-[10px] sm:text-base"
                >
                    Xem tất cả
                    <span>
                        <FaCaretRight size={16} />
                    </span>
                </Link>
            </div>
            <div className="container mx-auto">
                <div className="relative flex items-center">
                    <div
                        ref={containerRef}
                        className="grid grid-flow-col auto-cols-[minmax(150px,150px)] sm:auto-cols-[minmax(12rem,12rem)] md:auto-cols-[minmax(13rem,13rem)]
                    lg:auto-cols-[minmax(14rem,14rem)] gap-3 md:gap-6 lg:gap-8 container mx-auto py-2 overflow-x-auto scroll-smooth scrollbar-hide"
                    >
                        {loading &&
                            loadingCardNumber.map((_, index) => {
                                return (
                                    <CardLoading
                                        key={
                                            'CategorywiseProductDisplay123' +
                                            index
                                        }
                                    />
                                );
                            })}

                        {data.map((p, index) => {
                            return (
                                <CardProduct
                                    data={p}
                                    key={
                                        p._id +
                                        'CategorywiseProductDisplay' +
                                        index
                                    }
                                />
                            );
                        })}
                    </div>

                    {/* Arrow */}
                    <div className="ml-[-15px] left-0 absolute hidden lg:block cursor-pointer">
                        <button
                            onClick={handleScrollLeft}
                            className="z-10 bg-white hover:bg-gray-100 shadow-md shadow-primary-200 text-lg
                        p-2 rounded-full "
                        >
                            <FaAngleLeft size={16} />
                        </button>
                    </div>

                    <div className="mr-[-15px] right-0 absolute hidden lg:block cursor-pointer">
                        <button
                            onClick={handleScrollRight}
                            className="z-10 bg-white hover:bg-gray-100 shadow-md shadow-primary-200 text-lg
                        p-2 rounded-full "
                        >
                            <FaAngleRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryWiseProductDisplay;
