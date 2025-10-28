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
import { ProductCard } from './product/product-card';
import GradientText from './GradientText';

const CategoryWiseProductDisplay = ({ id, name }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef();

    const loadingCardNumber = new Array(6).fill(null);

    const fetchCategoryWiseProduct = async () => {
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
        <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
                <GradientText
                    colors={[
                        '#84CC16',
                        '#A3E635',
                        '#D9F99D',
                        '#A7F3D0',
                        '#BBF7D0',
                        '#D4F6C7',
                        '#B9F1B7',
                        '#C4E023',
                        '#A1E91D',
                        '#A9F97F',
                    ]}
                    animationSpeed={5.5}
                    showBorder={false}
                    className="custom-class text-2xl font-bold"
                >
                    {name}
                </GradientText>
                {/* <h2 className="text-2xl font-bold text-emerald-400">{name}</h2> */}
                <Link
                    to={redirectURL}
                    onClick={scrollToTop}
                    className="hover:bg-zinc-800 hover:border-emerald-500
                    transition-all duration-300 text-white border-2 border-zinc-300 px-4 py-2 rounded-md"
                >
                    Xem tất cả
                </Link>
            </div>

            <div className="relative">
                <div
                    ref={containerRef}
                    className="grid grid-flow-col auto-cols-[minmax(220px,1fr)] lg:auto-cols-[minmax(240px,1fr)] xl:auto-cols-[minmax(260px,1fr)]
                gap-4 md:gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-6"
                >
                    {loading
                        ? loadingCardNumber.map((_, index) => (
                              <CardLoading key={`loading-${index}`} />
                          ))
                        : data.map((product) => (
                              <ProductCard key={product._id} data={product} />
                          ))}
                </div>

                {/* Left Arrow */}
                {data.length > 0 && !loading && (
                    <div className="absolute hidden md:block left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10">
                        <button
                            onClick={handleScrollLeft}
                            className="bg-white/20 text-white backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
                            aria-label="Previous products"
                        >
                            <FaAngleLeft size={20} />
                        </button>
                    </div>
                )}

                {/* Right Arrow */}
                {data.length > 0 && !loading && (
                    <div className="absolute hidden md:block right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10">
                        <button
                            onClick={handleScrollRight}
                            className="bg-white/20 text-white backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
                            aria-label="Next products"
                        >
                            <FaAngleRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryWiseProductDisplay;
