import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Divider from './Divider';
import Axios, { setIsLoggingOut } from './../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { logout } from '../store/userSlice';
import { clearCart } from '../store/cartProduct';
import { toast } from 'react-hot-toast';
import AxiosToastError from './../utils/AxiosToastError';
import { BiLinkExternal } from 'react-icons/bi';
import isAdmin from '../utils/isAdmin';

const UserMenu = ({ close }) => {
    const user = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const menuRef = useRef();

    const handleLogout = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.logout,
            });

            if (response.data.success) {
                if (close) {
                    close();
                }
                // Clear Redux state immediately
                dispatch(logout());
                dispatch(clearCart()); // Clear cart from Redux store
                setIsLoggingOut(true); // đánh dấu đang logout
                
                // Clear localStorage
                localStorage.removeItem('accesstoken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('checkoutSelectedItems'); // Clear checkout data
                
                toast.success(response.data.message);
                navigate('/');
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const handleClose = () => {
        if (close) {
            close();
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                close?.(); // gọi close nếu click ra ngoài
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [close]);

    return (
        <div ref={menuRef}>
            <div className="font-semibold">My Account</div>
            <div className="text-sm flex items-start gap-2 p-2">
                <span className="max-w-60 text-ellipsis line-clamp-1 flex gap-2">
                    {user.name || user.mobile}
                    <span className="text-secondary-200 font-bold">
                        {user.role === 'ADMIN' ? '(Admin)' : ''}
                    </span>
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/profile'}
                        className="hover:text-secondary-200 mt-[1.8px]"
                    >
                        <BiLinkExternal size={15} />
                    </Link>
                </span>
            </div>
            <Divider />
            <div className="text-sm grid gap-2">
                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/category'}
                        className="px-2 py-1 hover:bg-white rounded-md"
                    >
                        Category
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/upload-product'}
                        className="px-2 py-1 hover:bg-white rounded-md"
                    >
                        Upload Product
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/product'}
                        className="px-2 py-1 hover:bg-white rounded-md"
                    >
                        Product
                    </Link>
                )}

                <Link
                    onClick={handleClose}
                    to={'/dashboard/my-orders'}
                    className="px-2 py-1 hover:bg-white rounded-md"
                >
                    My Orders
                </Link>

                <Link
                    onClick={handleClose}
                    to={'/dashboard/address'}
                    className="px-2 py-1 hover:bg-white rounded-md"
                >
                    Save Address
                </Link>
                <Divider />
                <button
                    onClick={handleLogout}
                    className="text-left px-2 py-1 hover:bg-white rounded-md"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
};

export default UserMenu;
