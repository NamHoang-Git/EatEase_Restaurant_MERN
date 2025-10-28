import { useEffect, useState, FC } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaCheckCircle,
    FaEnvelope,
    FaArrowRight,
    FaHome,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import GlareHover from '../GlareHover';

interface LocationState {
    email?: string;
}

const RegistrationSuccessForm: FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState<string>('');

    useEffect(() => {
        const state = location.state as LocationState | null;
        if (state?.email) {
            setEmail(state.email);
        } else {
            toast.error('Không tìm thấy thông tin đăng ký');
            navigate('/register');
        }
    }, [location.state, navigate]);

    if (!email) {
        return null;
    }

    return (
        <div className="flex items-center justify-center text-sm text-red-950 font-bold">
            <div className="max-w-xl w-full space-y-8 sm:p-8 py-8 px-6">
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="bg-green-100 rounded-full p-3">
                            <FaCheckCircle className="h-12 w-12 text-lime-800" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-xl font-extrabold text-lime-800">
                        Đăng ký thành công!
                    </h2>
                    <div className="grid gap-4">
                        <p className="flex items-center justify-center gap-2 opacity-90 text-lime-800">
                            <FaEnvelope className="text-lime-800 mb-0.5" />
                            Vui lòng kiểm tra email của bạn
                        </p>
                        <p>
                            Chúng tôi đã gửi một liên kết xác nhận đến:
                            <span className="block font-bold mt-1 text-red-700">
                                {email}
                            </span>
                        </p>
                        <p>
                            Vui lòng kiểm tra hộp thư đến và nhấp vào liên kết
                            xác nhận để kích hoạt tài khoản của bạn.
                        </p>
                        <div className="py-5 px-2 bg-blue-50 liquid-glass-3 rounded-md text-xs text-red-700">
                            <p>Lưu ý:</p>
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
                        <p className="flex gap-1 items-center justify-center">
                            Không nhận được email?
                            <button
                                className="font-medium text-red-700 hover:opacity-80"
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
                    <div className="mt-6">
                        <div className="grid grid-cols-2 w-full gap-4 text-red-700">
                            <GlareHover
                                glareColor="#b91c1c"
                                background="#fff"
                                borderColor="#fff"
                                glareOpacity={0.3}
                                glareAngle={-30}
                                glareSize={300}
                                transitionDuration={800}
                                playOnce={false}
                                className="hover:text-red-400"
                            >
                                <Link
                                    to="/"
                                    className="flex items-center justify-center gap-2 h-12 border-gray-200 rounded-lg"
                                >
                                    <FaHome className="mb-0.5" />
                                    Về trang chủ
                                </Link>
                            </GlareHover>

                            <GlareHover
                                glareColor="#b91c1c"
                                background="#fff"
                                borderColor="#fff"
                                glareOpacity={0.3}
                                glareAngle={-30}
                                glareSize={300}
                                transitionDuration={800}
                                playOnce={false}
                                className="hover:text-red-400"
                            >
                                <Link
                                    to="/login"
                                    className="flex items-center justify-center gap-2 h-12 border-gray-200 rounded-lg"
                                >
                                    <FaArrowRight className="mb-0.5" />
                                    Đi đến đăng nhập
                                </Link>
                            </GlareHover>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrationSuccessForm;
