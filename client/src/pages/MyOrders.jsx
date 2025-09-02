import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import NoData from '../components/NoData';
import { useGlobalContext } from '../provider/GlobalProvider';
import toast from 'react-hot-toast';
import { DisplayPriceInVND } from '../utils/DisplayPriceInVND';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const orders = useSelector((state) => state.orders.data || []);
    const { fetchOrder } = useGlobalContext();

    const handleBuyAgain = (productId) => {
        navigate(`/product/${productId}`);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const loadOrders = async () => {
            const accessToken = localStorage.getItem('accesstoken');
            if (!accessToken) return;

            try {
                await dispatch(fetchOrder());
            } catch (error) {
                toast.error(
                    'Không thể tải danh sách đơn hàng: ' + error.message
                );
            }
        };
        loadOrders();
    }, [dispatch, fetchOrder]);

    return (
        <div className="">
            <div className="p-4 mb-3 bg-primary-4 rounded-md shadow-md shadow-secondary-100 font-bold text-secondary-200 sm:text-lg text-sm uppercase flex justify-between items-center gap-2">
                <h2 className="text-ellipsis line-clamp-1">Đơn hàng của tôi</h2>
            </div>
            <div className="bg-white p-2 grid gap-4">
                {!orders.length ? (
                    <div className="flex flex-col gap-4 items-center">
                        <NoData />
                        <button
                            onClick={() => navigate('/')}
                            className="bg-primary-4 text-secondary-200 py-2 px-5 rounded-md transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto text-center font-bold shadow-md"
                        >
                            Mua sắm ngay!
                        </button>
                    </div>
                ) : (
                    orders.map((order, index) => (
                        <div
                            key={order._id || index}
                            className="border border-secondary-100 rounded-md px-2 sm:px-4 py-3 hover:bg-base-100 shadow-md flex flex-col gap-3"
                        >
                            <div className="flex md:flex-row flex-col md:gap-2">
                                <p className="font-semibold">Mã đơn hàng:</p>
                                <p className="flex items-center gap-2">
                                    {order?.orderId || 'N/A'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <img
                                    src={
                                        order?.product_details?.image?.[0] ||
                                        '/placeholder.jpg'
                                    }
                                    alt={
                                        order?.product_details?.name ||
                                        'Product Image'
                                    }
                                    className="w-14 h-14 object-cover rounded shadow-md shadow-secondary-100"
                                    onError={(e) => {
                                        e.target.src = '/placeholder.jpg';
                                    }}
                                />
                                <div className="flex flex-col gap-1">
                                    <p className="font-semibold line-clamp-2">
                                        {order?.product_details?.name ||
                                            'Sản phẩm không xác định'}
                                    </p>
                                    <p className="text-sm text-secondary-200 font-bold">
                                        x{order?.quantity || 'Chưa xác định'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Ngày đặt:{' '}
                                        {new Date(
                                            order?.createdAt
                                        ).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 items-center">
                                <p className="font-semibold">Trạng thái:</p>
                                <span
                                    className={`px-2 py-1 rounded-md text-sm font-semibold ${
                                        order?.payment_status ===
                                        'Đã thanh toán'
                                            ? 'bg-green-100 text-green-800'
                                            : order?.payment_status ===
                                              'Thanh toán khi giao hàng'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                >
                                    {order?.payment_status || 'Chưa xác định'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <p className="font-semibold">Tổng tiền:</p>
                                <p className="flex items-center gap-2 text-secondary-200 font-semibold">
                                    {DisplayPriceInVND(order?.totalAmt || 0)}
                                </p>
                            </div>
                            <div className="flex sm:flex-row flex-col items-baseline gap-2">
                                <p className="font-semibold">
                                    Địa chỉ giao hàng:
                                </p>
                                <p className="text-gray-500 text-sm font-medium">
                                    {order?.delivery_address?.city +
                                        ', ' +
                                        order?.delivery_address?.district +
                                        ', ' +
                                        order?.delivery_address?.ward ||
                                        'Chưa xác định'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    handleBuyAgain(order?.productId || '');
                                    scrollToTop();
                                }}
                                className="mt-2 bg-primary-4 text-secondary-200 py-2 px-4 rounded-md transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto text-center font-bold shadow-md"
                            >
                                Mua lại
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyOrders;
