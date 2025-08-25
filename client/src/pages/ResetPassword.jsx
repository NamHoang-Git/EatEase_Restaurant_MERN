import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';

const ResetPassword = () => {
    const location = useLocation();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        }
    };

    return (
        <section className="container mx-auto px-2 w-full">
            <div className="bg-white my-4 w-full max-w-lg mx-auto rounded-md p-6">
                <p className="font-semibold text-lg">ENTER YOUR NEW PASSWORD</p>
                <form
                    action=""
                    className="grid gap-4 mt-6"
                    onSubmit={handleSubmit}
                >
                    <div className="grid gap-1">
                        <label htmlFor="newPassword">New Password: </label>
                        <div className="bg-blue-50 p-2 border rounded flex items-center focus-within:border-primary-200">
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
                                className="cursor-pointer"
                            >
                                {showPassword ? <FaEye /> : <FaEyeSlash />}
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="confirmPassword">
                            Confirm New Password:{' '}
                        </label>
                        <div className="bg-blue-50 p-2 border rounded flex items-center focus-within:border-primary-200">
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
                                className="cursor-pointer"
                            >
                                {showConfirmPassword ? (
                                    <FaEye />
                                ) : (
                                    <FaEyeSlash />
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        disabled={!valideValue}
                        className={`${
                            valideValue
                                ? 'bg-green-700 hover:bg-green-800 cursor-pointer'
                                : 'bg-gray-400 cursor-no-drop'
                        } text-white py-2 rounded-md font-semibold my-4`}
                    >
                        Change Password
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

export default ResetPassword;
