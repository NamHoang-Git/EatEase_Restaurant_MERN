import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Divider from './Divider';
import Axios, { setIsLoggingOut } from './../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { logout, updateUserPoints } from '../store/userSlice';
import { clearCart } from '../store/cartProduct';
import { toast } from 'react-hot-toast';
import AxiosToastError from './../utils/AxiosToastError';
import { BiLinkExternal, BiRefresh } from 'react-icons/bi';
import isAdmin from '../utils/isAdmin';

const UserMenu = ({ close }) => {
    const user = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef();
    const [isLoadingPoints, setIsLoadingPoints] = useState(false);

    // Function to fetch user points
    const fetchUserPoints = useCallback(async () => {
        try {
            setIsLoadingPoints(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await Axios.get(SummaryApi.user_points.url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success && response.data.data) {
                dispatch(updateUserPoints(response.data.data.points || 0));
            }
        } catch (error) {
            console.error('Error fetching user points:', error);
        } finally {
            setIsLoadingPoints(false);
        }
    }, [dispatch]);

    // Fetch points when menu opens
    useEffect(() => {
        const fetchData = async () => {
            if (user?._id) {
                await fetchUserPoints();
            }
        };

        fetchData();
    }, [user?._id, fetchUserPoints]);

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
            <div className="text-base font-bold text-secondary-200">Tài khoản</div>
            <div className="lg:text-sm text-xs flex items-start gap-2 px-4 lg:px-2 py-2 font-semibold">
                <div className="w-full">
                    <div className="font-bold text-ellipsis line-clamp-1 flex gap-1 items-center">
                        {user.name || user.mobile}
                        <span className="text-secondary-200 font-bold">
                            {user.role === 'ADMIN' ? '(Quản trị viên)' : ''}
                        </span>
                        <Link
                            onClick={handleClose}
                            to={'/dashboard/profile'}
                            className="hover:text-secondary-100 text-secondary-200 lg:mb-[2px] mb-[1px]"
                            title='Quản lý tài khoản'
                        >
                            <BiLinkExternal size={18} />
                        </Link>
                    </div>
                    <div className="text-gray-600 mt-1 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <span className="font-medium text-yellow-600">Điểm thưởng:</span>
                            <span className="font-bold text-yellow-600">
                                {user.rewardsPoint?.toLocaleString() || 0} điểm
                            </span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                fetchUserPoints();
                            }}
                            className={`text-yellow-600 hover:text-yellow-500 transition-colors ${
                                isLoadingPoints ? 'animate-spin' : ''
                            }`}
                            disabled={isLoadingPoints}
                            title="Làm mới điểm"
                        >
                            <BiRefresh size={16} />
                        </button>
                    </div>
                </div>
            </div>
            <Divider />
            <div className="lg:text-sm text-xs grid gap-2 font-semibold">
                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/category'}
                        className={`px-4 lg:px-2 py-1 hover:bg-base-100 rounded-md transition-colors ${
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
                        to={'/dashboard/product'}
                        className={`px-4 lg:px-2 py-[6px] hover:bg-base-100 rounded-md transition-colors ${
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
                        className={`px-4 lg:px-2 py-[6px] hover:bg-base-100 rounded-md transition-colors ${
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
                        className={`px-4 lg:px-2 py-[6px] hover:bg-base-100 rounded-md transition-colors ${
                            isActive('/dashboard/report')
                                ? 'bg-primary-100 text-secondary-200'
                                : ''
                        }`}
                    >
                        Báo cáo
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/voucher'}
                        className={`px-4 lg:px-2 py-[6px] hover:bg-base-100 rounded-md transition-colors ${
                            isActive('/dashboard/voucher')
                                ? 'bg-primary-100 text-secondary-200'
                                : ''
                        }`}
                    >
                        Voucher
                    </Link>
                )}

                <Link
                    onClick={handleClose}
                    to={'/dashboard/address'}
                    className={`px-4 lg:px-2 py-[6px] hover:bg-base-100 rounded-md transition-colors ${
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
                    className={`px-4 lg:px-2 py-[6px] hover:bg-base-100 rounded-md transition-colors ${
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
                    className="text-left px-4 lg:px-2 py-[6px] hover:bg-base-100 rounded-md"
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default UserMenu;
