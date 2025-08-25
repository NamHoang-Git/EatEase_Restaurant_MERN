import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import NoData from '../components/NoData';
import { useGlobalContext } from '../provider/GlobalProvider';
import toast from 'react-hot-toast';

const MyOrders = () => {
    const dispatch = useDispatch();
    const orders = useSelector((state) => state.orders.data || []); // Sửa thành state.orders.data
    const { fetchOrder } = useGlobalContext();

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
        <div className="p-4">
            <div className="bg-white shadow-md p-3 font-semibold mb-4">
                <h1>Đơn hàng của tôi</h1>
            </div>
            {!orders.length ? (
                <NoData />
            ) : (
                orders.map((order, index) => (
                    <div
                        key={order._id || index} // Sử dụng _id nếu có, nếu không dùng index
                        className="border rounded p-4 mb-2 text-sm"
                    >
                        <p>Order No: {order?.orderId || 'N/A'}</p>
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
                                className="w-14 h-14 object-cover rounded"
                                onError={(e) => {
                                    e.target.src = '/placeholder.jpg';
                                }}
                            />
                            <p className="font-medium">
                                {order?.product_details?.name ||
                                    'Sản phẩm không xác định'}
                            </p>
                        </div>
                        <p>
                            Trạng thái:{' '}
                            {order?.payment_status || 'Chưa xác định'}
                        </p>
                        <p>Tổng tiền: {order?.totalAmt || 0} VND</p>
                    </div>
                ))
            )}
        </div>
    );
};

export default MyOrders;
