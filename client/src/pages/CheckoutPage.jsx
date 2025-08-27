import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import Axios from '../utils/Axios';
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
    const { fetchCartItem, fetchOrder, fetchAddress, reloadAfterPayment } =
        useGlobalContext();
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
                console.log(
                    '💾 Stored selectedProductIds to localStorage:',
                    selectedProductIds
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
            console.log('Payment successful, cleaning up cart...');
            console.log('location.state:', location.state);
            console.log(
                'selectedItems from location.state:',
                location.state?.selectedItems
            );
            console.log('cartItemsList.length:', cartItemsList.length);
            console.log('filteredItems.length:', filteredItems.length);

            // Kiểm tra xem có phải thanh toán một phần không
            const hasSelectedItems =
                location.state?.selectedItems &&
                Array.isArray(location.state.selectedItems);
            const isPartialCheckout =
                hasSelectedItems &&
                location.state.selectedItems.length < cartItemsList.length;

            console.log('hasSelectedItems:', hasSelectedItems);
            console.log('isPartialCheckout:', isPartialCheckout);

            if (isPartialCheckout) {
                // Chỉ xóa các sản phẩm được chọn
                const selectedProductIds = filteredItems.map(
                    (item) => item.productId._id
                );
                console.log(
                    'Partial checkout - Selected product IDs for cleanup:',
                    selectedProductIds
                );

                setTimeout(() => {
                    reloadAfterPayment(selectedProductIds);
                }, 2000);
            } else {
                // Thanh toán toàn bộ - xóa hết cart
                console.log('Full checkout - Clearing entire cart');
                console.log(
                    'Reason: hasSelectedItems =',
                    hasSelectedItems,
                    ', isPartialCheckout =',
                    isPartialCheckout
                );

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
        setShowConfirmModal({ show: true, type: 'cash' });
    };

    const confirmCashOnDelivery = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.cash_on_delivery_order,
                data: {
                    list_items: filteredItems,
                    addressId: addressList[selectAddress]?._id,
                    subTotalAmt: filteredTotalPrice,
                    totalAmt: filteredTotalPrice,
                },
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                if (fetchCartItem) fetchCartItem();
                if (fetchOrder) fetchOrder();
                navigate('/success', { state: { text: 'Order' } });
            }
        } catch (error) {
            toast.error('Đặt hàng thất bại');
        } finally {
            setLoading(false);
            setShowConfirmModal({ show: false, type: '' });
        }
    };

    const handleOnlinePayment = async () => {
        setShowConfirmModal({ show: true, type: 'online' });
    };

    const confirmOnlinePayment = async () => {
        try {
            setLoading(true);
            const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
            const stripePromise = await loadStripe(stripePublicKey);

            console.log('Sending request to /api/order/checkout:', {
                list_items: filteredItems,
                addressId: addressList[selectAddress]?._id,
                subTotalAmt: filteredTotalPrice,
                totalAmt: filteredTotalPrice,
            });

            const response = await Axios({
                ...SummaryApi.payment_url,
                data: {
                    list_items: filteredItems,
                    addressId: addressList[selectAddress]?._id,
                    subTotalAmt: filteredTotalPrice,
                    totalAmt: filteredTotalPrice,
                },
            });

            console.log('Response from /api/order/checkout:', response.data);

            const { data: responseData } = response;
            const { error } = await stripePromise.redirectToCheckout({
                sessionId: responseData.id,
            });

            if (error) {
                toast.error('Thanh toán thất bại: ' + error.message);
            }
            // Không cần else vì redirect xảy ra, code sau không chạy
        } catch (error) {
            console.error('Online Payment Error:', error);
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
                                className={!address.status && 'hidden'}
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
                            </div>
                            <div className="font-semibold flex items-center justify-between gap-4">
                                <p>Tổng cộng</p>
                                <p className="text-secondary-200 font-bold">
                                    {DisplayPriceInVND(filteredTotalPrice)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex flex-col gap-4 py-4 sm:text-base text-xs">
                        <button
                            className="py-2 px-4 bg-primary-2 hover:opacity-80 rounded shadow-md
                        cursor-pointer text-secondary-200 font-semibold"
                            onClick={handleOnlinePayment}
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
                                    showConfirmModal.type === 'cash'
                                        ? confirmCashOnDelivery
                                        : confirmOnlinePayment
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
