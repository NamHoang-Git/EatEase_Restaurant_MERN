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
        if (!location?.state?.data?.success) {
            navigate('/');
        }

        if (location?.state?.email) {
            setData((prev) => {
                return {
                    ...prev,
                    email: location?.state?.email,
                };
            });
        }
    }, []);

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

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.reset_password,
                data: data,
            });

            if (response.data.error) {
                toast.error(response.data.message);
                return;
            }

            if (response.data.success) {
                toast.success(response.data.message);
                navigate('/login');

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
                <p className="font-bold text-lg text-secondary-200 uppercase">
                    Nhập mật khẩu mới
                </p>
                <form
                    action=""
                    className="grid gap-4 mt-4"
                    onSubmit={handleSubmit}
                >
                    <div className="grid gap-2">
                        <label htmlFor="newPassword">Mật khẩu mới: </label>
                        <div className="bg-base-100 p-2 border rounded flex items-center focus-within:border-secondary-200">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="newPassword"
                                className="w-full outline-none bg-transparent"
                                name="newPassword"
                                placeholder="Enter your new password"
                                value={data.newPassword}
                                onChange={handleChange}
                            />
                            <div
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="cursor-pointer text-secondary-100"
                            >
                                {showPassword ? (
                                    <FaEye size={20} />
                                ) : (
                                    <FaEyeSlash size={20} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="confirmPassword">
                            Xác nhận mật khẩu mới:{' '}
                        </label>
                        <div className="bg-base-100 p-2 border rounded flex items-center focus-within:border-secondary-200">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                className="w-full outline-none bg-transparent"
                                name="confirmPassword"
                                placeholder="Enter your confirm password"
                                value={data.confirmPassword}
                                onChange={handleChange}
                            />
                            <div
                                onClick={() =>
                                    setShowConfirmPassword((prev) => !prev)
                                }
                                className="cursor-pointer text-secondary-100"
                            >
                                {showConfirmPassword ? (
                                    <FaEye size={20} />
                                ) : (
                                    <FaEyeSlash size={20} />
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        disabled={!valideValue}
                        className={`${
                            valideValue
                                ? 'bg-primary-2 border border-secondary-200 text-secondary-200 hover:opacity-80 cursor-pointer'
                                : 'bg-gray-400 cursor-no-drop'
                        } py-2 rounded-md font-bold my-2`}
                    >
                        {loading ? <Loading /> : 'Xác nhận'}
                    </button>
                </form>

                <p className="py-2">
                    Bạn đã có tài khoản?{' '}
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
