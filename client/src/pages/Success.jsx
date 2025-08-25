import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalContext } from '../provider/GlobalProvider';
import toast from 'react-hot-toast';

const SuccessPage = () => {
    const { fetchCartItem, fetchOrder, reloadAfterPayment } =
        useGlobalContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoaded, setIsLoaded] = useState(false); // Thêm trạng thái kiểm soát

    useEffect(() => {
        const sessionId = new URLSearchParams(location.search).get(
            'session_id'
        );
        if (sessionId && !isLoaded) {
            reloadAfterPayment(); // Gọi một lần duy nhất
            setIsLoaded(true); // Đánh dấu đã xử lý
            toast.success(
                'Thanh toán thành công! Đơn hàng của bạn đã được cập nhật.',
                {
                    duration: 4000, // Đặt thời gian hiển thị 4 giây
                }
            );
        } else if (!sessionId) {
            navigate('/');
        }
    }, [reloadAfterPayment, navigate, location, isLoaded]); // Thêm isLoaded vào dependency

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <h1 className="text-2xl font-semibold mb-4">
                    Thanh toán thành công!
                </h1>
                <p>Đơn hàng của bạn đã được đặt thành công.</p>
                <button
                    className="mt-4 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={() => navigate('/dashboard/my-orders')}
                >
                    Xem đơn hàng
                </button>
            </div>
        </div>
    );
};

export default SuccessPage;
