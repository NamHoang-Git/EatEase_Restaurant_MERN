import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGlobalContext } from '../provider/GlobalProvider';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';
import { FaMinus, FaPlus } from 'react-icons/fa6';
import Loading from './Loading';
import { useNavigate } from 'react-router-dom';

const AddToCartButton = ({ data }) => {
    const { fetchCartItem, updateCartItem, deleteCartItem } =
        useGlobalContext();
    const [loading, setLoading] = useState(false);
    const cartItem = useSelector((state) => state.cartItem.cart);
    const [isAvailableCart, setIsAvailableCart] = useState(false);
    const [qty, setQty] = useState(0);
    const [cartItemDetails, setCartItemsDetails] = useState(null);
    const user = useSelector((state) => state.user);
    const navigate = useNavigate();

    const handleADDTocart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user || !user._id) {
            navigate('/login');
            return;
        }

        // Kiểm tra số lượng tồn kho
        if (data?.stock <= 0) {
            toast.error('Sản phẩm đã hết hàng');
            return;
        }

        try {
            setLoading(true);

            const response = await Axios({
                ...SummaryApi.add_to_cart,
                data: {
                    productId: data?._id,
                },
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                if (fetchCartItem) {
                    await fetchCartItem();
                }
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    // Kiểm tra sản phẩm trong giỏ hàng
    useEffect(() => {
        if (!data?._id) {
            setIsAvailableCart(false);
            setQty(0);
            setCartItemsDetails(null);
            return;
        }

        const validCartItems = cartItem?.filter((item) => item?.productId?._id);
        const checkingItem = validCartItems?.some(
            (item) => item.productId?._id === data._id
        );
        setIsAvailableCart(!!checkingItem);

        const product = validCartItems?.find(
            (item) => item.productId?._id === data._id
        );
        setCartItemsDetails(product || null);
        setQty(product?.quantity || 0);
    }, [data, cartItem]);

    const increaseQty = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!cartItemDetails?._id || qty < 0) {
            toast.error('Sản phẩm không hợp lệ');
            return;
        }

        // Kiểm tra số lượng tồn kho
        if (qty >= (data?.stock || 0)) {
            toast.error('Đã đạt số lượng tối đa trong kho');
            return;
        }

        const response = await updateCartItem(cartItemDetails._id, qty + 1);

        if (response.success) {
            if (fetchCartItem) {
                await fetchCartItem();
            }
        }
    };

    const decreaseQty = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!cartItemDetails?._id || qty <= 0) {
            toast.error('Sản phẩm không hợp lệ');
            return;
        }

        if (qty === 1) {
            await deleteCartItem(cartItemDetails._id);
            if (fetchCartItem) {
                await fetchCartItem();
            }
        } else {
            const response = await updateCartItem(cartItemDetails._id, qty - 1);

            if (response.success) {
                if (fetchCartItem) {
                    await fetchCartItem();
                }
            }
        }
    };

    return (
        <div className="w-full md:max-w-[150px]">
            {isAvailableCart && cartItemDetails ? (
                <div className="flex items-center justify-center w-full h-full bg-primary-100">
                    <button
                        onClick={decreaseQty}
                        className="bg-primary hover:opacity-80 text-white flex-1 w-full p-1 sm:p-[6px] rounded flex items-center justify-center"
                        disabled={loading}
                    >
                        <FaMinus className="sm:hidden" size={10} />
                        <FaMinus className="hidden sm:block" size={14} />
                    </button>

                    <p className="flex-1 text-xs sm:text-base text-secondary-200 font-bold w-9 flex items-center justify-center">
                        {qty}
                    </p>

                    <button
                        onClick={increaseQty}
                        className="bg-primary hover:opacity-80 text-white flex-1 w-full p-1 sm:p-[6px] rounded flex items-center justify-center"
                        disabled={loading}
                    >
                        <FaPlus className="sm:hidden" size={10} />
                        <FaPlus className="hidden sm:block" size={14} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleADDTocart}
                    className="bg-primary hover:opacity-80 text-secondary-200 shadow-md p-1 px-2 sm:px-2 sm:p-[6px]
                rounded-md sm:rounded-full"
                    disabled={loading || !data?._id || data?.stock <= 0}
                >
                    {loading ? (
                        <Loading />
                    ) : (
                        <span className="flex items-center gap-1 text-xs sm:text-sm font-semibold">
                            <FaPlus size={12} />
                            <p className="leading-[14px] mt-[2px]">
                                {data?.stock <= 0 ? 'Hết hàng' : 'Cart'}
                            </p>
                        </span>
                    )}
                </button>
            )}
        </div>
    );
};

export default AddToCartButton;
