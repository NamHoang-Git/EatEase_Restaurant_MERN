import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import { pricewithDiscount } from '../utils/PriceWithDiscount';
import { handleAddItemCart } from '../store/cartProduct';
import { handleAddAddress } from '../store/addressSlice';
import { setOrder, setAllOrders } from '../store/orderSlice';

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
            console.log('❌ fetchCartItem blocked - no auth:', {
                accessToken: !!accessToken,
                userId: user?._id,
            });
            return;
        }

        console.log('✅ fetchCartItem proceeding with auth');
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

    const handleLogoutOut = () => {
        localStorage.clear();
        dispatch(handleAddItemCart([]));
    };

    const fetchAddress = async () => {
        // Kiểm tra token và user._id
        const accessToken = localStorage.getItem('accesstoken');
        if (!accessToken || !user?._id) {
            console.log('❌ fetchAddress blocked - no auth:', {
                accessToken: !!accessToken,
                userId: user?._id,
            });
            return;
        }

        console.log('✅ fetchAddress proceeding with auth');
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
            console.log('❌ fetchOrder blocked - no auth:', {
                accessToken: !!accessToken,
                userId: user?._id,
                userState: user,
            });
            return;
        }

        console.log('✅ fetchOrder proceeding with auth', { userId: user._id });
        try {
            const response = await Axios({
                ...SummaryApi.get_order_items,
            });
            const { data: responseData } = response;

            if (responseData.success) {
                console.log(
                    '✅ fetchOrder success, orders:',
                    responseData.data
                );
                dispatch(setOrder(responseData.data)); // Dispatch action
            } else {
                console.log('❌ fetchOrder failed:', responseData.message);
                toast.error('Lỗi khi tải danh sách đơn hàng');
            }
        } catch (error) {
            console.log('❌ fetchOrder error:', error);
            // Không hiển thị toast error nếu là lỗi 401 (unauthorized)
            if (error?.response?.status !== 401) {
                AxiosToastError(error);
            }
            throw error; // Ném lỗi để catch trong component
        }
    };

    const fetchAllOrders =
        (filters = {}) =>
        async (dispatch, getState) => {
            const { user } = getState();
            const accessToken = localStorage.getItem('accesstoken');

            if (!accessToken || !user?._id || user?.role !== 'ADMIN') {
                console.log('❌ fetchAllOrders blocked - not admin or no auth');
                throw new Error('Bạn không có quyền truy cập');
            }

            try {
                const response = await Axios({
                    ...SummaryApi.all_orders,
                    params: {
                        search: filters.search,
                        status: filters.status,
                        startDate: filters.startDate,
                        endDate: filters.endDate,
                    },
                });

                const { data: responseData } = response;
                if (responseData.success) {
                    console.log(
                        '✅ fetchAllOrders success, total:',
                        responseData.data?.length || 0
                    );
                    dispatch(setAllOrders(responseData.data || []));
                    return { data: responseData.data };
                } else {
                    throw new Error(
                        responseData.message || 'Lỗi khi tải danh sách đơn hàng'
                    );
                }
            } catch (error) {
                console.error('❌ fetchAllOrders error:', error);
                throw error;
            }
        };

    // Chỉ fetch dữ liệu khi user thay đổi, không logout ngay
    useEffect(() => {
        const accessToken = localStorage.getItem('accesstoken');
        // Fetch khi có user._id và accessToken
        if (user?._id && accessToken) {
            console.log('🟢 User authenticated, fetching data...', {
                userId: user._id,
                hasToken: !!accessToken,
            });
            fetchCartItem();
            fetchAddress();
            dispatch(fetchOrder()); // Sử dụng dispatch với thunk
            if (user?.role === 'ADMIN') {
                dispatch(fetchAllOrders());
            }
        } else if (user === null || !accessToken) {
            // Clear Redux state khi user logout hoặc không có token
            console.log('🔴 User not authenticated, clearing data...', {
                user,
                hasToken: !!accessToken,
            });
            dispatch(handleAddItemCart([])); // Clear cart items
        }
        // Không làm gì nếu user vẫn đang undefined (đang load)
    }, [user, dispatch]);

    // Hàm reload thủ công sau thanh toán (gọi từ CheckoutPage.jsx)
    const reloadAfterPayment = async (selectedProductIds = null) => {
        console.log('reloadAfterPayment called with:', selectedProductIds);

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
                            console.log(
                                '🔄 Retrieved selectedProductIds from localStorage:',
                                finalSelectedProductIds
                            );
                        }
                    } catch (e) {
                        console.error('Error parsing stored selectedItems:', e);
                    }
                }
            }

            // Gọi API clear cart với selectedProductIds (nếu có)
            const requestData =
                finalSelectedProductIds && finalSelectedProductIds.length > 0
                    ? { selectedProductIds: finalSelectedProductIds }
                    : {};

            console.log('Sending request data to clear cart:', requestData);

            const response = await Axios({
                ...SummaryApi.clear_cart,
                data: requestData,
            });

            if (response.data.success) {
                console.log(
                    '✅ Cart cleared successfully:',
                    response.data.message
                );
                // Xóa localStorage sau khi thành công
                localStorage.removeItem('checkoutSelectedItems');
            }
        } catch (error) {
            console.error('Cart clear error:', error);
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
                fetchOrder, // Giữ nguyên để component gọi
                fetchAllOrders,
                reloadAfterPayment,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export default GlobalProvider;
