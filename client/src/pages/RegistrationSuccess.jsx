import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaCheckCircle,
    FaEnvelope,
    FaArrowRight,
    FaHome,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const RegistrationSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    useEffect(() => {
        // Get email from location state or show error and redirect
        if (location.state?.email) {
            setEmail(location.state.email);
        } else {
            toast.error('Không tìm thấy thông tin đăng ký');
            navigate('/register');
        }
    }, [location.state, navigate]);

    if (!email) {
        return null; // or a loading spinner
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="bg-green-100 rounded-full p-3">
                            <FaCheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
                        Đăng ký thành công!
                    </h2>
                    <div className="mt-4 text-gray-600">
                        <p className="flex items-center justify-center">
                            <FaEnvelope className="mr-2" />
                            Vui lòng kiểm tra email của bạn
                        </p>
                        <p className="mt-4 font-medium">
                            Chúng tôi đã gửi một liên kết xác nhận đến:
                            <span className="block font-bold text-indigo-700 mt-1">
                                {email}
                            </span>
                        </p>
                        <p className="mt-4 text-gray-700">
                            Vui lòng kiểm tra hộp thư đến và nhấp vào liên kết
                            xác nhận để kích hoạt tài khoản của bạn.
                        </p>
                        <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                            <p className="font-medium">Lưu ý:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>
                                    Kiểm tra thư mục thư rác/spam nếu bạn không
                                    thấy email trong hộp thư đến
                                </li>
                                <li>Liên kết xác nhận sẽ hết hạn sau 24 giờ</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-6">
                    <div className="text-sm text-center">
                        <p className="text-gray-600">
                            Không nhận được email?
                            <button
                                className="font-medium text-indigo-600 hover:text-indigo-500 ml-1"
                                onClick={() => {
                                    // TODO: Implement resend verification email
                                    alert(
                                        'Chức năng gửi lại email xác nhận sẽ được triển khai sau'
                                    );
                                }}
                            >
                                Gửi lại
                            </button>
                        </p>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <Link
                            to="/"
                            className="inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <FaHome className="mr-2" />
                            Về trang chủ
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Đi đến đăng nhập
                            <FaArrowRight className="ml-2" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrationSuccess;
