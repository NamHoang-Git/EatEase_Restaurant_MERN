import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const [data, setData] = useState({
        email: '',
    });

    const navigate = useNavigate();

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
            const response = await Axios({
                ...SummaryApi.forgot_password,
                data: data,
            });

            if (response.data.error) {
                toast.error(response.data.message);
            }

            if (response.data.success) {
                toast.success(response.data.message);
                navigate('/verification-otp', {
                    state: data,
                });

                // Reset form
                setData({
                    email: '',
                });
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    return (
        <section className="container mx-auto my-12 max-w-lg px-2">
            <div className="bg-white rounded-md p-6 shadow-md shadow-secondary-100">
                <p className="font-bold lg:text-lg text-base text-secondary-200 uppercase">
                    Quên Mật Khẩu
                </p>
                <form
                    action=""
                    className="grid gap-4 mt-4 lg:text-base text-sm text-secondary-200"
                    onSubmit={handleSubmit}
                >
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
                        />
                    </div>
                    <button
                        disabled={!valideValue}
                        className={`${
                            valideValue
                                ? 'bg-primary-2 border border-secondary-200 text-secondary-200 hover:opacity-80 cursor-pointer'
                                : 'bg-gray-400 text-white cursor-no-drop'
                        } py-2 rounded-md font-bold mt-1 mb-2`}
                    >
                        Gửi OTP
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

export default ForgotPassword;
