import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalContext } from '../provider/GlobalProvider';
import {
    FaCheckCircle,
    FaShoppingBag,
    FaHome,
    FaListAlt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const SuccessPage = () => {
    const { reloadAfterPayment } = useGlobalContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoaded, setIsLoaded] = useState(false);
    const [orderId, setOrderId] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');
        const orderId = params.get('order_id');

        if (sessionId && !isLoaded) {
            reloadAfterPayment();
            setIsLoaded(true);
            setOrderId(orderId || '');

            toast.success(
                'Thanh toán thành công! Đơn hàng của bạn đã được cập nhật.',
                {
                    duration: 4000,
                    style: {
                        background: '#4CAF50',
                        color: '#fff',
                    },
                }
            );
        } else if (!sessionId) {
            navigate('/');
        }
    }, [reloadAfterPayment, navigate, location, isLoaded]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: 'beforeChildren',
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 },
        },
    };

    return (
        <div className="min-h-screen bg-gray-50 sm:py-12 py-8 px-4 sm:px-6 lg:px-8">
            <motion.div
                className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <div className="bg-green-500 py-6 px-6 text-center">
                    <motion.div
                        className="inline-flex items-center justify-center sm:w-20 sm:h-20 w-16 h-16 bg-white rounded-full mb-4"
                        variants={itemVariants}
                    >
                        <FaCheckCircle className="text-green-500 sm:text-5xl text-4xl" />
                    </motion.div>
                    <motion.h1
                        className="text-xl sm:text-3xl font-bold text-white mb-2"
                        variants={itemVariants}
                    >
                        Đặt Hàng Thành Công!
                    </motion.h1>
                    <motion.p
                        className="text-green-100 sm:text-lg text-base"
                        variants={itemVariants}
                    >
                        Cảm ơn quý khách đã mua sắm tại cửa hàng chúng tôi
                    </motion.p>
                </div>

                {/* Order Info */}
                <motion.div
                    className="p-6 md:p-8 space-y-6"
                    variants={itemVariants}
                >
                    <div className="bg-green-50 border-l-4 border-green-500 p-4">
                        <p className="text-gray-700 sm:text-base text-xs">
                            Đơn hàng của bạn đã được xác nhận và đang được xử
                            lý.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                            onClick={() => navigate('/dashboard/my-orders')}
                        >
                            <FaListAlt className="text-blue-500 text-2xl mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                                Xem đơn hàng
                            </span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors"
                            onClick={() => navigate('/')}
                        >
                            <FaShoppingBag className="text-purple-500 text-2xl mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                                Tiếp tục mua sắm
                            </span>
                        </motion.button>
                    </div>

                    <div className="pt-6 border-t border-gray-200 mt-8">
                        <h3 className="sm:text-lg text-sm font-medium text-gray-900 mb-2">
                            Cần hỗ trợ ?
                        </h3>
                        <div className="space-y-2 sm:text-sm text-xs text-gray-600">
                            <p>
                                Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ
                                với bộ phận chăm sóc khách hàng của chúng tôi.
                            </p>
                            <p>Email: support@example.com</p>
                            <p>Hotline: 1900 12345</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SuccessPage;
