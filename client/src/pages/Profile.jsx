import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import UserProfileAvatarEdit from '../components/UserProfileAvatarEdit';
import ChangePassword from '../components/ChangePassword';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import fetchUserDetails from '../utils/fetchUserDetails';
import { setUserDetails } from '../store/userSlice';
import defaultAvatar from '../assets/defaultAvatar.png';
import { FaEdit, FaLock, FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';

const Profile = () => {
    const user = useSelector((state) => state.user);
    const [openProfileAvatarEdit, setOpenProfileAvatarEdit] = useState(false);
    const [userData, setUserData] = useState({
        name: user.name,
        email: user.email,
        mobile: user.mobile,
    });

    const [loading, setLoading] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [isModified, setIsModified] = useState(false);
    const [mobileError, setMobileError] = useState('');
    const dispatch = useDispatch();

    const validateMobile = (mobile) => {
        // Vietnamese phone number validation
        // Starts with 0, followed by 9 or 1-9, then 8 more digits (total 10 digits)
        const mobileRegex = /^(0[1-9]|0[1-9][0-9]{8})$/;
        if (!mobile) {
            setMobileError('Vui lòng nhập số điện thoại');
            return false;
        }
        if (!mobileRegex.test(mobile)) {
            setMobileError('Số điện thoại không hợp lệ');
            return false;
        }
        setMobileError('');
        return true;
    };

    useEffect(() => {
        setUserData({
            name: user.name,
            email: user.email,
            mobile: user.mobile,
        });
        setIsModified(false);
    }, [user]);

    // Check if name or mobile has been modified
    useEffect(() => {
        const isNameModified = userData.name !== user.name;
        const isMobileModified = userData.mobile !== user.mobile;
        setIsModified(isNameModified || isMobileModified);
    }, [userData, user.name, user.mobile]);

    const handleOnChange = (e) => {
        const { name, value } = e.target;

        setUserData((prev) => {
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate mobile number before submission
        if (!validateMobile(userData.mobile)) {
            return;
        }

        try {
            setLoading(true);

            const response = await Axios({
                ...SummaryApi.update_user,
                data: userData,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                const userData = await fetchUserDetails();
                dispatch(setUserDetails(userData.data));
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-2 md:p-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div
                    className="px-3 py-4 bg-primary-4 rounded-md shadow-md text-secondary-200
                shadow-secondary-100 font-bold"
                >
                    <h1 className="text-ellipsis line-clamp-1 uppercase">
                        Tài khoản của tôi
                    </h1>
                    <p className="text-xs sm:text-base text-secondary-100">
                        Quản lý thông tin cá nhân và bảo mật của bạn
                    </p>
                </div>

                <div className="px-4 py-6 sm:p-6 md:flex gap-8">
                    {/* Left Column - Avatar */}
                    <div className="md:w-1/3 flex flex-col items-center mb-6 md:mb-0">
                        <div className="relative group">
                            <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-inset border-cyan-500 shadow-lg">
                                <img
                                    src={user.avatar || defaultAvatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                onClick={() => setOpenProfileAvatarEdit(true)}
                                className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-primary-2 text-secondary-200 p-[6px] rounded-lg
                            transition-all duration-200 transform hover:scale-110 shadow-lg"
                                title="Change Avatar"
                            >
                                <FaEdit />
                            </button>
                        </div>

                        <h2 className="mt-4 sm:text-xl text-lg font-semibold text-gray-800">
                            {user.name}
                        </h2>
                        <p className="text-secondary-200 font-bold sm:text-base text-sm">
                            {user.role}
                        </p>

                        <button
                            onClick={() => setShowChangePassword(true)}
                            className="mt-4 flex items-center gap-2 px-4 py-[6px] bg-white border-2 border-secondary-200
                            text-secondary-200 rounded-lg sm:text-base text-sm hover:bg-secondary-200 hover:text-white transition-colors w-full justify-center"
                        >
                            <FaLock />
                            <p className="font-semibold mt-[5px]">
                                Đổi mật khẩu
                            </p>
                        </button>
                    </div>

                    {/* Right Column - Form */}
                    <div className="md:w-2/3 sm:text-lg text-sm">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="bg-gray-50 px-2 py-4 sm:p-6 rounded-lg">
                                <h3 className="sm:text-lg text-base font-semibold text-secondary-200 mb-4 flex items-center">
                                    <FaUser
                                        className="mr-2 mb-[4px]"
                                        size={18}
                                    />{' '}
                                    Thông tin cá nhân
                                </h3>

                                <div className="space-y-4 sm:text-base text-sm text-secondary-200">
                                    <div>
                                        <label className="block font-bold mb-1">
                                            Họ và tên
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Nhập họ và tên"
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-100 focus:border-secondary-100"
                                                value={userData.name}
                                                name="name"
                                                onChange={handleOnChange}
                                                required
                                                spellCheck={false}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-bold mb-1">
                                            Địa chỉ email
                                        </label>
                                        <div className="relative opacity-80">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaEnvelope className="text-secondary-100" />
                                            </div>
                                            <input
                                                type="email"
                                                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2
                                                focus:ring-secondary-100 focus:border-secondary-100 cursor-not-allowed"
                                                value={userData.email}
                                                name="email"
                                                onChange={handleOnChange}
                                                required
                                                disabled
                                                spellCheck={false}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-bold mb-1">
                                            Số điện thoại
                                        </label>
                                        <div className="relative">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <FaPhone className="text-secondary-100" />
                                                </div>
                                                <input
                                                    type="tel"
                                                    placeholder="Nhập số điện thoại (VD: 0912345678)"
                                                    className={`w-full pl-10 px-4 py-2 border ${
                                                        mobileError
                                                            ? 'border-red-500'
                                                            : 'border-gray-300'
                                                    } rounded-lg focus:ring-2 focus:ring-secondary-100 focus:border-secondary-100`}
                                                    value={userData.mobile}
                                                    name="mobile"
                                                    onChange={(e) => {
                                                        handleOnChange(e);
                                                        // Clear error when user starts typing
                                                        if (mobileError) {
                                                            validateMobile(
                                                                e.target.value
                                                            );
                                                        }
                                                    }}
                                                    onBlur={(e) =>
                                                        validateMobile(
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                    spellCheck={false}
                                                />
                                            </div>
                                            {mobileError && (
                                                <p className="absolute left-0 mt-1 text-sm text-red-600">
                                                    {mobileError}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={
                                            !isModified ||
                                            loading ||
                                            mobileError
                                        }
                                        className={`px-6 py-2 ${
                                            !mobileError && isModified
                                                ? 'bg-primary-3 hover:opacity-80'
                                                : 'bg-gray-300 cursor-not-allowed'
                                        } text-secondary-200 font-bold rounded-lg focus:outline-none
                                    focus:ring-2 focus:ring-offset-2 focus:ring-secondary-100 disabled:opacity-50 flex items-center`}
                                    >
                                        {loading ? (
                                            <>
                                                <svg
                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Lưu thay đổi...
                                            </>
                                        ) : (
                                            'Lưu thay đổi'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {openProfileAvatarEdit && (
                <UserProfileAvatarEdit
                    close={() => setOpenProfileAvatarEdit(false)}
                />
            )}

            {showChangePassword && (
                <ChangePassword close={() => setShowChangePassword(false)} />
            )}
        </div>
    );
};

export default Profile;
