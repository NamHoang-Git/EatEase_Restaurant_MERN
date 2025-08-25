import React, { useEffect, useRef, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const OtpVerification = () => {
    const [data, setData] = useState(['', '', '', '', '', '']);
    const navigate = useNavigate();
    const inputRef = useRef([]);
    const location = useLocation();

    useEffect(() => {
        if (!location?.state?.email) {
            navigate('/forgot-password');
        }
    }, []);

    const valideValue = data.every((el) => el);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await Axios({
                ...SummaryApi.forgot_password_otp_verification,
                data: {
                    otp: data.join(''),
                    email: location?.state?.email,
                },
            });

            if (response.data.error) {
                toast.error(response.data.message);
                return;
            }

            if (response.data.success) {
                toast.success(response.data.message);

                // Reset form
                setData(['', '', '', '', '', '']);
                navigate('/reset-password', {
                    state: {
                        data: response.data,
                        email: location?.state?.email,
                    },
                });
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    return (
        <section className="container mx-auto px-2 w-full">
            <div className="bg-white my-4 w-full max-w-lg mx-auto rounded-md p-6">
                <p className="font-semibold text-lg">ENTER OTP</p>
                <form
                    action=""
                    className="grid gap-4 mt-6"
                    onSubmit={handleSubmit}
                >
                    <div className="grid gap-1">
                        <label htmlFor="otp">Enter your OTP: </label>
                        <div className="flex items-center justify-between gap-2 mt-3">
                            {data.map((element, index) => {
                                return (
                                    <input
                                        key={'otp' + index}
                                        type="text"
                                        id="otp"
                                        ref={(ref) => {
                                            inputRef.current[index] = ref;
                                            return ref;
                                        }}
                                        value={data[index]}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            const newData = [...data];
                                            newData[index] = value;
                                            setData(newData);

                                            if (value && index < 5) {
                                                inputRef.current[
                                                    index + 1
                                                ].focus();
                                            }
                                        }}
                                        maxLength={1}
                                        className="bg-blue-50 w-full max-w-16 p-2 border rounded
                                        outline-none focus-within:border-primary-200 text-center
                                        font-semibold"
                                    />
                                );
                            })}
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
                        Verify OTP
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

export default OtpVerification;
