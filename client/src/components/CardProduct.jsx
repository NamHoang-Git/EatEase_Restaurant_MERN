import React from 'react';
import { pricewithDiscount } from '../utils/PriceWithDiscount';
import AddToCartButton from './AddToCartButton';
import { valideURLConvert } from './../utils/valideURLConvert';
import { Link } from 'react-router-dom';
import { DisplayPriceInVND } from './../utils/DisplayPriceInVND';
import { MdAccessTime } from 'react-icons/md';

const CardProduct = ({ data }) => {
    const url = `/product/${valideURLConvert(data.name)}-${data._id}`;

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Link
            to={url}
            onClick={scrollToTop}
            title={data.name}
            className="group bg-white rounded-xl shadow-md shadow-secondary-100
        hover:shadow-lg transition-all duration-300 overflow-hidden"
        >
            {/* Image */}
            <div className="relative w-full h-32 sm:h-48 overflow-hidden">
                <img
                    src={data.image[0]}
                    alt={data.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badge thời gian (nếu có) */}
                <div
                    className="absolute top-2 right-2 bg-green-100 text-green-700 px-2 py-1 rounded-md
                flex items-center gap-1"
                >
                    <MdAccessTime size={13} className="mb-[2px]" />
                    <p className="text-xs font-medium leading-[14px]">10 min</p>
                </div>
            </div>

            {/* Info */}
            <div className="px-2 pt-2 pb-2 md:px-3 md:pt-4 md:pb-5 flex flex-col gap-2 lg:gap-2">
                {/* Tên sản phẩm */}
                <h2 className="font-semibold line-clamp-2 text-xs sm:text-base h-7 sm:h-11 md:h-10 lg:h-12">
                    {data.name}
                </h2>

                {/* Đơn vị + discount */}
                <div className="flex gap-2 items-center sm:h-[12px] h-[10px] mt-1 md:mt-2">
                    <div className="whitespace-nowrap font-semibold text-[10px] sm:text-sm line-clamp-1">
                        {data.unit}
                    </div>
                    {/* Badge discount */}
                    {Boolean(data.discount) && (
                        <span
                            className="w-fit bg-primary border-2 border-secondary-200 text-secondary-200 text-[10px] sm:text-xs font-semibold
                        px-2 sm:py-[0.8px] py-0 rounded-full shadow"
                        >
                            -{data.discount}%
                        </span>
                    )}
                </div>

                {/* Giá + Button */}
                <div className="flex md:flex-row flex-col md:items-center justify-between md:h-6 mt-1 md:mt-4 gap-2">
                    <div className="flex md:flex-col md:gap-0 gap-2 md:h-10 md:justify-center justify-start md:items-start items-baseline">
                        {Boolean(data.discount) && (
                            <span className="text-gray-400 line-through text-[10px] sm:text-[15px]">
                                {DisplayPriceInVND(data.price)}
                            </span>
                        )}
                        <span className="text-secondary-200 font-bold text-[10px] sm:text-[15px] lg:text-base">
                            {DisplayPriceInVND(
                                pricewithDiscount(data.price, data.discount)
                            )}
                        </span>
                    </div>

                    <div className="">
                        {data.stock === 0 ? (
                            <p className="text-secondary-200 text-sm sm:text-base font-bold md:font-semibold md:text-center">
                                Hết hàng
                            </p>
                        ) : (
                            <AddToCartButton data={data} />
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default CardProduct;
