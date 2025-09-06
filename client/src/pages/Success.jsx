import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalContext } from '../provider/GlobalProvider';
import toast from 'react-hot-toast';

const SuccessPage = () => {
    const { reloadAfterPayment } = useGlobalContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const sessionId = new URLSearchParams(location.search).get(
            'session_id'
        );
        if (sessionId && !isLoaded) {
            reloadAfterPayment();
            setIsLoaded(true);
            toast.success(
                'Thanh toán thành công! Đơn hàng của bạn đã được cập nhật.',
                {
                    duration: 4000,
                }
            );
        } else if (!sessionId) {
            navigate('/');
        }
    }, [reloadAfterPayment, navigate, location, isLoaded]);

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
