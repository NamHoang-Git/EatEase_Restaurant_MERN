import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';
import banner from '../assets/register_banner.jpg';
import { TypeAnimation } from 'react-type-animation';
import Loading from '../components/Loading';

const Register = () => {
    const [data, setData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // lấy tất cả input hợp lệ trong form
            const form = e.target.form;
            const focusable = Array.from(form.elements).filter(
                (el) =>
                    el.tagName === 'INPUT' ||
                    el.tagName === 'SELECT' ||
                    el.tagName === 'TEXTAREA'
            );

            // tìm vị trí hiện tại
            const index = focusable.indexOf(e.target);

            // focus phần tử tiếp theo nếu có
            if (index > -1 && index < focusable.length - 1) {
                focusable[index + 1].focus();
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setData((prev) => {
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const valideValue = Object.values(data).every((el) => el);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (data.password !== data.confirmPassword) {
            toast.error('Mật khẩu và mật khẩu xác nhận phải giống nhau');
            return;
        }

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.register,
                data: data,
            });

            if (response.data.error) {
                toast.error(response.data.message);
            }

            if (response.data.success) {
                toast.success(response.data.message);

                // Reset form
                setData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                });
                navigate('/login');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="container mx-auto my-12 max-w-4xl">
            <div
                className="grid grid-flow-col lg:grid-cols-[2fr_1.5fr] mx-5 rounded-md shadow-md
            shadow-secondary-100"
            >
                {/* Register Form */}
                <div className="bg-white p-6 rounded-s-md">
                    <p className="font-bold lg:text-lg text-base text-center text-secondary-200 uppercase">
                        Đăng ký
                    </p>
                    <form
                        action=""
                        className="grid gap-4 mt-6 lg:text-base text-sm text-secondary-200"
                        onSubmit={handleSubmit}
                    >
                        <div className="grid gap-2">
                            <label className="font-medium" htmlFor="name">
                                Tên:{' '}
                            </label>
                            <input
                                type="text"
                                id="name"
                                autoFocus
                                className="bg-base-100 lg:p-2 px-2 py-[6px] lg:text-base text-xs border rounded outline-none focus-within:border-secondary-200"
                                name="name"
                                placeholder="Nhập tên của bạn"
                                value={data.name}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                spellCheck={false}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="font-medium" htmlFor="email">
                                Email:{' '}
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="bg-base-100 lg:p-2 px-2 py-[6px] lg:text-base text-xs border rounded outline-none focus-within:border-secondary-200"
                                name="email"
                                placeholder="Nhập email của bạn"
                                value={data.email}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                spellCheck={false}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="font-medium" htmlFor="password">
                                Mật khẩu:{' '}
                            </label>
                            <div className="bg-base-100 lg:p-2 px-2 py-[6px] lg:text-base text-xs border rounded flex items-center focus-within:border-secondary-200">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    className="w-full outline-none bg-transparent"
                                    name="password"
                                    placeholder="Nhập mật khẩu của bạn"
                                    value={data.password}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    spellCheck={false}
                                />
                                <div
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    className="cursor-pointer text-secondary-100 lg:block hidden"
                                >
                                    {showPassword ? (
                                        <FaEye size={20} />
                                    ) : (
                                        <FaEyeSlash size={20} />
                                    )}
                                </div>

                                <div
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    className="cursor-pointer text-secondary-100 lg:hidden block"
                                >
                                    {showPassword ? (
                                        <FaEye size={16} />
                                    ) : (
                                        <FaEyeSlash size={16} />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label
                                className="font-medium"
                                htmlFor="confirmPassword"
                            >
                                Xác nhận mật khẩu:{' '}
                            </label>
                            <div className="bg-base-100 lg:p-2 px-2 py-[6px] lg:text-base text-xs border rounded flex items-center focus-within:border-secondary-200">
                                <input
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    id="confirmPassword"
                                    className="w-full outline-none bg-transparent"
                                    name="confirmPassword"
                                    placeholder="Nhập lại mật khẩu để xác nhận"
                                    value={data.confirmPassword}
                                    onChange={handleChange}
                                    spellCheck={false}
                                />
                                <div
                                    onClick={() =>
                                        setShowConfirmPassword((prev) => !prev)
                                    }
                                    className="cursor-pointer text-secondary-100 lg:block hidden"
                                >
                                    {showConfirmPassword ? (
                                        <FaEye size={20} />
                                    ) : (
                                        <FaEyeSlash size={20} />
                                    )}
                                </div>

                                <div
                                    onClick={() =>
                                        setShowConfirmPassword((prev) => !prev)
                                    }
                                    className="cursor-pointer text-secondary-100 lg:hidden block"
                                >
                                    {showConfirmPassword ? (
                                        <FaEye size={16} />
                                    ) : (
                                        <FaEyeSlash size={16} />
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            disabled={!valideValue}
                            className={`${
                                valideValue
                                    ? 'bg-primary-2 border border-secondary-200 text-secondary-200 hover:opacity-80 cursor-pointer'
                                    : 'bg-gray-400 text-white cursor-no-drop'
                            } py-2 rounded-md font-bold mt-1 mb-2`}
                        >
                            {loading ? <Loading /> : 'Đăng ký'}
                        </button>
                    </form>

                    <p className="py-2 lg:text-base text-xs font-medium">
                        Bạn đã có tài khoản?{' '}
                        <Link
                            to={'/login'}
                            className="font-bold text-secondary-200 hover:text-secondary-100"
                        >
                            Đăng nhập
                        </Link>
                    </p>
                </div>

                {/* Banner */}
                <div
                    className="hidden rounded-e-md opacity-80 lg:flex flex-col justify-center gap-3"
                    style={{
                        backgroundImage: `url(${banner})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <h1 className="px-4 text-white font-bold text-4xl">
                        <TypeAnimation
                            sequence={[
                                'Chào mừng đến với Ecommerce SHOP',
                                800,
                                '',
                                500,
                            ]}
                            wrapper="span"
                            speed={65}
                            repeat={Infinity}
                        />
                    </h1>
                    <p className="px-4 text-primary-200 text-lg">
                        Tạo tài khoản để mở khóa tất cả các tính năng!
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Register;
