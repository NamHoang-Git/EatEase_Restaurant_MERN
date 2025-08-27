import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Axios from './../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from './../utils/AxiosToastError';
import { updatedAvatar } from '../store/userSlice';
import { IoClose } from 'react-icons/io5';
import Loading from './Loading';
import defaultAvatar from '../assets/defaultAvatar.png';

const UserProfileAvatarEdit = ({ close }) => {
    const user = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

    const handleUploadAvatarImage = async (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.upload_avatar,
                data: formData,
            });

            const { data: responseData } = response;
            dispatch(updatedAvatar(responseData.data.avatar));
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section
            className="fixed top-0 bottom-0 left-0 right-0
    bg-neutral-900 bg-opacity-70 p-4 flex items-center justify-center"
        >
            <div
                className="bg-white max-w-sm w-full rounded p-4
            flex flex-col gap-3 items-center justify-center"
            >
                <button
                    onClick={close}
                    className="text-neutral-900 w-fit block ml-auto"
                >
                    <IoClose size={25} />
                </button>
                <div
                    className="w-20 h-20 bg-red-400 flex items-center justify-center
                        rounded-full overflow-hidden drop-shadow-sm "
                >
                    <img
                        src={user.avatar || defaultAvatar}
                        alt={user.name}
                        className="w-full h-full"
                    />
                </div>
                <label htmlFor="uploadProfile">
                    <div
                        htmlFor="uploadProfile"
                        className="border border-violet-500 hover:border-violet-800 hover:bg-violet-200
                cursor-pointer px-3 py-1 text-sm rounded-md"
                    >
                        {loading ? <Loading /> : 'Upload'}
                    </div>
                    <input
                        onChange={handleUploadAvatarImage}
                        type="file"
                        accept="image/*"
                        id="uploadProfile"
                        className="hidden"
                    />
                </label>
            </div>
        </section>
    );
};

export default UserProfileAvatarEdit;
