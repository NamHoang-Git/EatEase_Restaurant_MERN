import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import Loading from '../components/Loading';

const ResetPassword = () => {
    const location = useLocation();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const [data, setData] = useState({
        email: '',
        newPassword: '',
        confirmPassword: '',
    });

    const valideValue = Object.values(data).every((el) => el);

    useEffect(() => {
        // Only redirect if this is a forgot password flow and there's no email in state
        if (location?.state?.fromForgotPassword && !location?.state?.email) {
            navigate('/');
            return;
        }

        // Set email from state if available (for both change password and forgot password flows)
        if (location?.state?.email) {
            setData((prev) => ({
                ...prev,
                email: location.state.email,
            }));
        }
    }, [location, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setData((prev) => {
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (data.newPassword !== data.confirmPassword) {
            toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
            return;
        }

        try {
            setLoading(true);
            const response = await Axios({
                ...(location?.state?.fromProfile
                    ? SummaryApi.change_password
                    : SummaryApi.reset_password),
                data: {
                    ...data,
                    ...(location?.state?.fromProfile
                        ? {}
                        : { email: data.email }),
                },
            });

            if (response.data.error) {
                toast.error(response.data.message);
                return;
            }

            if (response.data.success) {
                toast.success(response.data.message);

                if (location?.state?.fromProfile) {
                    // If coming from profile, go back to profile
                    navigate('/account');
                } else {
                    // For forgot password flow, go to login
                    navigate('/login');
                }

                // Reset form
                setData({
                    email: '',
                    newPassword: '',
                    confirmPassword: '',
                });
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="container mx-auto my-12 max-w-lg px-2">
            <div className="bg-white rounded-md p-6 shadow-md shadow-secondary-100">
                <p className="font-bold lg:text-lg text-base text-secondary-200 uppercase">
                    Đổi mật khẩu
                </p>
                <form
                    action=""
                    className="grid gap-4 mt-4 lg:text-base text-sm text-secondary-200"
                    onSubmit={handleSubmit}
                >
                    <div className="grid gap-2">
                        <label className="font-medium" htmlFor="newPassword">
                            Mật khẩu mới:{' '}
                        </label>
                        <div className="bg-base-100 lg:p-2 px-2 py-[6px] lg:text-base text-xs border rounded flex items-center focus-within:border-secondary-200">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="newPassword"
                                className="w-full outline-none bg-transparent"
                                name="newPassword"
                                placeholder="Nhập mật khẩu mới"
                                value={data.newPassword}
                                onChange={handleChange}
                            />
                            <div
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="cursor-pointer text-secondary-100 lg:block hidden"
                            >
                                {showPassword ? (
                                    <FaEye size={20} />
                                ) : (
                                    <FaEyeSlash size={20} />
                                )}
                            </div>

                            <div
                                onClick={() => setShowPassword((prev) => !prev)}
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
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                className="w-full outline-none bg-transparent"
                                name="confirmPassword"
                                placeholder="Xác nhận mật khẩu"
                                value={data.confirmPassword}
                                onChange={handleChange}
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
                                : 'bg-gray-400 cursor-no-drop text-white'
                        } py-2 rounded-md font-bold my-2`}
                    >
                        {loading ? <Loading /> : 'Xác nhận'}
                    </button>
                </form>

                <p className="py-2 lg:text-base text-xs font-medium">
                    Bạn muốn đăng nhập?{' '}
                    <Link
                        to={'/login'}
                        className="font-bold text-secondary-200 hover:text-secondary-100"
                    >
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </section>
    );
};

export default ResetPassword;
