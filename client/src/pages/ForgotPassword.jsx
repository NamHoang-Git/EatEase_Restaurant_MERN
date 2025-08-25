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
        <section className="container mx-auto px-2 w-full">
            <div className="bg-white my-4 w-full max-w-lg mx-auto rounded-md p-6">
                <p className="font-semibold text-lg">FORGOT PASSWORD</p>
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
                            className="bg-blue-50 p-2 border rounded outline-none focus-within:border-primary-200"
                            name="email"
                            placeholder="Enter your email"
                            value={data.email}
                            onChange={handleChange}
                        />
                    </div>
                    <button
                        disabled={!valideValue}
                        className={`${
                            valideValue
                                ? 'bg-green-700 hover:bg-green-800 cursor-pointer'
                                : 'bg-gray-400 cursor-no-drop'
                        } text-white py-2 rounded-md font-semibold my-4`}
                    >
                        Send OTP
                    </button>
                </form>

                <p>
                    Already have account?{' '}
                    <Link
                        to={'/login'}
                        className="font-bold text-green-700 hover:text-green-800"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </section>
    );
};

export default ForgotPassword;
