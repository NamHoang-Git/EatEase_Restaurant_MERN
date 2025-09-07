import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimesCircle, FaShoppingBag, FaHome } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Cancel = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        toast.error('Thanh toán đã bị hủy', {
            duration: 4000,
            style: {
                background: '#F44336',
                color: '#fff',
            },
        });
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
            },
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
                <div className="bg-red-500 py-6 px-6 text-center">
                    <motion.div
                        className="inline-flex items-center justify-center sm:w-20 sm:h-20 w-16 h-16 bg-white rounded-full mb-4"
                        variants={itemVariants}
                    >
                        <FaTimesCircle className="text-red-500 sm:text-5xl text-4xl" />
                    </motion.div>
                    <motion.h1
                        className="text-xl sm:text-3xl font-bold text-white mb-2"
                        variants={itemVariants}
                    >
                        Đơn Hàng Đã Bị Hủy
                    </motion.h1>
                    <motion.p
                        className="text-red-100 sm:text-lg text-base"
                        variants={itemVariants}
                    >
                        Rất tiếc, đơn hàng của bạn đã bị hủy
                    </motion.p>
                </div>

                {/* Content */}
                <motion.div className="p-6 md:p-8 space-y-6" variants={itemVariants}>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4">
                        <p className="text-gray-700 sm:text-base text-xs">
                            Đơn hàng của bạn đã bị hủy. Nếu đây là sự nhầm lẫn,
                            vui lòng thử lại hoặc liên hệ với bộ phận hỗ trợ của
                            chúng tôi.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors"
                            onClick={() => navigate('/cart')}
                        >
                            <FaShoppingBag className="text-gray-600 text-2xl mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                                Quay lại giỏ hàng
                            </span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                            onClick={() => navigate('/')}
                        >
                            <FaHome className="text-blue-500 text-2xl mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                                Về trang chủ
                            </span>
                        </motion.button>
                    </div>

                    <div className="pt-6 border-t border-gray-200 mt-8">
                        <h3 className="sm:text-lg text-sm font-medium text-gray-900 mb-2">
                            Cần hỗ trợ ?
                        </h3>
                        <div className="space-y-2 sm:text-sm text-xs text-gray-600">
                            <p>
                                Nếu bạn cần hỗ trợ hoặc có bất kỳ câu hỏi nào,
                                vui lòng liên hệ với bộ phận chăm sóc khách hàng
                                của chúng tôi.
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

export default Cancel;
