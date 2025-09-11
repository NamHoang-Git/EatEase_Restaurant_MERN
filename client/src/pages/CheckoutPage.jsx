import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserPoints } from '../store/userSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import Axios from '../utils/Axios';
import { pricewithDiscount } from '../utils/PriceWithDiscount';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { DisplayPriceInVND } from '../utils/DisplayPriceInVND';
import AddAddress from '../components/AddAddress';
import Loading from '../components/Loading';
import { MdDelete, MdEdit } from 'react-icons/md';
import AxiosToastError from '../utils/AxiosToastError';
import EditAddressDetails from '../components/EditAddressDetails';
import { useGlobalContext } from '../provider/GlobalProvider';

const CheckoutPage = () => {
    const dispatch = useDispatch();
    const { fetchAddress, reloadAfterPayment } = useGlobalContext();
    const [openAddress, setOpenAddress] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editData, setEditData] = useState({});
    const [showConfirmModal, setShowConfirmModal] = useState({
        show: false,
        type: '',
    });
    const addressList = useSelector((state) => state.addresses.addressList);
    const [selectAddress, setSelectAddress] = useState(0);
    const cartItemsList = useSelector((state) => state.cartItem.cart);
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [usePoints, setUsePoints] = useState(false);
    const [pointsToUse, setPointsToUse] = useState(0);
    const [maxPointsToUse, setMaxPointsToUse] = useState(0);
    const [showVouchers, setShowVouchers] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const userPoints = useSelector((state) => state.user.rewardsPoint || 0);
    const pointsValue = 100; // 1 point = 100 VND (aligned with backend)

    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [loadingVouchers, setLoadingVouchers] = useState(false);

    // Calculate total order amount
    const calculateTotal = useCallback(() => {
        return selectedItems.reduce((total, itemId) => {
            const cartItem = cartItemsList.find(
                (cartItem) => cartItem._id === itemId
            );
            if (cartItem) {
                const product = cartItem.productId;
                const quantity = cartItem.quantity;
                const price =
                    product.discountPrice > 0
                        ? product.discountPrice
                        : product.price;
                return total + price * quantity;
            }
            return total;
        }, 0);
    }, [selectedItems, cartItemsList]);

    // Fetch available vouchers when order total changes
    useEffect(() => {
        const fetchAvailableVouchers = async () => {
            try {
                setLoadingVouchers(true);

                // Calculate the total with discounts applied
                let discountedTotal = 0;
                const cartItemsData = [];
                const productIds = [];

                // Process each selected item
                for (const itemId of selectedItems) {
                    const cartItem = cartItemsList.find(
                        (ci) => ci._id === itemId
                    );
                    if (!cartItem) continue;

                    const product = cartItem.productId;
                    if (!product) continue;

                    // Use the pricewithDiscount utility to handle both fixed and percentage discounts
                    const price = pricewithDiscount(
                        product.price,
                        product.discount || 0
                    );

                    const itemTotal = price * cartItem.quantity;
                    discountedTotal += itemTotal;

                    // Prepare cart items data for the API
                    cartItemsData.push({
                        productId: product,
                        quantity: cartItem.quantity,
                    });

                    // Add to product IDs
                    if (product._id) {
                        productIds.push(product._id);
                    }
                }

                const response = await Axios.post(
                    SummaryApi.get_available_vouchers.url,
                    {
                        orderAmount: discountedTotal,
                        productIds,
                        cartItems: cartItemsData,
                    }
                );

                if (response.data.success) {
                    setAvailableVouchers(response.data.data || []);
                } else {
                    console.error('Vouchers API error:', response.data);
                    toast.error(
                        response.data.message ||
                            'Không thể tải danh sách voucher'
                    );
                }
            } catch (error) {
                console.error('Lỗi khi tải voucher:', error);
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error('Error response data:', error.response.data);
                    console.error('Error status:', error.response.status);
                    console.error('Error headers:', error.response.headers);
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error('No response received:', error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error('Error message:', error.message);
                }
                toast.error(
                    'Có lỗi xảy ra khi tải danh sách voucher: ' +
                        (error.response?.data?.message || error.message)
                );
            } finally {
                setLoadingVouchers(false);
            }
        };

        // Only fetch vouchers if there are items in the cart
        if (selectedItems.length > 0) {
            fetchAvailableVouchers();
        } else {
            setAvailableVouchers([]);
        }
    }, [selectedItems, cartItemsList, calculateTotal]);

    // Sắp xếp addressList để địa chỉ isDefault: true lên đầu
    const sortedAddressList = [...addressList].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    useEffect(() => {
        if (addressList.length > 0) {
            const defaultIndex = addressList.findIndex(
                (addr) => addr.isDefault === true
            );
            setSelectAddress(defaultIndex >= 0 ? defaultIndex : 0);
        }
    }, [addressList]);

    useEffect(() => {
        if (location.state?.selectedItems) {
            setSelectedItems(location.state.selectedItems);

            // Lưu selectedProductIds vào localStorage để backup
            const selectedProductIds = cartItemsList
                .filter((item) =>
                    location.state.selectedItems.includes(item._id)
                )
                .map((item) => item.productId._id);

            if (selectedProductIds.length > 0) {
                localStorage.setItem(
                    'checkoutSelectedItems',
                    JSON.stringify(selectedProductIds)
                );
            }
        } else {
            setSelectedItems(cartItemsList.map((item) => item._id));
            // Xóa localStorage nếu thanh toán toàn bộ
            localStorage.removeItem('checkoutSelectedItems');
        }
    }, [location.state, cartItemsList]);

    const filteredItems = cartItemsList.filter((item) =>
        selectedItems.includes(item._id)
    );

    // Cleanup cart sau thanh toán thành công
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (sessionId && filteredItems.length > 0) {
            // Kiểm tra xem có phải thanh toán một phần không
            const hasSelectedItems =
                location.state?.selectedItems &&
                Array.isArray(location.state.selectedItems);
            const isPartialCheckout =
                hasSelectedItems &&
                location.state.selectedItems.length < cartItemsList.length;

            if (isPartialCheckout) {
                // Chỉ xóa các sản phẩm được chọn
                const selectedProductIds = filteredItems.map(
                    (item) => item.productId._id
                );
                setTimeout(() => {
                    reloadAfterPayment(selectedProductIds);
                }, 2000);
            } else {
                setTimeout(() => {
                    reloadAfterPayment(null);
                }, 2000);
            }
        }
    }, [
        reloadAfterPayment,
        filteredItems,
        cartItemsList.length,
        location.state,
    ]);

    const filteredTotalPrice = filteredItems.reduce(
        (acc, item) =>
            acc +
            (item.productId?.price || 0) *
                (item.quantity || 1) *
                (1 - (item.productId?.discount || 0) / 100),
        0
    );

    // Calculate maximum points that can be used (50% of order total)
    useEffect(() => {
        const maxPoints = Math.min(
            Math.floor((filteredTotalPrice * 0.5) / pointsValue),
            userPoints
        );
        setMaxPointsToUse(maxPoints);
    }, [filteredTotalPrice, userPoints, pointsValue]);

    // Reset points to use if it exceeds the new maximum
    useEffect(() => {
        if (pointsToUse > maxPointsToUse) {
            setPointsToUse(maxPointsToUse);
        }
    }, [pointsToUse, maxPointsToUse]);

    // Calculate points discount and final total
    const pointsDiscount = pointsToUse * pointsValue;
    const finalTotal = Math.max(0, filteredTotalPrice - pointsDiscount);

    const filteredNotDiscountTotalPrice = filteredItems.reduce(
        (acc, item) =>
            acc + (item.productId?.price || 0) * (item.quantity || 1),
        0
    );

    const filteredTotalQty = filteredItems.reduce(
        (acc, item) => acc + (item.quantity || 1),
        0
    );

    const handleDisableAddress = async (id) => {
        try {
            const response = await Axios({
                ...SummaryApi.delete_address,
                data: {
                    _id: id,
                },
            });
            if (response.data.success) {
                toast.success('Address Removed');
                if (fetchAddress) {
                    fetchAddress();
                }
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const handleCashOnDelivery = async () => {
        if (usePoints && pointsToUse > 0 && pointsToUse > userPoints) {
            toast.error('Số điểm sử dụng vượt quá số điểm hiện có');
            return;
        }
        setShowConfirmModal({ show: true, type: 'cash' });
    };

    const confirmCashOnDelivery = async () => {
        try {
            // Ensure points don't exceed maximum allowed (50% of order total)
            const maxPointsAllowed = Math.floor(filteredTotalPrice / 2 / 100);
            const actualPointsToUse = usePoints
                ? Math.min(pointsToUse, maxPointsAllowed)
                : 0;

            setLoading(true);
            const response = await Axios({
                ...SummaryApi.cash_on_delivery_order,
                data: {
                    list_items: filteredItems,
                    addressId: addressList[selectAddress]?._id,
                    subTotalAmt: filteredTotalPrice,
                    totalAmt: finalTotal,
                    pointsToUse: actualPointsToUse,
                },
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                // Fetch updated user data including points
                try {
                    const userResponse = await Axios({
                        ...SummaryApi.user_details,
                    });
                    if (userResponse.data.success) {
                        dispatch(
                            updateUserPoints(
                                userResponse.data.data.rewardsPoint || 0
                            )
                        );
                        // dispatch(updateUserPoints(pointsResponse.data.points));
                    }
                } catch (error) {
                    console.error('Error fetching user points:', error);
                }
                navigate('/success', { state: { text: 'Order' } }); // This is the correct redirection
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
            setShowConfirmModal({ show: false, type: '' });
        }
    };

    const handleOnlinePayment = async () => {
        try {
            // Ensure points don't exceed maximum allowed (50% of order total)
            const maxPointsAllowed = Math.floor(filteredTotalPrice / 2 / 100);
            const actualPointsToUse = usePoints
                ? Math.min(pointsToUse, maxPointsAllowed, userPoints)
                : 0;

            if (usePoints && pointsToUse > 0 && pointsToUse > userPoints) {
                toast.error('Số điểm sử dụng vượt quá số điểm hiện có');
                return;
            }

            setLoading(true);
            const response = await Axios({
                ...SummaryApi.payment_url,
                data: {
                    list_items: filteredItems,
                    addressId: addressList[selectAddress]?._id,
                    subTotalAmt: filteredTotalPrice,
                    totalAmt: finalTotal,
                    pointsToUse: actualPointsToUse,
                },
            });

            const { data: responseData } = response;

            if (responseData.isFreeOrder) {
                toast.success(responseData.message);
                navigate('/success', { state: { text: 'Order' } });
            } else {
                const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
                const stripePromise = await loadStripe(stripePublicKey);
                const { error } = await stripePromise.redirectToCheckout({
                    sessionId: responseData.id,
                });

                if (error) {
                    toast.error('Thanh toán thất bại: ' + error.message);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Thanh toán thất bại');
        } finally {
            setLoading(false);
            setShowConfirmModal({ show: false, type: '' });
        }
    };

    const hasDiscount = cartItemsList
        .filter((item) => selectedItems.includes(item._id))
        .some((item) => item.productId?.discount > 0);

    return (
        <section className="container mx-auto bg-base-100 min-h-[80vh] px-2 py-6">
            <div
                className="p-4 lg:p-3 mb-3 bg-primary-4 rounded-md shadow-md shadow-secondary-100
                font-bold text-secondary-200 sm:text-lg text-sm uppercase"
            >
                Thanh toán
            </div>
            <div className="h-full flex flex-col lg:flex-row w-full gap-5 bg-white shadow rounded-lg p-5">
                <div className="w-full flex flex-col gap-3">
                    <h3 className="sm:text-lg text-sm font-bold shadow-md px-2 py-3">
                        Chọn địa chỉ giao hàng
                    </h3>

                    <div
                        className="bg-white grid gap-4 overflow-auto max-h-[55vh] sm:max-h-[55vh]
                    md:max-h-[60vh] lg:max-h-[65vh]"
                    >
                        {sortedAddressList.map((address, index) => (
                            <label
                                key={index}
                                htmlFor={'address' + index}
                                className={!address.status ? 'hidden' : ''}
                            >
                                <div
                                    className="border border-secondary-100 rounded-md px-2 sm:px-4 py-3 hover:bg-base-100
                                shadow-md cursor-pointer"
                                >
                                    <div className="flex justify-between sm:items-start items-end gap-4">
                                        <div className="flex items-baseline gap-2 sm:gap-3">
                                            <input
                                                id={'address' + index}
                                                type="radio"
                                                checked={
                                                    selectAddress ===
                                                    addressList.findIndex(
                                                        (addr) =>
                                                            addr._id ===
                                                            address._id
                                                    )
                                                }
                                                onChange={() =>
                                                    setSelectAddress(
                                                        addressList.findIndex(
                                                            (addr) =>
                                                                addr._id ===
                                                                address._id
                                                        )
                                                    )
                                                }
                                                name="address"
                                            />
                                            <div className="flex flex-col gap-1 text-[10px] sm:text-base text-justify">
                                                <p>
                                                    Địa chỉ:{' '}
                                                    {address.address_line}
                                                </p>
                                                <p>Thành phố: {address.city}</p>
                                                <p>
                                                    Quận / Huyện:{' '}
                                                    {address.district}
                                                </p>
                                                <p>
                                                    Phường / Xã: {address.ward}
                                                </p>
                                                <p>
                                                    Quốc gia: {address.country}
                                                </p>
                                                <p>
                                                    Số điện thoại:{' '}
                                                    {address.mobile}
                                                </p>
                                            </div>
                                            {address.isDefault && (
                                                <span className="text-secondary-200 text-[10px] sm:text-lg font-bold">
                                                    (*)
                                                </span>
                                            )}
                                        </div>

                                        {/* PC / Tablet */}
                                        <div className="sm:flex hidden items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    setOpenEdit(true);
                                                    setEditData(address);
                                                }}
                                                className="shadow-md shadow-secondary-100 rounded hover:opacity-80 p-[3px] text-primary-200"
                                            >
                                                <MdEdit size={18} />
                                            </button>
                                            {!address.isDefault && (
                                                <>
                                                    <div className="w-[2px] h-4 bg-secondary-100"></div>
                                                    <button
                                                        onClick={() =>
                                                            handleDisableAddress(
                                                                address._id
                                                            )
                                                        }
                                                        className="shadow-md shadow-secondary-100 rounded hover:opacity-80 p-[3px] text-secondary-200"
                                                    >
                                                        <MdDelete size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Mobile */}
                                        <div className="flex sm:hidden items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setOpenEdit(true);
                                                    setEditData(address);
                                                }}
                                                className="shadow-md shadow-secondary-100 rounded hover:opacity-80 p-[1px] text-primary-200"
                                            >
                                                <MdEdit size={15} />
                                            </button>
                                            {!address.isDefault && (
                                                <>
                                                    <div className="w-[2px] h-4 bg-secondary-100"></div>
                                                    <button
                                                        onClick={() =>
                                                            handleDisableAddress(
                                                                address._id
                                                            )
                                                        }
                                                        className="shadow-md shadow-secondary-100 rounded hover:opacity-80 p-[1px] text-secondary-200"
                                                    >
                                                        <MdDelete size={15} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div
                        onClick={() => setOpenAddress(true)}
                        className="sm:h-14 h-12 bg-base-100 border-[3px] border-dashed border-gray-300 text-gray-400
                    flex justify-center items-center cursor-pointer hover:bg-primary-100 hover:text-gray-500
                    transition-all sm:text-base text-xs"
                    >
                        Thêm địa chỉ
                    </div>
                </div>

                <div className="w-full lg:max-w-2xl bg-white flex flex-col gap-3 shadow-md px-2">
                    <h3 className="text-lg font-bold shadow-md px-2 py-3">
                        Đơn hàng
                    </h3>
                    <div className="bg-white px-4 grid gap-3">
                        <div>
                            <h3 className="font-semibold text-red-darker py-2">
                                Danh sách sản phẩm
                            </h3>
                            {filteredItems.length === 0 ? (
                                <p className="text-gray-500">Giỏ hàng trống</p>
                            ) : (
                                filteredItems.map((item) => {
                                    const product = item.productId || {};
                                    const name =
                                        product.name ||
                                        'Sản phẩm không xác định';
                                    const image =
                                        product.image ||
                                        '/placeholder-image.jpg';
                                    const price = product.price || 0;
                                    const discount = product.discount || 0;
                                    const quantity = item.quantity || 1;
                                    const finalPrice =
                                        price * quantity * (1 - discount / 100);

                                    return (
                                        <div
                                            key={item._id}
                                            className="flex gap-4 items-center mb-4 shadow-lg p-2"
                                        >
                                            <img
                                                src={image}
                                                alt={name}
                                                className="sm:w-16 sm:h-16 w-12 h-12 object-cover rounded border border-inset border-primary-200"
                                                onError={(e) => {
                                                    e.target.src =
                                                        '/placeholder-image.jpg';
                                                }}
                                            />
                                            <div className="flex-1 flex flex-col sm:gap-0 gap-1">
                                                <p className="font-medium sm:text-base text-xs">
                                                    {name}
                                                </p>
                                                <p className="sm:text-sm text-xs text-gray-600">
                                                    Số lượng: {quantity}
                                                </p>
                                                <p className="sm:text-sm text-xs flex items-center gap-2">
                                                    Giá:{' '}
                                                    {DisplayPriceInVND(
                                                        finalPrice
                                                    )}
                                                    {discount > 0 && (
                                                        <span className="line-through text-gray-400">
                                                            {DisplayPriceInVND(
                                                                price * quantity
                                                            )}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="flex flex-col sm:gap-2 gap-3 sm:text-base text-xs">
                            <h3 className="font-semibold text-red-darker">
                                Chi tiết hóa đơn
                            </h3>
                            <div className="px-4 flex flex-col gap-2">
                                <div className="flex gap-4 justify-between">
                                    <p>Tổng sản phẩm</p>
                                    <p className="flex sm:flex-row flex-col items-center sm:gap-2 gap-0">
                                        {hasDiscount > 0 && (
                                            <span className="line-through text-neutral-400">
                                                {DisplayPriceInVND(
                                                    filteredNotDiscountTotalPrice
                                                )}
                                            </span>
                                        )}
                                        <span className="text-red-darker font-bold">
                                            {DisplayPriceInVND(
                                                filteredTotalPrice
                                            )}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex gap-4 justify-between">
                                    <p>Số lượng</p>
                                    <p className="flex items-center gap-2">
                                        {filteredTotalQty} sản phẩm
                                    </p>
                                </div>
                                <div className="flex gap-4 justify-between">
                                    <p>Phí vận chuyển</p>
                                    <p className="flex items-center gap-2 italic">
                                        Miễn phí
                                    </p>
                                </div>

                                {/* Voucher Section */}
                                <div className="border-t border-gray-200 pt-4 mt-2">
                                    <div
                                        className="flex items-center justify-between cursor-pointer"
                                        onClick={() =>
                                            setShowVouchers(!showVouchers)
                                        }
                                    >
                                        <p className="font-medium">
                                            Mã giảm giá
                                        </p>
                                        <div className="flex items-center">
                                            <span className="text-sm text-gray-500 mr-1">
                                                {loadingVouchers
                                                    ? 'Đang tải...'
                                                    : `${availableVouchers.filter(
                                                          (v) =>
                                                              new Date(v.startDate) <=
                                                              new Date()
                                                      ).length} mã khả dụng`}
                                            </span>
                                            <svg
                                                className={`w-4 h-4 transition-transform ${
                                                    showVouchers
                                                        ? 'transform rotate-180'
                                                        : ''
                                                } ${
                                                    loadingVouchers
                                                        ? 'animate-spin'
                                                        : ''
                                                }`}
                                                fill="none"
                                                stroke={
                                                    loadingVouchers
                                                        ? 'transparent'
                                                        : 'currentColor'
                                                }
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                {!loadingVouchers && (
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                )}
                                                {loadingVouchers && (
                                                    <path
                                                        className="text-blue-500"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                )}
                                            </svg>
                                        </div>
                                    </div>
                                    {showVouchers && (
                                        <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                            {loadingVouchers ? (
                                                <div className="flex justify-center py-4">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                                </div>
                                            ) : availableVouchers.length > 0 ? (
                                                <div className="space-y-2">
                                                    {/* Active Vouchers */}
                                                    {availableVouchers.filter(
                                                        (v) => v.isActive
                                                    ).length > 0 && (
                                                        <div className="mb-4">
                                                            <p className="text-sm font-medium text-gray-700 mb-2">
                                                                Mã giảm giá khả
                                                                dụng
                                                            </p>
                                                            <div className="space-y-2">
                                                                {availableVouchers
                                                                    .filter(
                                                                        (
                                                                            voucher
                                                                        ) =>
                                                                            voucher.isActive
                                                                    )
                                                                    .map(
                                                                        (
                                                                            voucher
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    voucher.id
                                                                                }
                                                                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                                                    selectedVoucher?.id ===
                                                                                    voucher.id
                                                                                        ? 'border-green-500 bg-green-50'
                                                                                        : 'border-gray-200 hover:border-green-300'
                                                                                }`}
                                                                                onClick={() =>
                                                                                    setSelectedVoucher(
                                                                                        voucher
                                                                                    )
                                                                                }
                                                                            >
                                                                                <div className="flex justify-between items-start">
                                                                                    <div>
                                                                                        <div className="font-medium text-green-700">
                                                                                            {
                                                                                                voucher.code
                                                                                            }
                                                                                        </div>
                                                                                        <p className="text-sm text-gray-600">
                                                                                            {
                                                                                                voucher.description
                                                                                            }
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                                            Đơn
                                                                                            tối
                                                                                            thiểu:{' '}
                                                                                            {DisplayPriceInVND(
                                                                                                voucher.minOrder
                                                                                            )}
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-500">
                                                                                            HSD:{' '}
                                                                                            {
                                                                                                voucher.expiryDate
                                                                                            }
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        {voucher.isFreeShipping ? (
                                                                                            <span className="text-green-600 font-medium">
                                                                                                Miễn
                                                                                                phí
                                                                                                vận
                                                                                                chuyển
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="text-green-600 font-medium">
                                                                                                {voucher.discountType ===
                                                                                                'percent'
                                                                                                    ? `Giảm ${voucher.discount}%`
                                                                                                    : `Giảm ${DisplayPriceInVND(
                                                                                                          voucher.discount
                                                                                                      )}`}
                                                                                            </span>
                                                                                        )}
                                                                                        {voucher.maxDiscount && (
                                                                                            <p className="text-xs text-gray-500">
                                                                                                Tối
                                                                                                đa{' '}
                                                                                                {DisplayPriceInVND(
                                                                                                    voucher.maxDiscount
                                                                                                )}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Upcoming Vouchers */}
                                                    {availableVouchers.filter(
                                                        (v) => v.isUpcoming
                                                    ).length > 0 && (
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700 mb-2">
                                                                Mã giảm giá sắp
                                                                diễn ra
                                                            </p>
                                                            <div className="space-y-2">
                                                                {availableVouchers
                                                                    .filter(
                                                                        (
                                                                            voucher
                                                                        ) =>
                                                                            voucher.isUpcoming
                                                                    )
                                                                    .map(
                                                                        (
                                                                            voucher
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    voucher.id
                                                                                }
                                                                                className="p-3 border border-gray-200 rounded-lg bg-gray-50 opacity-75 cursor-not-allowed"
                                                                            >
                                                                                <div className="flex justify-between items-start">
                                                                                    <div>
                                                                                        <div className="font-medium text-gray-500">
                                                                                            {
                                                                                                voucher.code
                                                                                            }
                                                                                        </div>
                                                                                        <p className="text-sm text-gray-500">
                                                                                            {
                                                                                                voucher.description
                                                                                            }
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-400 mt-1">
                                                                                            Đơn
                                                                                            tối
                                                                                            thiểu:{' '}
                                                                                            {DisplayPriceInVND(
                                                                                                voucher.minOrder
                                                                                            )}
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-400">
                                                                                            Có
                                                                                            hiệu
                                                                                            lực
                                                                                            từ:{' '}
                                                                                            {
                                                                                                voucher.availableFrom
                                                                                            }
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-400">
                                                                                            HSD:{' '}
                                                                                            {
                                                                                                voucher.expiryDate
                                                                                            }
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        {voucher.isFreeShipping ? (
                                                                                            <span className="text-gray-400 font-medium">
                                                                                                Miễn
                                                                                                phí
                                                                                                vận
                                                                                                chuyển
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="text-gray-400 font-medium">
                                                                                                {voucher.discountType ===
                                                                                                'percent'
                                                                                                    ? `Giảm ${voucher.discount}%`
                                                                                                    : `Giảm ${DisplayPriceInVND(
                                                                                                          voucher.discount
                                                                                                      )}`}
                                                                                            </span>
                                                                                        )}
                                                                                        {voucher.maxDiscount && (
                                                                                            <p className="text-xs text-gray-400">
                                                                                                Tối
                                                                                                đa{' '}
                                                                                                {DisplayPriceInVND(
                                                                                                    voucher.maxDiscount
                                                                                                )}
                                                                                            </p>
                                                                                        )}
                                                                                        <div className="mt-1">
                                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                                                Sắp
                                                                                                diễn
                                                                                                ra
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 text-center py-2">
                                                    Không có mã giảm giá khả
                                                    dụng
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {userPoints == 0 && (
                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="usePoints"
                                                    disabled={userPoints == 0}
                                                    checked={usePoints}
                                                    onChange={(e) => {
                                                        setUsePoints(
                                                            e.target.checked
                                                        );
                                                        if (!e.target.checked) {
                                                            setPointsToUse(0);
                                                        } else {
                                                            setPointsToUse(
                                                                maxPointsToUse
                                                            );
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-2 focus:ring-primary-2"
                                                />
                                                <label
                                                    htmlFor="usePoints"
                                                    className="text-sm font-medium text-gray-700"
                                                >
                                                    Sử dụng điểm thưởng
                                                </label>
                                            </div>
                                            <div className="text-sm text-gray-400 italic flex flex-col items-end">
                                                <p>
                                                    Bạn chưa có điểm thưởng để
                                                    sử dụng
                                                </p>
                                                <p className="text-xs">
                                                    Điểm thưởng sẽ được cộng sau
                                                    khi đơn hàng hoàn tất
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {userPoints > 0 && (
                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="usePoints"
                                                    checked={usePoints}
                                                    onChange={(e) => {
                                                        setUsePoints(
                                                            e.target.checked
                                                        );
                                                        if (!e.target.checked) {
                                                            setPointsToUse(0);
                                                        } else {
                                                            setPointsToUse(
                                                                maxPointsToUse
                                                            );
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-2 focus:ring-primary-2"
                                                />
                                                <label
                                                    htmlFor="usePoints"
                                                    className="text-sm font-medium text-gray-700"
                                                >
                                                    Sử dụng điểm thưởng
                                                </label>
                                            </div>
                                            <div className="text-sm text-gray-600 flex flex-col items-end">
                                                <p>
                                                    Có sẵn:{' '}
                                                    {userPoints.toLocaleString()}{' '}
                                                    điểm (
                                                    {DisplayPriceInVND(
                                                        userPoints * pointsValue
                                                    )}
                                                    )
                                                </p>
                                                <p className="text-xs">
                                                    Bạn chỉ được dùng tối đa 50%
                                                    giá trị đơn hàng
                                                </p>
                                            </div>
                                        </div>

                                        {usePoints && (
                                            <div className="pl-6">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max={maxPointsToUse}
                                                        value={pointsToUse}
                                                        onChange={(e) =>
                                                            setPointsToUse(
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                        className="h-2 w-full rounded-lg appearance-none bg-gray-200"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        value={
                                                            pointsToUse === 0
                                                                ? ''
                                                                : pointsToUse
                                                        }
                                                        onChange={(e) => {
                                                            const rawValue =
                                                                e.target.value;
                                                            // Allow empty string for better UX when clearing the input
                                                            if (
                                                                rawValue === ''
                                                            ) {
                                                                setPointsToUse(
                                                                    0
                                                                );
                                                                return;
                                                            }
                                                            // Only allow numbers
                                                            if (
                                                                /^\d+$/.test(
                                                                    rawValue
                                                                )
                                                            ) {
                                                                const value =
                                                                    parseInt(
                                                                        rawValue,
                                                                        10
                                                                    );
                                                                if (
                                                                    !isNaN(
                                                                        value
                                                                    )
                                                                ) {
                                                                    setPointsToUse(
                                                                        Math.min(
                                                                            Math.max(
                                                                                0,
                                                                                value
                                                                            ),
                                                                            maxPointsToUse
                                                                        )
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            // Ensure we have a valid number when input loses focus
                                                            const value =
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ) || 0;
                                                            setPointsToUse(
                                                                Math.min(
                                                                    Math.max(
                                                                        0,
                                                                        value
                                                                    ),
                                                                    maxPointsToUse
                                                                )
                                                            );
                                                        }}
                                                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                                        aria-label="Số điểm sử dụng"
                                                        placeholder="0"
                                                    />

                                                    <span className="text-sm font-medium">
                                                        điểm (tối đa:{' '}
                                                        {maxPointsToUse.toLocaleString()}
                                                        )
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPointsToUse(
                                                                maxPointsToUse
                                                            )
                                                        }
                                                        disabled={
                                                            pointsToUse ===
                                                            maxPointsToUse
                                                        }
                                                        className={`text-xs px-2 py-1 rounded ${
                                                            pointsToUse ===
                                                            maxPointsToUse
                                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                        }`}
                                                    >
                                                        Dùng tối đa
                                                    </button>
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500">
                                                    Giảm:{' '}
                                                    {DisplayPriceInVND(
                                                        pointsToUse *
                                                            pointsValue
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* Points Discount */}
                            {usePoints && pointsToUse > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <p>Giảm giá từ điểm thưởng</p>
                                    <p>
                                        -
                                        {DisplayPriceInVND(
                                            pointsToUse * pointsValue
                                        )}
                                    </p>
                                </div>
                            )}

                            <div className="font-semibold flex items-center justify-between gap-4 border-t border-gray-200 pt-2">
                                <p>Tổng cộng</p>
                                <p className="text-secondary-200 font-bold">
                                    {DisplayPriceInVND(
                                        Math.max(
                                            0,
                                            filteredTotalPrice -
                                                pointsToUse * pointsValue
                                        )
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex flex-col gap-4 py-4 sm:text-base text-xs">
                        {/* Points Summary */}
                        {usePoints && pointsToUse > 0 && (
                            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                <p className="text-sm text-blue-700">
                                    Bạn sẽ sử dụng{' '}
                                    <span className="font-semibold">
                                        {pointsToUse.toLocaleString()} điểm
                                    </span>
                                    (tương đương{' '}
                                    {DisplayPriceInVND(
                                        pointsToUse * pointsValue
                                    )}
                                    ) cho đơn hàng này.
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Điểm còn lại:{' '}
                                    {(
                                        userPoints - pointsToUse
                                    ).toLocaleString()}{' '}
                                    điểm
                                </p>
                            </div>
                        )}

                        <button
                            className="py-2 px-4 bg-primary-2 hover:opacity-80 rounded shadow-md
                        cursor-pointer text-secondary-200 font-semibold"
                            onClick={() =>
                                setShowConfirmModal({
                                    show: true,
                                    type: 'online',
                                })
                            }
                            disabled={loading}
                        >
                            {loading ? <Loading /> : 'Thanh toán online'}
                        </button>
                        <button
                            className="py-2 px-4 border-[3px] border-red-darker font-semibold text-red-darker hover:bg-red-darker
                        hover:text-white rounded cursor-pointer transition-all"
                            onClick={handleCashOnDelivery}
                            disabled={loading}
                        >
                            Thanh toán khi nhận hàng
                        </button>
                    </div>
                </div>
            </div>

            {openAddress && <AddAddress close={() => setOpenAddress(false)} />}

            {openEdit && (
                <EditAddressDetails
                    data={editData}
                    close={() => setOpenEdit(false)}
                />
            )}

            {/* Modal xác nhận cho cả hai phương thức thanh toán */}
            {showConfirmModal.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">
                            Xác nhận đặt hàng
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn đặt hàng với phương thức{' '}
                            {showConfirmModal.type === 'cash'
                                ? 'thanh toán khi nhận hàng'
                                : 'thanh toán online'}{' '}
                            không?
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                className="py-2 px-6 bg-white text-secondary-200 border-[3px] hover:bg-secondary-200
                            hover:text-white border-secondary-200 rounded-md font-bold cursor-pointer"
                                onClick={() =>
                                    setShowConfirmModal({
                                        show: false,
                                        type: '',
                                    })
                                }
                            >
                                Hủy
                            </button>
                            <button
                                className="py-2 px-4 bg-primary-2 hover:opacity-80 rounded-md text-secondary-200 font-bold cursor-pointer
                            border-[3px] border-inset border-secondary-200"
                                onClick={
                                    {
                                        cash: confirmCashOnDelivery,
                                        online: handleOnlinePayment,
                                    }[showConfirmModal.type] || (() => {})
                                }
                                disabled={loading}
                            >
                                {loading ? <Loading /> : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CheckoutPage;
