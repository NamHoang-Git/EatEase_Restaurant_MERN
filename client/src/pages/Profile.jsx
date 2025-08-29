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
    const dispatch = useDispatch();

    useEffect(() => {
        setUserData({
            name: user.name,
            email: user.email,
            mobile: user.mobile,
        });
    }, [user]);

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
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                    <h1 className="text-2xl font-bold">Profile Settings</h1>
                    <p className="text-blue-100">Manage your personal information and security</p>
                </div>

                <div className="p-6 md:flex gap-8">
                    {/* Left Column - Avatar */}
                    <div className="md:w-1/3 flex flex-col items-center mb-6 md:mb-0">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                <img
                                    src={user.avatar || defaultAvatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                onClick={() => setOpenProfileAvatarEdit(true)}
                                className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full 
                                hover:bg-blue-700 transition-all duration-200 transform hover:scale-110"
                                title="Change Avatar"
                            >
                                <FaEdit />
                            </button>
                        </div>

                        <h2 className="mt-4 text-xl font-semibold text-gray-800">{user.name}</h2>
                        <p className="text-gray-600">{user.role}</p>

                        <button
                            onClick={() => setShowChangePassword(true)}
                            className="mt-6 flex items-center gap-2 px-4 py-2 bg-white border border-blue-500 
                            text-blue-600 rounded-lg hover:bg-blue-50 transition-colors w-full justify-center"
                        >
                            <FaLock /> Change Password
                        </button>
                    </div>

                    {/* Right Column - Form */}
                    <div className="md:w-2/3">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <FaUser className="mr-2 text-blue-500" /> Personal Information
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Enter your name"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={userData.name}
                                                name="name"
                                                onChange={handleOnChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaEnvelope className="text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={userData.email}
                                                name="email"
                                                onChange={handleOnChange}
                                                required
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaPhone className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Enter your mobile number"
                                                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={userData.mobile}
                                                name="mobile"
                                                onChange={handleOnChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : 'Save Changes'}
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
                <ChangePassword
                    close={() => setShowChangePassword(false)}
                />
            )}
        </div>
    );
};

export default Profile;
