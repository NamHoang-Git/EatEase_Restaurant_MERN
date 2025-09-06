import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();
    const menuRef = useRef();

    // Function to check if a path is active
    const isActive = (path) => {
        // Exact match for root path
        if (path === '/dashboard' && location.pathname === '/dashboard')
            return true;
        // Check if current path starts with the given path (for nested routes)
        return location.pathname.startsWith(path) && path !== '/dashboard';
    };

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
                dispatch(clearCart());
                setIsLoggingOut(true);

                // Clear localStorage
                localStorage.removeItem('accesstoken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('checkoutSelectedItems');

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
                close?.();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [close]);

    return (
        <div ref={menuRef}>
            <div className="font-bold">Tài khoản</div>
            <div className="text-sm flex items-start gap-2 px-4 lg:px-2 py-2 font-semibold">
                <span className="max-w-96 md:max-w-60 text-ellipsis line-clamp-1 flex gap-2">
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
            <div className="text-sm grid gap-2 font-semibold">
                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/category'}
                        className={`px-4 lg:px-2 py-2 sm:py-1 hover:bg-base-100 rounded-md transition-colors ${
                            isActive('/dashboard/category')
                                ? 'bg-primary-100 text-secondary-200'
                                : ''
                        }`}
                    >
                        Danh mục
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/upload-product'}
                        className={`px-4 lg:px-2 py-2 sm:py-1 hover:bg-base-100 rounded-md transition-colors ${
                            isActive('/dashboard/upload-product')
                                ? 'bg-primary-100 text-secondary-200'
                                : ''
                        }`}
                    >
                        Đăng sản phẩm
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/product'}
                        className={`px-4 lg:px-2 py-2 sm:py-1 hover:bg-base-100 rounded-md transition-colors ${
                            isActive('/dashboard/product')
                                ? 'bg-primary-100 text-secondary-200'
                                : ''
                        }`}
                    >
                        Sản phẩm
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/bill'}
                        className={`px-4 lg:px-2 py-2 sm:py-1 hover:bg-base-100 rounded-md transition-colors ${
                            isActive('/dashboard/bill')
                                ? 'bg-primary-100 text-secondary-200'
                                : ''
                        }`}
                    >
                        Hóa đơn
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/report'}
                        className={`px-4 lg:px-2 py-2 sm:py-1 hover:bg-base-100 rounded-md transition-colors ${
                            isActive('/dashboard/report')
                                ? 'bg-primary-100 text-secondary-200'
                                : ''
                        }`}
                    >
                        Báo cáo
                    </Link>
                )}

                <Link
                    onClick={handleClose}
                    to={'/dashboard/address'}
                    className={`px-4 lg:px-2 py-2 sm:py-1 hover:bg-base-100 rounded-md transition-colors ${
                        isActive('/dashboard/address')
                            ? 'bg-primary-100 text-secondary-200'
                            : ''
                    }`}
                >
                    Địa chỉ
                </Link>

                <Link
                    onClick={handleClose}
                    to={'/dashboard/my-orders'}
                    className={`px-4 lg:px-2 py-2 sm:py-1 hover:bg-base-100 rounded-md transition-colors ${
                        isActive('/dashboard/my-orders')
                            ? 'bg-primary-100 text-secondary-200'
                            : ''
                    }`}
                >
                    Đơn hàng
                </Link>

                <Divider />
                <button
                    onClick={handleLogout}
                    className="text-left px-4 lg:px-2 py-2 sm:py-1 hover:bg-base-100 rounded-md"
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default UserMenu;
