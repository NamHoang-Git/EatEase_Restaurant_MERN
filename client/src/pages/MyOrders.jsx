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
    const orders = useSelector((state) => state.orders.data || []); // Sửa thành state.orders.data
    const { fetchOrder } = useGlobalContext();

    const handleBuyAgain = (productId) => {
        navigate(`/product/${productId}`);
    };

    useEffect(() => {
        // Gọi fetchOrder và xử lý kết quả
        const loadOrders = async () => {
            // Không gọi API nếu user chưa đăng nhập
            const accessToken = localStorage.getItem('accesstoken');
            if (!accessToken) return;

            try {
                await dispatch(fetchOrder()); // redux-thunk sẽ xử lý Promise
            } catch (error) {
                toast.error(
                    'Không thể tải danh sách đơn hàng: ' + error.message
                );
            }
        };
        loadOrders();
    }, [dispatch, fetchOrder]); // Dependency list

    return (
        <div className="">
            <div
                className="p-4 mb-3 bg-primary-4 rounded-md shadow-md shadow-secondary-100
            font-bold text-secondary-200 sm:text-lg text-sm uppercase flex justify-between
            items-center gap-2"
            >
                <h2 className="text-ellipsis line-clamp-1">Đơn hàng của tôi</h2>
            </div>
            <div className="bg-white p-2 grid gap-4">
                {!orders.length ? (
                    <NoData />
                ) : (
                    orders.map((order, index) => (
                        <div
                            key={order._id || index}
                            className="border border-secondary-100 rounded-md px-2 sm:px-4 py-3 hover:bg-base-100
                        shadow-md flex flex-col gap-3"
                        >
                            <div className="flex md:flex-row flex-col md:gap-2">
                                <p className="font-semibold">Order No:</p>
                                <p className="flex items-center gap-2">
                                    {order?.orderId || 'N/A'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <img
                                    src={
                                        order?.product_details?.image?.[0] ||
                                        (Array.isArray(
                                            order?.product_details?.image
                                        )
                                            ? order.product_details.image[0]
                                            : '/placeholder.jpg')
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
                                <p className="font-semibold">
                                    {order?.product_details?.name ||
                                        'Sản phẩm không xác định'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <p className="font-semibold">Trạng thái:</p>
                                <p className="flex items-center gap-2">
                                    {order?.payment_status || 'Chưa xác định'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <p className="font-semibold">Tổng tiền:</p>
                                <p className="flex items-center gap-2 text-secondary-200 font-semibold">
                                    {DisplayPriceInVND(order?.totalAmt || 0)}
                                </p>
                            </div>
                            <button
                                onClick={() =>
                                    handleBuyAgain(order?.productId || '')
                                }
                                className="mt-2 bg-primary-4 text-secondary-200 py-2 px-4 rounded-md
                            transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto text-center
                            font-bold shadow-md"
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
