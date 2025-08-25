import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BiSolidUserAccount } from 'react-icons/bi';
import UserProfileAvatarEdit from './../components/UserProfileAvatarEdit';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import fetchUserDetails from './../utils/fetchUserDetails';
import { setUserDetails } from '../store/userSlice';

const Profile = () => {
    const user = useSelector((state) => state.user);
    const [openProfileAvatarEdit, setOpenProfileAvatarEdit] = useState(false);
    const [userData, setUserData] = useState({
        name: user.name,
        email: user.email,
        mobile: user.mobile,
    });

    const [loading, setLoading] = useState(false);
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
        <div className="">
            {/* Profile upload and display image */}
            <div
                className="w-20 h-20 bg-red-400 flex items-center justify-center
            rounded-full overflow-hidden drop-shadow-sm "
            >
                {user.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full"
                    />
                ) : (
                    <BiSolidUserAccount size={60} />
                )}
            </div>
            <button
                onClick={() => setOpenProfileAvatarEdit(true)}
                className="text-xs min-w-20 border border-blue-300 hover:border-blue-600 hover:bg-slate-100
            px-3 py-1 rounded-full mt-2"
            >
                Edit
            </button>

            {openProfileAvatarEdit && (
                <UserProfileAvatarEdit
                    close={() => setOpenProfileAvatarEdit(false)}
                />
            )}

            {/* name, mobile, email, change password */}
            <form className="my-4 grid gap-4" onSubmit={handleSubmit}>
                <div className="grid">
                    <label htmlFor="">Name</label>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        className="bg-blue-50 p-2 border rounded outline-none 
                        focus-within:border-primary-200"
                        value={userData.name}
                        name="name"
                        onChange={handleOnChange}
                        required
                    />
                </div>
                <div className="grid">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        className="bg-blue-50 p-2 border rounded outline-none 
                        focus-within:border-primary-200"
                        value={userData.email}
                        name="email"
                        onChange={handleOnChange}
                        required
                    />
                </div>
                <div className="grid">
                    <label htmlFor="mobile">Mobile</label>
                    <input
                        type="text"
                        id="mobile"
                        placeholder="Enter your mobile"
                        className="bg-blue-50 p-2 border rounded outline-none 
                        focus-within:border-primary-200"
                        value={userData.mobile}
                        name="mobile"
                        onChange={handleOnChange}
                        required
                    />
                </div>

                <button
                    className="text-green-800 py-2 rounded-md font-semibold my-4
                border border-green-500 bg-white hover:bg-green-800 hover:text-white cursor-pointer"
                >
                    {loading ? 'Loading...' : 'Submit'}
                </button>
            </form>
        </div>
    );
};

export default Profile;
