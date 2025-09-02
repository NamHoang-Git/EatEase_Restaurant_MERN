import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import { pricewithDiscount } from '../utils/PriceWithDiscount';
import { handleAddItemCart } from '../store/cartProduct';
import { handleAddAddress } from '../store/addressSlice';
import { setOrder } from '../store/orderSlice';

export const GlobalContext = createContext(null);

export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
    const dispatch = useDispatch();
    const [totalPrice, setTotalPrice] = useState(0);
    const [notDiscountTotalPrice, setNotDiscountTotalPrice] = useState(0);
    const [totalQty, setTotalQty] = useState(0);
    const cartItem = useSelector((state) => state.cartItem.cart);
    const user = useSelector((state) => state?.user);

    const fetchCartItem = async () => {
        // Kiểm tra token và user._id
        const accessToken = localStorage.getItem('accesstoken');
        if (!accessToken || !user?._id) {
            return;
        }

        try {
            const response = await Axios({
                ...SummaryApi.get_cart_item,
            });
            const { data: responseData } = response;

            if (responseData.success) {
                dispatch(handleAddItemCart(responseData.data));
            } else {
                toast.error('Lỗi khi tải giỏ hàng');
            }
        } catch (error) {
            // Không hiển thị toast error nếu là lỗi 401 (unauthorized)
            if (error?.response?.status !== 401) {
                toast.error('Lỗi khi tải giỏ hàng: ' + error.message);
            }
        }
    };

    const updateCartItem = async (id, qty) => {
        try {
            const response = await Axios({
                ...SummaryApi.update_cart_item_qty,
                data: {
                    _id: id,
                    qty: qty,
                },
            });
            const { data: responseData } = response;

            if (responseData.success) {
                await fetchCartItem();
                return responseData;
            }
        } catch (error) {
            AxiosToastError(error);
            return error;
        }
    };

    const deleteCartItem = async (cartId) => {
        try {
            const response = await Axios({
                ...SummaryApi.delete_cart_item,
                data: {
                    _id: cartId,
                },
            });
            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                await fetchCartItem();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    useEffect(() => {
        const qty = cartItem.reduce(
            (prev, curr) => prev + (curr.quantity || 0),
            0
        );
        setTotalQty(qty);

        const tPrice = cartItem.reduce((prev, curr) => {
            const priceAfterDiscount = pricewithDiscount(
                curr?.productId?.price || 0,
                curr?.productId?.discount || 0
            );
            return prev + priceAfterDiscount * (curr.quantity || 0);
        }, 0);
        setTotalPrice(tPrice);

        const notDiscountPrice = cartItem.reduce(
            (prev, curr) =>
                prev + (curr?.productId?.price || 0) * (curr.quantity || 0),
            0
        );
        setNotDiscountTotalPrice(notDiscountPrice);
    }, [cartItem]);

    const fetchAddress = async () => {
        // Kiểm tra token và user._id
        const accessToken = localStorage.getItem('accesstoken');
        if (!accessToken || !user?._id) {
            return;
        }

        try {
            const response = await Axios({
                ...SummaryApi.get_address,
            });
            const { data: responseData } = response;

            if (responseData.success) {
                dispatch(handleAddAddress(responseData.data));
            }
        } catch (error) {
            // Không hiển thị toast error nếu là lỗi 401 (unauthorized)
            if (error?.response?.status !== 401) {
                AxiosToastError(error);
            }
        }
    };

    const fetchOrder = () => async (dispatch, getState) => {
        // Chuyển thành thunk action
        const { user } = getState();

        // Kiểm tra token và user._id (sửa lại structure)
        const accessToken = localStorage.getItem('accesstoken');
        if (!accessToken || !user?._id) {
            return;
        }

        try {
            const response = await Axios({
                ...SummaryApi.get_order_items,
            });
            const { data: responseData } = response;

            if (responseData.success) {
                dispatch(setOrder(responseData.data)); // Dispatch action
            } else {
                toast.error('Lỗi khi tải danh sách đơn hàng');
            }
        } catch (error) {
            // Không hiển thị toast error nếu là lỗi 401 (unauthorized)
            if (error?.response?.status !== 401) {
                AxiosToastError(error);
            }
            throw error; // Ném lỗi để catch trong component
        }
    };

    // Chỉ fetch dữ liệu khi user thay đổi, không logout ngay
    useEffect(() => {
        const accessToken = localStorage.getItem('accesstoken');
        // Fetch khi có user._id và accessToken
        if (user?._id && accessToken) {
            fetchCartItem();
            fetchAddress();
            dispatch(fetchOrder()); // Sử dụng dispatch với thunk
        } else if (user === null || !accessToken) {
            // Clear Redux state khi user logout hoặc không có token
            dispatch(handleAddItemCart([])); // Clear cart items
        }
    }, [user, dispatch]);

    // Hàm reload thủ công sau thanh toán (gọi từ CheckoutPage.jsx)
    const reloadAfterPayment = async (selectedProductIds = null) => {
        try {
            // FORCE selective cleanup - luôn lấy từ localStorage nếu có
            let finalSelectedProductIds = selectedProductIds;

            // Nếu không có selectedProductIds, thử lấy từ localStorage
            if (
                !finalSelectedProductIds ||
                finalSelectedProductIds.length === 0
            ) {
                const storedSelectedItems = localStorage.getItem(
                    'checkoutSelectedItems'
                );
                if (storedSelectedItems) {
                    try {
                        const parsedItems = JSON.parse(storedSelectedItems);
                        if (
                            Array.isArray(parsedItems) &&
                            parsedItems.length > 0
                        ) {
                            finalSelectedProductIds = parsedItems;
                        }
                    } catch (e) {
                        AxiosToastError(e);
                    }
                }
            }

            // Gọi API clear cart với selectedProductIds (nếu có)
            const requestData =
                finalSelectedProductIds && finalSelectedProductIds.length > 0
                    ? { selectedProductIds: finalSelectedProductIds }
                    : {};

            const response = await Axios({
                ...SummaryApi.clear_cart,
                data: requestData,
            });

            if (response.data.success) {
                localStorage.removeItem('checkoutSelectedItems');
            }
        } catch (error) {
            AxiosToastError(error);
        }

        // Sau đó reload data
        fetchCartItem();
        dispatch(fetchOrder()); // Sử dụng dispatch với thunk
    };

    return (
        <GlobalContext.Provider
            value={{
                fetchCartItem,
                updateCartItem,
                deleteCartItem,
                fetchAddress,
                totalPrice,
                totalQty,
                notDiscountTotalPrice,
                fetchOrder,
                reloadAfterPayment,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export default GlobalProvider;
