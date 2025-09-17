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
        <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl w-full space-y-8 bg-white sm:p-8 py-8 px-6 rounded-lg shadow-md">
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="bg-green-100 rounded-full p-3">
                            <FaCheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <h2 className="mt-6 sm:text-2xl text-lg font-extrabold text-green-700">
                        Đăng ký thành công!
                    </h2>
                    <div className="mt-4 text-gray-600 sm:text-base text-xs">
                        <p className="flex items-center justify-center gap-2 opacity-90 text-green-700">
                            <FaEnvelope className="text-green-800" />
                            Vui lòng kiểm tra email của bạn
                        </p>
                        <p className="mt-4 font-medium">
                            Chúng tôi đã gửi một liên kết xác nhận đến:
                            <span className="block font-bold text-secondary-200 mt-1">
                                {email}
                            </span>
                        </p>
                        <p className="mt-4 text-gray-700">
                            Vui lòng kiểm tra hộp thư đến và nhấp vào liên kết
                            xác nhận để kích hoạt tài khoản của bạn.
                        </p>
                        <div className="mt-4 p-3 bg-blue-50 rounded-md sm:text-sm text-[10px] text-blue-700">
                            <p className="font-semibold">Lưu ý:</p>
                            <ul className="mt-1 space-y-2 opacity-80">
                                <li>
                                    Kiểm tra thư mục thư rác/spam nếu bạn không
                                    thấy email trong hộp thư đến
                                </li>
                                <li>Liên kết xác nhận sẽ hết hạn sau 24 giờ</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-6 sm:text-sm text-xs">
                    <div className="text-center">
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
                            className="inline-flex justify-center items-center py-2 px-4 border-2 border-secondary-200 rounded-md gap-2
                        shadow-sm font-medium text-secondary-200 bg-primary-100 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-200"
                        >
                            <FaHome className="mb-[1px]" />
                            Về trang chủ
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex justify-center items-center py-2 sm:px-4 px-2 border-2 border-cyan-600 rounded-md gap-2
                        shadow-sm font-medium text-cyan-600 bg-white hover:bg-cyan-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600"
                        >
                            Đi đến đăng nhập
                            <FaArrowRight className="" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrationSuccess;
