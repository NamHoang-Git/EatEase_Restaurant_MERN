import React, { useEffect, useRef, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';

const OtpVerification = () => {
    const [data, setData] = useState(['', '', '', '', '', '']);
    const navigate = useNavigate();
    const inputRef = useRef([]);
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!location?.state?.email) {
            navigate('/forgot-password');
        }
    }, []);

    const valideValue = data.every((el) => el);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="container mx-auto my-12 max-w-lg px-2">
            <div className="bg-white rounded-md p-6 shadow-md shadow-secondary-100">
                <p className="font-bold lg:text-lg text-base text-secondary-200 uppercase">
                    Xác nhận OTP
                </p>
                <form
                    action=""
                    className="grid gap-4 mt-4 lg:text-base text-sm text-secondary-200"
                    onSubmit={handleSubmit}
                >
                    <div className="grid gap-2">
                        <label className="font-medium" htmlFor="otp">
                            Nhập mã OTP:
                        </label>
                        <div className="flex items-center justify-between gap-2">
                            {data.map((element, index) => {
                                return (
                                    <input
                                        key={'otp' + index}
                                        type="number"
                                        inputmode="numeric"
                                        pattern="[0-9]*"
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
                                        className="bg-base-100 w-full max-w-16 p-2 border rounded
                                        outline-none focus-within:border-secondary-200 text-center
                                        font-bold text-secondary-200 no-spinner"
                                    />
                                );
                            })}
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
                        {loading ? <Loading /> : 'Xác nhận OTP'}
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

export default OtpVerification;
