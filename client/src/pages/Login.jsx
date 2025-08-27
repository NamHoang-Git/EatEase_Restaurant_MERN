import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';
import fetchUserDetails from './../utils/fetchUserDetails';
import { useDispatch } from 'react-redux';
import { setUserDetails } from '../store/userSlice';
import banner from '../assets/register_banner.jpg';
import { TypeAnimation } from 'react-type-animation';
import Loading from '../components/Loading';

const Login = () => {
    const [data, setData] = useState({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

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

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.login,
                data: data,
            });

            if (response.data.error) {
                toast.error(response.data.message);
            }

            if (response.data.success) {
                toast.success(response.data.message);
                localStorage.setItem(
                    'accesstoken',
                    response.data.data.accessToken
                );
                localStorage.setItem(
                    'refreshToken',
                    response.data.data.refreshToken
                );

                const userDetails = await fetchUserDetails();
                dispatch(setUserDetails(userDetails.data));

                // Reset form
                setData({
                    email: '',
                    password: '',
                });
                navigate('/');
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="mx-auto my-12 max-w-4xl">
            <div
                className="grid grid-flow-col lg:grid-cols-[2fr_1.5fr] mx-5 rounded-md shadow-md
            shadow-secondary-100"
            >
                {/* Banner */}
                <div
                    className="hidden rounded-s-md opacity-80 lg:flex flex-col justify-center gap-3"
                    style={{
                        backgroundImage: `url(${banner})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <h1 className="px-4 text-white font-bold text-4xl">
                        <TypeAnimation
                            sequence={['Chào mừng trở lại!', 800, '', 500]}
                            wrapper="span"
                            speed={65}
                            repeat={Infinity}
                        />
                    </h1>
                    <p className="px-4 text-primary-200 text-lg">
                        Đăng nhập để truy cập tất cả các tính năng!
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white p-6 rounded-e-md">
                    <p className="font-bold text-lg text-center text-secondary-200 uppercase">
                        Đăng nhập
                    </p>
                    <form
                        action=""
                        className="grid gap-4 mt-6"
                        onSubmit={handleSubmit}
                    >
                        <div className="grid gap-1">
                            <label htmlFor="email">Email: </label>
                            <input
                                type="email"
                                id="email"
                                autoFocus
                                className="bg-base-100 p-2 border rounded outline-none focus-within:border-secondary-200"
                                name="email"
                                placeholder="Nhập email của bạn"
                                value={data.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid gap-1">
                            <label htmlFor="password">Mật khẩu: </label>
                            <div className="bg-base-100 p-2 border rounded flex items-center focus-within:border-secondary-200">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    className="w-full outline-none bg-transparent"
                                    name="password"
                                    placeholder="Nhập mật khẩu của bạn"
                                    value={data.password}
                                    onChange={handleChange}
                                />
                                <div
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    className="cursor-pointer text-secondary-100"
                                >
                                    {showPassword ? (
                                        <FaEye size={20} />
                                    ) : (
                                        <FaEyeSlash size={20} />
                                    )}
                                </div>
                            </div>
                            <Link
                                to={'/forgot-password'}
                                className="block ml-auto mt-1 text-sm hover:text-secondary-100"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>
                        <button
                            disabled={!valideValue}
                            className={`${
                                valideValue
                                    ? 'bg-primary-2 border border-secondary-200 text-secondary-200 hover:opacity-80 cursor-pointer'
                                    : 'bg-gray-400 text-white cursor-no-drop'
                            } py-2 rounded-md font-bold my-4`}
                        >
                            {loading ? <Loading /> : 'Đăng nhập'}
                        </button>
                    </form>

                    <p>
                        Bạn chưa có tài khoản?{' '}
                        <Link
                            to={'/register'}
                            className="font-bold text-secondary-200 hover:text-secondary-100"
                        >
                            Đăng ký
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Login;
