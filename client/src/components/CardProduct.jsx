import React from 'react';
import { pricewithDiscount } from '../utils/PriceWithDiscount';
import AddToCartButton from './AddToCartButton';
import { valideURLConvert } from './../utils/valideURLConvert';
import { Link } from 'react-router-dom';
import { DisplayPriceInVND } from './../utils/DisplayPriceInVND';
import { MdAccessTime } from 'react-icons/md';

const CardProduct = ({ data }) => {
    const url = `/product/${valideURLConvert(data.name)}-${data._id}`;

    return (
        <Link
            to={url}
            className="group bg-white rounded-xl shadow-md shadow-secondary-100
        hover:shadow-lg transition-all duration-300 overflow-hidden"
        >
            {/* Image */}
            <div className="relative w-full h-52 overflow-hidden">
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
                    <MdAccessTime size={13} />
                    <p className="text-xs font-medium leading-[14px]">10 min</p>
                </div>
            </div>

            {/* Info */}
            <div className="px-2 py-3 sm:p-4 flex flex-col gap-4 lg:gap-2">
                {/* Tên sản phẩm */}
                <h2 className="font-semibold line-clamp-2 text-sm sm:text-base h-9 sm:h-11 md:h-10 lg:h-12">
                    {data.name}
                </h2>

                {/* Đơn vị + discount */}
                <div className="flex gap-4 items-center h-[10px] sm:h-[14px]">
                    <div className="whitespace-nowrap text-sm line-clamp-1">
                        {data.unit}
                    </div>
                    {/* Badge discount */}
                    {Boolean(data.discount) && (
                        <span
                            className="w-fit bg-primary border-2 border-secondary-200 text-secondary-200 text-xs font-semibold
                        px-2 py-[0.8px] rounded-full shadow"
                        >
                            -{data.discount}%
                        </span>
                    )}
                </div>

                {/* Giá + Button */}
                <div className="flex items-center justify-between h-6 mt-2 lg:mt-4 gap-3 sm:gap-2">
                    <div className="flex flex-col">
                        {Boolean(data.discount) && (
                            <span className="text-gray-400 line-through text-xs sm:text-sm">
                                {DisplayPriceInVND(data.price)}
                            </span>
                        )}
                        <span className="text-secondary-200 font-bold text-sm sm:text-md lg:text-base">
                            {DisplayPriceInVND(
                                pricewithDiscount(data.price, data.discount)
                            )}
                        </span>
                    </div>

                    <div className=''>
                        {data.stock === 0 ? (
                            <p className="text-secondary-200 text-xs sm:text-base font-bold sm:font-semibold text-center">
                                Out of stock
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
