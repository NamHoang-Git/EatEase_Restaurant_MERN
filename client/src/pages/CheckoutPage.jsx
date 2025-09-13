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
import Divider from '../components/Divider';

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
    const [selectedVouchers, setSelectedVouchers] = useState({
        freeShipping: null,
        regular: null,
    });
    const userPoints = useSelector((state) => state.user.rewardsPoint || 0);
    const pointsValue = 100; // 1 point = 100 VND
    const shippingCost = 30000; // Lấy từ API hoặc config

    const [availableVouchers, setAvailableVouchers] = useState({
        active: [],
        upcoming: [],
    });
    const [loadingVouchers, setLoadingVouchers] = useState(false);
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherError, setVoucherError] = useState('');

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

    // Fetch available vouchers
    useEffect(() => {
        const fetchAvailableVouchers = async () => {
            try {
                setLoadingVouchers(true);
                let discountedTotal = 0;
                const cartItemsData = [];
                const productIds = [];

                for (const itemId of selectedItems) {
                    const cartItem = cartItemsList.find(
                        (ci) => ci._id === itemId
                    );
                    if (!cartItem) continue;

                    const product = cartItem.productId;
                    if (!product) continue;

                    const price = pricewithDiscount(
                        product.price,
                        product.discount || 0
                    );
                    const itemTotal = price * cartItem.quantity;
                    discountedTotal += itemTotal;

                    cartItemsData.push({
                        productId: product,
                        quantity: cartItem.quantity,
                    });

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
                    const now = new Date();
                    // Separate vouchers into active and upcoming
                    const allVouchers = response.data.data || [];
                    const activeVouchers = [];
                    const upcomingVouchers = [];

                    allVouchers.forEach((voucher) => {
                        const startDate = new Date(voucher.startDate || 0);
                        if (startDate <= now) {
                            activeVouchers.push(voucher);
                        } else {
                            upcomingVouchers.push(voucher);
                        }
                    });

                    // Store both active and upcoming vouchers in state
                    setAvailableVouchers({
                        active: activeVouchers,
                        upcoming: upcomingVouchers,
                    });
                } else {
                    console.error('Vouchers API error:', response.data);
                    toast.error(
                        response.data.message ||
                            'Không thể tải danh sách voucher'
                    );
                }
            } catch (error) {
                console.error('Lỗi khi tải voucher:', error);
                toast.error(
                    'Có lỗi xảy ra khi tải danh sách voucher: ' +
                        (error.response?.data?.message || error.message)
                );
            } finally {
                setLoadingVouchers(false);
            }
        };

        if (selectedItems.length > 0) {
            fetchAvailableVouchers();
        } else {
            setAvailableVouchers([]);
        }
    }, [selectedItems, cartItemsList, calculateTotal]);

    // Sort addressList
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
            localStorage.removeItem('checkoutSelectedItems');
        }
    }, [location.state, cartItemsList]);

    const filteredItems = cartItemsList.filter((item) =>
        selectedItems.includes(item._id)
    );

    const filteredTotalPrice =
        filteredItems.reduce(
            (acc, item) =>
                acc +
                (item.productId?.price || 0) *
                    (item.quantity || 1) *
                    (1 - (item.productId?.discount || 0) / 100),
            0
        ) + (selectedVouchers.freeShipping ? 0 : shippingCost);

    // Handle apply voucher
    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) {
            setVoucherError('Vui lòng nhập mã giảm giá');
            return;
        }

        try {
            setLoadingVouchers(true);
            setVoucherError('');

            const response = await Axios.post(SummaryApi.apply_voucher.url, {
                code: voucherCode.trim(),
                orderAmount: calculateTotal(),
                productIds: filteredItems.map((item) => item.productId._id),
            });

            if (response.data.success) {
                const voucher = response.data.data;
                // Ensure voucher has all required fields
                const formattedVoucher = {
                    ...voucher, // Spread the voucher data from API first
                    code: voucher.code || voucherCode.trim(),
                    name: voucher.name || 'Mã giảm giá',
                    // Use discountValue if available, otherwise fallback to discount
                    discountValue: Number(
                        voucher.discountValue || voucher.discount || 0
                    ),
                    discountType: voucher.discountType || 'fixed',
                    isFreeShipping: voucher.isFreeShipping || false,
                    calculatedDiscount: Number(voucher.calculatedDiscount) || 0,
                    maxDiscount: Number(voucher.maxDiscount) || 0,
                    // Ensure discount is set for backward compatibility
                    discount: Number(
                        voucher.discount || voucher.discountValue || 0
                    ),
                };

                if (formattedVoucher.isFreeShipping) {
                    setSelectedVouchers((prev) => ({
                        ...prev,
                        freeShipping: formattedVoucher,
                    }));
                } else {
                    setSelectedVouchers((prev) => ({
                        ...prev,
                        regular: formattedVoucher,
                    }));
                }
                setVoucherCode(''); // Clear input after successful application
                toast.success('Áp dụng mã giảm giá thành công');
            } else {
                setVoucherError(
                    response.data.message || 'Mã giảm giá không hợp lệ'
                );
            }
        } catch (error) {
            console.error('Lỗi khi áp dụng mã giảm giá:', error);
            setVoucherError(
                error.response?.data?.message ||
                    'Có lỗi xảy ra khi áp dụng mã giảm giá'
            );
        } finally {
            setLoadingVouchers(false);
        }
    };

    // Cleanup cart after payment
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (sessionId && filteredItems.length > 0) {
            const hasSelectedItems =
                location.state?.selectedItems &&
                Array.isArray(location.state.selectedItems);
            const isPartialCheckout =
                hasSelectedItems &&
                location.state.selectedItems.length < cartItemsList.length;

            if (isPartialCheckout) {
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

    useEffect(() => {
        const maxPoints = Math.min(
            Math.floor((filteredTotalPrice * 0.5) / pointsValue),
            userPoints
        );
        setMaxPointsToUse(maxPoints);
    }, [filteredTotalPrice, userPoints, pointsValue]);

    useEffect(() => {
        if (pointsToUse > maxPointsToUse) {
            setPointsToUse(maxPointsToUse);
        }
    }, [pointsToUse, maxPointsToUse]);

    const calculateVoucherDiscount = useCallback(() => {
        let totalDiscount = 0;

        // Calculate free shipping discount if any
        if (selectedVouchers.freeShipping) {
            totalDiscount += shippingCost;
        }

        // Calculate regular voucher discount if any
        if (selectedVouchers.regular) {
            const { discountType, discount, maxDiscount } =
                selectedVouchers.regular;
            const discountValue = Number(discount) || 0;
            const maxDiscountValue = Number(maxDiscount) || 0;

            if (discountType === 'percentage') {
                const discountAmount =
                    (filteredTotalPrice * discountValue) / 100;
                totalDiscount +=
                    maxDiscountValue > 0
                        ? Math.min(discountAmount, maxDiscountValue)
                        : discountAmount;
            } else if (discountType === 'fixed') {
                totalDiscount += Math.min(discountValue, filteredTotalPrice);
            }
        }

        return totalDiscount;
    }, [selectedVouchers, filteredTotalPrice, shippingCost]);

    const handleSelectVoucher = useCallback((voucher) => {
        setSelectedVouchers((prev) => {
            const voucherType = voucher.isFreeShipping
                ? 'freeShipping'
                : 'regular';

            // Create a new vouchers object first
            const newVouchers = { ...prev };

            // If clicking the same voucher, deselect it
            if (prev[voucherType]?.id === voucher.id) {
                newVouchers[voucherType] = null;
                toast.success('Đã bỏ chọn mã giảm giá');
                return newVouchers;
            }

            // Otherwise, select the new voucher
            newVouchers[voucherType] = voucher;

            // Show success message
            if (voucher.isFreeShipping) {
                toast.success('Áp dụng mã miễn phí vận chuyển thành công!');
            } else if (voucher.discountType === 'percentage') {
                toast.success(
                    `Áp dụng giảm giá ${voucher.discount}% thành công!`
                );
            } else if (voucher.discountType === 'fixed') {
                toast.success(
                    `Áp dụng giảm giá ${DisplayPriceInVND(
                        voucher.discount || 0
                    )} thành công!`
                );
            }

            setShowVouchers(false);
            return newVouchers;
        });
    }, []);

    const removeVoucher = useCallback((voucherType) => {
        setSelectedVouchers((prev) => ({
            ...prev,
            [voucherType]: null,
        }));
        toast.success('Đã xóa mã giảm giá');
    }, []);

    const voucherDiscount = calculateVoucherDiscount();
    const pointsDiscount = usePoints ? pointsToUse * pointsValue : 0;
    const finalTotal = Math.max(
        0,
        filteredTotalPrice - pointsDiscount - voucherDiscount
    );

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
                data: { _id: id },
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
            const maxPointsAllowed = Math.floor(filteredTotalPrice / 2 / 100);
            const actualPointsToUse = usePoints
                ? Math.min(pointsToUse, maxPointsAllowed)
                : 0;

            setLoading(true);
            // Format product data to ensure it's serializable
            const formattedItems = filteredItems.map((item) => ({
                ...item,
                productId: {
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    discount: item.productId.discount || 0,
                    // Ensure image is a single URL string, not an object or array
                    image: Array.isArray(item.productId.image)
                        ? item.productId.image[0]
                        : typeof item.productId.image === 'string'
                        ? item.productId.image
                        : '',
                    category: item.productId.category,
                },
                quantity: item.quantity,
            }));

            const response = await Axios({
                ...SummaryApi.cash_on_delivery_order,
                data: {
                    list_items: formattedItems,
                    addressId: addressList[selectAddress]?._id,
                    subTotalAmt: filteredTotalPrice,
                    totalAmt: finalTotal,
                    pointsToUse: actualPointsToUse,
                    voucherCode: selectedVouchers.regular?.code || '',
                    freeShippingVoucherCode:
                        selectedVouchers.freeShipping?.code || '',
                },
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
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
                    }
                } catch (error) {
                    console.error('Error fetching user points:', error);
                }
                navigate('/success', { state: { text: 'Order' } });
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
            const maxPointsAllowed = Math.floor(filteredTotalPrice / 2 / 100);
            const actualPointsToUse = usePoints
                ? Math.min(pointsToUse, maxPointsAllowed, userPoints)
                : 0;

            if (usePoints && pointsToUse > 0 && pointsToUse > userPoints) {
                toast.error('Số điểm sử dụng vượt quá số điểm hiện có');
                return;
            }

            setLoading(true);
            // Format product data to ensure it's serializable
            const formattedItems = filteredItems.map((item) => ({
                ...item,
                productId: {
                    _id: item.productId._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    discount: item.productId.discount || 0,
                    // Ensure image is a single URL string, not an object or array
                    image: Array.isArray(item.productId.image)
                        ? item.productId.image[0]
                        : typeof item.productId.image === 'string'
                        ? item.productId.image
                        : '',
                    category: item.productId.category,
                },
                quantity: item.quantity,
            }));

            // Convert amounts to integers (VND doesn't use decimals)
            const amountInVND = Math.round(finalTotal);

            // Validate amount is within Stripe's limits
            if (amountInVND > 99999999) {
                // 99,999,999 VND is Stripe's max
                throw new Error(
                    'Số tiền thanh toán vượt quá giới hạn cho phép (99,999,999 VND)'
                );
            }
            if (amountInVND < 1000) {
                // Minimum amount in VND
                throw new Error('Số tiền thanh toán tối thiểu là 1,000 VND');
            }

            const response = await Axios({
                ...SummaryApi.payment_url,
                data: {
                    list_items: formattedItems,
                    addressId: addressList[selectAddress]?._id,
                    subTotalAmt: filteredTotalPrice,
                    totalAmt: amountInVND, // Send the rounded amount
                    pointsToUse: actualPointsToUse,
                    voucherCode: selectedVouchers.regular?.code || '',
                    freeShippingVoucherCode:
                        selectedVouchers.freeShipping?.code || '',
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

    const hasValidAddress =
        addressList.length > 0 && addressList[selectAddress];

    return (
        <section className="container mx-auto bg-base-100 min-h-[80vh] px-2 py-6">
            <div
                className="px-4 pt-4 pb-3 lg:p-3 mb-3 bg-primary-4 rounded-md shadow-md shadow-secondary-100
                font-bold text-secondary-200 sm:text-lg text-[13px] uppercase"
            >
                Thanh toán
            </div>
            <div className="h-full flex flex-col lg:flex-row w-full gap-5 bg-white shadow rounded-lg sm:p-5 p-2">
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
                <div className="w-full  bg-white flex flex-col gap-3 shadow-md px-2 pt-2 pb-4">
                    <h3 className="sm:text-lg text-sm font-bold shadow-md px-2 py-3">
                        Đơn hàng
                    </h3>
                    <div className="bg-white sm:px-4 px-1 grid gap-3">
                        <div>
                            <h3 className="font-semibold sm:text-lg text-sm text-red-darker py-2">
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
                                    <p className="flex sm:flex-row flex-col items-center sm:gap-2 gap-[1px]">
                                        {hasDiscount > 0 && (
                                            <span className="line-through text-neutral-400">
                                                {DisplayPriceInVND(
                                                    filteredNotDiscountTotalPrice
                                                )}
                                            </span>
                                        )}
                                        <span className="text-red-darker font-bold">
                                            {DisplayPriceInVND(
                                                filteredTotalPrice -
                                                    shippingCost
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
                                    <div className="flex items-center gap-2">
                                        {selectedVouchers?.freeShipping ? (
                                            <div className="flex items-center">
                                                <span className="line-through text-gray-400 mr-2">
                                                    {DisplayPriceInVND(
                                                        shippingCost
                                                    )}
                                                </span>
                                                <span className="text-green-600 font-medium">
                                                    Miễn phí
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="italic">
                                                {DisplayPriceInVND(
                                                    shippingCost
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                {/* Voucher Section */}
                                <div className="border-t border-gray-200 pt-4 mt-2 flex flex-col gap-2">
                                    {/* Voucher Code Input */}
                                    <div className="">
                                        <div className="flex gap-2 py-1">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    placeholder="Nhập mã giảm giá"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm text-xs focus:outline-none focus:ring-2
                                                    focus:ring-blue-500 focus:border-blue-500 h-8"
                                                    value={voucherCode}
                                                    onChange={(e) =>
                                                        setVoucherCode(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                {voucherCode && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setVoucherCode('');
                                                            setVoucherError('');
                                                        }}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M6 18L18 6M6 6l12 12"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleApplyVoucher}
                                                className="px-3 h-8 bg-blue-500 text-white sm:text-sm text-xs font-medium rounded-md hover:bg-blue-600
                                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
                                            >
                                                Áp dụng
                                            </button>
                                        </div>
                                        {voucherError && (
                                            <p className="text-red-500 text-xs font-semibold px-[2px] pt-2">
                                                {voucherError}
                                            </p>
                                        )}
                                    </div>
                                    {/* Free Shipping Voucher */}
                                    {selectedVouchers.freeShipping && (
                                        <div
                                            title={
                                                selectedVouchers.freeShipping
                                                    .description
                                            }
                                            className="p-3 rounded-md border bg-blue-50 border-blue-200 sm:text-sm text-[10px]"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 select-none">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-blue-700">
                                                            {
                                                                selectedVouchers
                                                                    .freeShipping
                                                                    .code
                                                            }
                                                        </p>
                                                        <span
                                                            className="inline-flex items-center px-2 sm:py-0.5 py-[1px] rounded sm:text-sm text-[9px] font-semibold
                                                    bg-blue-100 text-blue-800"
                                                        >
                                                            Freeship
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-gray-600 font-semibold">
                                                        {
                                                            selectedVouchers
                                                                .freeShipping
                                                                .name
                                                        }
                                                    </p>
                                                    <div className="mt-1">
                                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                                                            <svg
                                                                className="mr-1.5 h-3 w-3 mb-[2px]"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                            Miễn phí vận chuyển
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        removeVoucher(
                                                            'freeShipping'
                                                        )
                                                    }
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="sm:h-5 sm:w-5 h-[14px] w-[14px]"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Regular Voucher */}
                                    {selectedVouchers.regular && (
                                        <div className="mb-2 p-3 rounded-md border bg-pink-100 border-pink-300 sm:text-sm text-[10px]">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-pink-700">
                                                            {
                                                                selectedVouchers
                                                                    .regular
                                                                    .code
                                                            }
                                                        </p>
                                                    </div>
                                                    <p className="mt-1 text-gray-600 font-semibold">
                                                        {
                                                            selectedVouchers
                                                                .regular.name
                                                        }
                                                    </p>
                                                    <div className="mt-1">
                                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-pink-200 text-pink-800">
                                                            <svg
                                                                className="mr-1.5 h-3 w-3 mb-[2px]"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                            {selectedVouchers
                                                                .regular
                                                                .discountType ===
                                                            'percentage'
                                                                ? `Giảm ${selectedVouchers.regular.discount}%`
                                                                : `Giảm ${DisplayPriceInVND(
                                                                      selectedVouchers
                                                                          .regular
                                                                          .discount
                                                                  )}`}
                                                            {selectedVouchers
                                                                .regular
                                                                .maxDiscount >
                                                                0 &&
                                                                ` (tối đa ${DisplayPriceInVND(
                                                                    selectedVouchers
                                                                        .regular
                                                                        .maxDiscount
                                                                )})`}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        removeVoucher('regular')
                                                    }
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="sm:h-5 sm:w-5 h-[14px] w-[14px]"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Show voucher selection button if not both vouchers are selected */}
                                    {!selectedVouchers.freeShipping ||
                                    !selectedVouchers.regular ? (
                                        <div
                                            className="flex items-center justify-between cursor-pointer"
                                            onClick={() =>
                                                setShowVouchers(!showVouchers)
                                            }
                                        >
                                            <div className="flex items-center gap-2 text-sm py-4">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 text-green-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 5v2m0 4v2m0 4v2m5-11h2m0 4h-2m0 4h-2m-6 2a1 1 0 11-2 0 1 1 0 012 0zM7 7a1 1 0 11-2 0 1 1 0 012 0z"
                                                    />
                                                </svg>
                                                <p className="flex items-center gap-1 sm:text-sm text-xs font-semibold">
                                                    Chọn hoặc nhập mã giảm giá
                                                </p>
                                                {availableVouchers.active
                                                    ?.length > 0 && (
                                                    <div className="flex gap-1">
                                                        {availableVouchers
                                                            .active?.length >
                                                            0 && (
                                                            <span className="sm:text-xs text-[10px] bg-green-100 text-green-800 px-1.5 sm:py-0.5 rounded-full">
                                                                {
                                                                    availableVouchers
                                                                        .active
                                                                        .length
                                                                }{' '}
                                                                mã khả dụng
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className={`transition-transform ${
                                                    showVouchers
                                                        ? 'rotate-180'
                                                        : ''
                                                }`}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 text-secondary-200 mb-1"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                {showVouchers && (
                                    <div className="space-y-4 max-h-96 overflow-y-auto sm:p-2">
                                        {loadingVouchers ? (
                                            <div className="flex justify-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6 sm:text-sm text-xs">
                                                {/* Active Vouchers */}
                                                {availableVouchers.active
                                                    ?.length > 0 && (
                                                    <div>
                                                        <p className="font-bold text-green-700 mb-2">
                                                            Mã khả dụng (
                                                            {
                                                                availableVouchers
                                                                    .active
                                                                    .length
                                                            }
                                                            )
                                                        </p>

                                                        <div className="flex flex-col gap-4">
                                                            {/* Free Shipping Vouchers */}
                                                            {availableVouchers.active.filter(
                                                                (v) =>
                                                                    v.isFreeShipping
                                                            ).length > 0 && (
                                                                <div className="flex flex-col">
                                                                    <p className="font-medium text-blue-700 mb-2">
                                                                        <i className="fas fa-shipping-fast mr-3"></i>
                                                                        Mã miễn
                                                                        phí vận
                                                                        chuyển (
                                                                        {
                                                                            availableVouchers.active.filter(
                                                                                (
                                                                                    v
                                                                                ) =>
                                                                                    v.isFreeShipping
                                                                            )
                                                                                .length
                                                                        }
                                                                        )
                                                                    </p>
                                                                    <div className="space-y-2 pl-2 border-l-[3px] border-blue-200">
                                                                        {availableVouchers.active
                                                                            .filter(
                                                                                (
                                                                                    voucher
                                                                                ) =>
                                                                                    voucher.isFreeShipping
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
                                                                                            (
                                                                                                voucher.isFreeShipping
                                                                                                    ? selectedVouchers
                                                                                                          .freeShipping
                                                                                                          ?.id ===
                                                                                                      voucher.id
                                                                                                    : selectedVouchers
                                                                                                          .regular
                                                                                                          ?.id ===
                                                                                                      voucher.id
                                                                                            )
                                                                                                ? 'border-blue-700 bg-blue-50'
                                                                                                : 'border-gray-200 hover:border-blue-300'
                                                                                        }`}
                                                                                        onClick={() =>
                                                                                            handleSelectVoucher(
                                                                                                voucher
                                                                                            )
                                                                                        }
                                                                                        title={
                                                                                            voucher.description
                                                                                        }
                                                                                    >
                                                                                        <div className="grid grid-flow-col grid-cols-[2fr_1fr] justify-between sm:text-sm text-[10px]">
                                                                                            <div className="w-full">
                                                                                                <div className="font-bold text-blue-700">
                                                                                                    {
                                                                                                        voucher.code
                                                                                                    }
                                                                                                </div>
                                                                                                <p className="text-gray-600">
                                                                                                    {
                                                                                                        voucher.name
                                                                                                    }
                                                                                                </p>
                                                                                                <div className="text-gray-500">
                                                                                                    <p className="flex gap-1">
                                                                                                        Đơn
                                                                                                        tối
                                                                                                        thiểu:{' '}
                                                                                                        <p className="font-medium text-blue-400">
                                                                                                            {DisplayPriceInVND(
                                                                                                                voucher.minOrder ||
                                                                                                                    voucher.minOrderValue ||
                                                                                                                    0
                                                                                                            )}
                                                                                                        </p>
                                                                                                    </p>
                                                                                                    <div className="flex items-center gap-1">
                                                                                                        <svg
                                                                                                            className="w-3 h-3 mb-[2px]"
                                                                                                            fill="none"
                                                                                                            stroke="currentColor"
                                                                                                            viewBox="0 0 24 24"
                                                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                                                        >
                                                                                                            <path
                                                                                                                strokeLinecap="round"
                                                                                                                strokeLinejoin="round"
                                                                                                                strokeWidth={
                                                                                                                    2
                                                                                                                }
                                                                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                                            />
                                                                                                        </svg>
                                                                                                        <span>
                                                                                                            HSD:{' '}
                                                                                                            {
                                                                                                                voucher.expiryDate
                                                                                                            }
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="text-right">
                                                                                                <span className="text-blue-600 font-semibold sm:text-sm text-[9px]">
                                                                                                    Miễn
                                                                                                    phí
                                                                                                    vận
                                                                                                    chuyển
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Regular Vouchers */}
                                                            {availableVouchers.active.filter(
                                                                (v) =>
                                                                    !v.isFreeShipping
                                                            ).length > 0 && (
                                                                <div>
                                                                    <p className="font-medium text-pink-600 mb-2">
                                                                        <i className="fas fa-tag mr-3"></i>
                                                                        Mã giảm
                                                                        giá (
                                                                        {
                                                                            availableVouchers.active.filter(
                                                                                (
                                                                                    v
                                                                                ) =>
                                                                                    !v.isFreeShipping
                                                                            )
                                                                                .length
                                                                        }
                                                                        )
                                                                    </p>
                                                                    <div className="space-y-2 pl-2 border-l-[3px] border-pink-200">
                                                                        {availableVouchers.active
                                                                            .filter(
                                                                                (
                                                                                    voucher
                                                                                ) =>
                                                                                    !voucher.isFreeShipping
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
                                                                                            (
                                                                                                voucher.isFreeShipping
                                                                                                    ? selectedVouchers
                                                                                                          .freeShipping
                                                                                                          ?.id ===
                                                                                                      voucher.id
                                                                                                    : selectedVouchers
                                                                                                          .regular
                                                                                                          ?.id ===
                                                                                                      voucher.id
                                                                                            )
                                                                                                ? 'border-pink-500 bg-pink-50'
                                                                                                : 'border-gray-200 hover:border-pink-300'
                                                                                        }`}
                                                                                        onClick={() =>
                                                                                            handleSelectVoucher(
                                                                                                voucher
                                                                                            )
                                                                                        }
                                                                                        title={
                                                                                            voucher.description
                                                                                        }
                                                                                    >
                                                                                        <div className="flex justify-between items-start sm:text-sm text-[10px]">
                                                                                            <div>
                                                                                                <div className="font-bold text-pink-700">
                                                                                                    {
                                                                                                        voucher.code
                                                                                                    }
                                                                                                </div>
                                                                                                <p className="text-gray-600">
                                                                                                    {
                                                                                                        voucher.name
                                                                                                    }
                                                                                                </p>
                                                                                                <div className="text-gray-500">
                                                                                                    <p className="flex gap-1">
                                                                                                        Đơn
                                                                                                        tối
                                                                                                        thiểu:{' '}
                                                                                                        <p className="font-medium text-pink-500">
                                                                                                            {DisplayPriceInVND(
                                                                                                                voucher.minOrder ||
                                                                                                                    voucher.minOrderValue ||
                                                                                                                    0
                                                                                                            )}
                                                                                                        </p>
                                                                                                    </p>
                                                                                                    <div className="flex items-center gap-1">
                                                                                                        <svg
                                                                                                            className="w-3 h-3 mb-[2px]"
                                                                                                            fill="none"
                                                                                                            stroke="currentColor"
                                                                                                            viewBox="0 0 24 24"
                                                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                                                        >
                                                                                                            <path
                                                                                                                strokeLinecap="round"
                                                                                                                strokeLinejoin="round"
                                                                                                                strokeWidth={
                                                                                                                    2
                                                                                                                }
                                                                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                                            />
                                                                                                        </svg>
                                                                                                        <span>
                                                                                                            HSD:{' '}
                                                                                                            {
                                                                                                                voucher.expiryDate
                                                                                                            }
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="text-right sm:text-sm text-[9px]">
                                                                                                <span className="text-pink-600 font-semibold">
                                                                                                    {voucher.discountType ===
                                                                                                    'percentage'
                                                                                                        ? `Giảm ${voucher.discount}%`
                                                                                                        : `Giảm ${DisplayPriceInVND(
                                                                                                              voucher.discount
                                                                                                          )}`}
                                                                                                </span>
                                                                                                {voucher.maxDiscount && (
                                                                                                    <p className="text-pink-400 font-medium">
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
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Upcoming Vouchers */}
                                                <div className="sm:text-sm text-xs">
                                                    {availableVouchers.upcoming
                                                        .length > 0 && (
                                                        <p className="font-bold text-secondary-200 mt-6 mb-2">
                                                            Mã sắp diễn ra (
                                                            {
                                                                availableVouchers
                                                                    .upcoming
                                                                    .length
                                                            }
                                                            )
                                                        </p>
                                                    )}
                                                    <div className="flex flex-col gap-4">
                                                        {availableVouchers.upcoming.filter(
                                                            (v) =>
                                                                v.isUpcoming &&
                                                                v.isFreeShipping
                                                        ).length > 0 && (
                                                            <div>
                                                                <p className="font-medium text-blue-700 mb-2">
                                                                    <i className="fas fa-shipping-fast mr-3"></i>
                                                                    Mã miễn phí
                                                                    vận chuyển (
                                                                    {
                                                                        availableVouchers.upcoming.filter(
                                                                            (
                                                                                v
                                                                            ) =>
                                                                                v.isUpcoming &&
                                                                                v.isFreeShipping
                                                                        ).length
                                                                    }
                                                                    )
                                                                </p>
                                                                <div className="space-y-2 pl-2 border-l-[3px] border-blue-200">
                                                                    {availableVouchers.upcoming
                                                                        .filter(
                                                                            (
                                                                                voucher
                                                                            ) =>
                                                                                voucher.isUpcoming &&
                                                                                voucher.isFreeShipping
                                                                        )
                                                                        .map(
                                                                            (
                                                                                voucher
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        voucher.id
                                                                                    }
                                                                                    className="p-3 border border-blue-200 rounded-lg bg-blue-50 opacity-75 cursor-not-allowed"
                                                                                >
                                                                                    <div className="sm:text-sm text-[10px]">
                                                                                        <div className="">
                                                                                            <div className="grid grid-flow-col grid-cols-[2fr_1fr] justify-between">
                                                                                                <div className="flex sm:items-center items-start sm:flex-row flex-col-reverse sm:gap-2 gap-0">
                                                                                                    <span className="font-bold text-blue-500">
                                                                                                        {
                                                                                                            voucher.code
                                                                                                        }
                                                                                                    </span>
                                                                                                    <span className="text-[8px] sm:text-xs font-semibold bg-blue-100 text-blue-700 sm:px-2 px-1 sm:py-0.5 rounded">
                                                                                                        Sắp
                                                                                                        diễn
                                                                                                        ra
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div className="text-blue-700 text-right">
                                                                                                    <div className="font-semibold sm:text-sm text-[9px]">
                                                                                                        Miễn
                                                                                                        phí
                                                                                                        vận
                                                                                                        chuyển
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <p className="text-gray-600">
                                                                                                {
                                                                                                    voucher.name
                                                                                                }
                                                                                            </p>
                                                                                            <div className=" text-gray-500">
                                                                                                <p className="flex gap-1">
                                                                                                    Đơn
                                                                                                    tối
                                                                                                    thiểu:{' '}
                                                                                                    <p className="text-blue-500 font-semibold">
                                                                                                        {DisplayPriceInVND(
                                                                                                            voucher.minOrder ||
                                                                                                                voucher.minOrderValue ||
                                                                                                                0
                                                                                                        )}
                                                                                                    </p>
                                                                                                </p>
                                                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                                                    <svg
                                                                                                        className="w-3 h-3 mb-[2px]"
                                                                                                        fill="none"
                                                                                                        stroke="currentColor"
                                                                                                        viewBox="0 0 24 24"
                                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                                    >
                                                                                                        <path
                                                                                                            strokeLinecap="round"
                                                                                                            strokeLinejoin="round"
                                                                                                            strokeWidth={
                                                                                                                2
                                                                                                            }
                                                                                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                                        />
                                                                                                    </svg>
                                                                                                    <span>
                                                                                                        Bắt
                                                                                                        đầu
                                                                                                        từ:{' '}
                                                                                                        {
                                                                                                            voucher.startDate
                                                                                                        }
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {availableVouchers.upcoming.filter(
                                                            (v) =>
                                                                v.isUpcoming &&
                                                                !v.isFreeShipping
                                                        ).length > 0 && (
                                                            <div className="">
                                                                <p className="font-medium text-pink-600 mb-2">
                                                                    <i className="fas fa-tag mr-3"></i>
                                                                    Mã giảm giá
                                                                    (
                                                                    {
                                                                        availableVouchers.upcoming.filter(
                                                                            (
                                                                                v
                                                                            ) =>
                                                                                v.isUpcoming &&
                                                                                !v.isFreeShipping
                                                                        ).length
                                                                    }
                                                                    )
                                                                </p>
                                                                <div className="space-y-2 pl-2 border-l-[3px] border-pink-200">
                                                                    {availableVouchers.upcoming
                                                                        .filter(
                                                                            (
                                                                                voucher
                                                                            ) =>
                                                                                voucher.isUpcoming &&
                                                                                !voucher.isFreeShipping
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
                                                                                    <div className="sm:text-sm text-[10px]">
                                                                                        <div className="grid grid-flow-col grid-cols-[2fr_1fr] justify-between">
                                                                                            <div className="flex sm:items-center items-start sm:flex-row flex-col-reverse sm:gap-2 gap-0">
                                                                                                <span className="font-bold text-pink-700">
                                                                                                    {
                                                                                                        voucher.code
                                                                                                    }
                                                                                                </span>
                                                                                                <span className="text-[8px] sm:text-xs font-semibold bg-pink-100 text-pink-700 sm:px-2 px-1 sm:py-0.5 rounded">
                                                                                                    Sắp
                                                                                                    diễn
                                                                                                    ra
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="text-pink-700 sm:text-sm text-[9px] flex flex-col items-end w-full">
                                                                                                <div className="text-pink-600 font-semibold">
                                                                                                    {voucher.discountType ===
                                                                                                    'percentage'
                                                                                                        ? `Giảm ${voucher.discount}%`
                                                                                                        : `Giảm ${DisplayPriceInVND(
                                                                                                              voucher.discount
                                                                                                          )}`}
                                                                                                </div>
                                                                                                {voucher.maxDiscount && (
                                                                                                    <p className="text-pink-400 font-medium">
                                                                                                        Tối
                                                                                                        đa{' '}
                                                                                                        {DisplayPriceInVND(
                                                                                                            voucher.maxDiscount
                                                                                                        )}
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        <p className="text-gray-600">
                                                                                            {
                                                                                                voucher.name
                                                                                            }
                                                                                        </p>
                                                                                        <div className="text-gray-500">
                                                                                            <p className="flex gap-1">
                                                                                                Đơn
                                                                                                tối
                                                                                                thiểu:{' '}
                                                                                                <p className="font-medium text-pink-500">
                                                                                                    {DisplayPriceInVND(
                                                                                                        voucher.minOrder ||
                                                                                                            voucher.minOrderValue ||
                                                                                                            0
                                                                                                    )}
                                                                                                </p>
                                                                                            </p>
                                                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                                                <svg
                                                                                                    className="w-3 h-3 mb-[2px]"
                                                                                                    fill="none"
                                                                                                    stroke="currentColor"
                                                                                                    viewBox="0 0 24 24"
                                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                                >
                                                                                                    <path
                                                                                                        strokeLinecap="round"
                                                                                                        strokeLinejoin="round"
                                                                                                        strokeWidth={
                                                                                                            2
                                                                                                        }
                                                                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                                    />
                                                                                                </svg>
                                                                                                <span>
                                                                                                    Bắt
                                                                                                    đầu
                                                                                                    từ:{' '}
                                                                                                    {
                                                                                                        voucher.startDate
                                                                                                    }
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
                                                </div>
                                            </div>
                                        )}

                                        {/* No Vouchers Message */}
                                        {availableVouchers.active?.length ===
                                            0 &&
                                            availableVouchers.upcoming
                                                ?.length === 0 && (
                                                <p className="text-sm text-gray-500 text-center py-4">
                                                    Không có mã giảm giá khả
                                                    dụng
                                                </p>
                                            )}
                                    </div>
                                )}
                                {userPoints > 0 && (
                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="flex sm:items-center sm:flex-row flex-col gap-3 justify-between">
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
                                                    className="sm:h-4 sm:w-4 w-3 h-3 rounded border-gray-300 text-primary-2 focus:ring-primary-2 cursor-pointer"
                                                />
                                                <label
                                                    htmlFor="usePoints"
                                                    className="sm:text-sm font-medium text-gray-700 px-2 cursor-pointer hover:opacity-80"
                                                >
                                                    Sử dụng điểm thưởng
                                                </label>
                                            </div>
                                            <div className="sm:text-sm text-xs text-gray-600 flex flex-col sm:items-end gap-1 select-none">
                                                <p className="flex gap-1">
                                                    Có sẵn:{' '}
                                                    <p className="font-bold text-green-700">
                                                        {userPoints.toLocaleString()}
                                                    </p>
                                                    điểm (
                                                    <p className="font-bold text-green-700">
                                                        ~ {DisplayPriceInVND(
                                                            userPoints *
                                                                pointsValue
                                                        )}
                                                    </p>
                                                    )
                                                </p>
                                                <p className="text-xs italic text-gray-500">
                                                    Bạn chỉ được dùng tối đa 50%
                                                    giá trị đơn hàng
                                                </p>
                                            </div>
                                        </div>
                                        {usePoints && (
                                            <div className="pt-3 sm:text-sm text-xs">
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
                                                <div className="flex items-center sm:justify-normal justify-between py-1 gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            value={
                                                                pointsToUse ===
                                                                0
                                                                    ? ''
                                                                    : pointsToUse
                                                            }
                                                            onChange={(e) => {
                                                                const rawValue =
                                                                    e.target
                                                                        .value;
                                                                if (
                                                                    rawValue ===
                                                                    ''
                                                                ) {
                                                                    setPointsToUse(
                                                                        0
                                                                    );
                                                                    return;
                                                                }
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
                                                            className="sm:w-24 w-20 px-2 py-1 border border-gray-300 rounded text-right text-secondary-200 font-medium"
                                                            aria-label="Số điểm sử dụng"
                                                            placeholder="0"
                                                        />
                                                        <span className="flex gap-1">
                                                            điểm (tối đa:{' '}
                                                            <p className="font-semibold">
                                                                {maxPointsToUse.toLocaleString()}
                                                            </p>
                                                            )
                                                        </span>
                                                    </div>
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
                                                        className={`px-2 py-1 font-semibold rounded ${
                                                            pointsToUse ===
                                                            maxPointsToUse
                                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                        }`}
                                                    >
                                                        Dùng tối đa
                                                    </button>
                                                </div>
                                                <div className="mt-[6px] font-semibold text-gray-500 flex gap-1">
                                                    Giảm:{' '}
                                                    <p className="text-secondary-200">
                                                        {DisplayPriceInVND(
                                                            pointsToUse *
                                                                pointsValue
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Divider />
                            <div className="flex justify-between sm:text-sm text-xs text-gray-600">
                                <p>Tạm tính:</p>
                                <p>{DisplayPriceInVND(filteredTotalPrice)}</p>
                            </div>

                            <div className="flex justify-between sm:text-sm text-xs text-gray-600">
                                <p>Phí vận chuyển:</p>
                                {selectedVouchers?.freeShipping ? (
                                    <div className="flex items-center">
                                        <span className="line-through text-gray-400 mr-2">
                                            {DisplayPriceInVND(shippingCost)}
                                        </span>
                                        <span className="text-green-600 font-semibold">
                                            Miễn phí
                                        </span>
                                    </div>
                                ) : (
                                    <p>{DisplayPriceInVND(shippingCost)}</p>
                                )}
                            </div>
                            {selectedVouchers && voucherDiscount > 0 && (
                                <div className="flex justify-between sm:text-sm text-xs">
                                    <p className="text-gray-600">Giảm giá:</p>
                                    <p className="text-green-600 font-semibold">
                                        -{DisplayPriceInVND(voucherDiscount)}
                                    </p>
                                </div>
                            )}

                            {usePoints && pointsToUse > 0 && (
                                <div className="flex justify-between sm:text-sm text-xs">
                                    <p className="text-gray-600 flex">
                                        Điểm tích lũy (
                                        <p className="font-semibold text-secondary-200 pr-1">
                                            {pointsToUse}
                                        </p>
                                        điểm):
                                    </p>
                                    <p className="text-blue-600 font-semibold">
                                        -
                                        {DisplayPriceInVND(
                                            pointsToUse * pointsValue
                                        )}
                                    </p>
                                </div>
                            )}
                            <div className="font-semibold flex items-center justify-between gap-4 border-t border-gray-200 pt-2 mt-2">
                                <p className="font-bold">Tổng cộng:</p>
                                <p className="text-secondary-200 font-bold sm:text-lg text-base">
                                    {DisplayPriceInVND(finalTotal)}
                                </p>
                            </div>
                        </div>

                        <div className="w-full flex flex-col gap-4 sm:text-sm text-xs">
                            {usePoints && pointsToUse > 0 && (
                                <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                    <p className="text-blue-700 flex">
                                        Sử dụng{' '}
                                        <span className="font-bold px-1">
                                            {pointsToUse.toLocaleString()}
                                        </span>
                                        điểm cho đơn hàng này.
                                    </p>
                                    <p className="text-green-700 mt-1 flex gap-1">
                                        Điểm còn lại:
                                        <p className="font-bold">
                                            {(
                                                userPoints - pointsToUse
                                            ).toLocaleString()}
                                        </p>
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
                                disabled={
                                    loading ||
                                    filteredItems.length === 0 ||
                                    !hasValidAddress
                                }
                            >
                                {loading ? <Loading /> : 'Thanh toán online'}
                            </button>
                            <button
                                className="py-2 px-4 border-[3px] border-red-darker font-semibold text-red-darker hover:bg-red-darker
                        hover:text-white rounded cursor-pointer transition-all"
                                onClick={handleCashOnDelivery}
                                disabled={
                                    loading ||
                                    filteredItems.length === 0 ||
                                    !hasValidAddress
                                }
                            >
                                Thanh toán khi nhận hàng
                            </button>
                        </div>
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
