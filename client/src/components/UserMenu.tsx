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
import GradientText from './GradientText';
import { RootState } from '@/store/store';
import { Briefcase, Tag, HelpCircle, FileText, Info } from 'lucide-react';
import defaultAvatar from '@/assets/defaultAvatar.png';
import { FaBoxOpen, FaHome } from 'react-icons/fa';
import { RiExternalLinkFill } from 'react-icons/ri';

interface UserMenuProps {
    close: () => void;
    menuTriggerRef?: React.RefObject<HTMLDivElement>;
}

const UserMenu: React.FC<UserMenuProps> = ({ close, menuTriggerRef }) => {
    const user = useSelector((state: RootState) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoadingPoints, setIsLoadingPoints] = useState(false);

    interface NavLink {
        href: string;
        icon: React.ReactNode;
        label: string;
    }

    const links: NavLink[] = [
        {
            href: '/admin/dashboard',
            icon: <FaHome size={12} className="mb-0.5" />,
            label: 'Trang quản trị',
        },
        {
            href: '/admin/users',
            icon: <FaBoxOpen size={12} className="mb-0.5" />,
            label: 'Quản lý người dùng',
        },
        {
            href: '/admin/products',
            icon: <FaBoxOpen size={12} className="mb-0.5" />,
            label: 'Quản lý sản phẩm',
        },
        {
            href: '/admin/categories',
            icon: <FaBoxOpen size={12} className="mb-0.5" />,
            label: 'Quản lý danh mục',
        },
        {
            href: '/admin/vouchers',
            icon: <FaBoxOpen size={12} className="mb-0.5" />,
            label: 'Mã giảm giá',
        },
        {
            href: '/admin/reports',
            icon: <FaBoxOpen size={12} className="mb-0.5" />,
            label: 'Báo cáo thống kê',
        },
    ];

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
        if (
            path === '/admin/dashboard' &&
            location.pathname === '/admin/dashboard'
        )
            return true;
        // Check if current path starts with the given path (for nested routes)
        return (
            location.pathname.startsWith(path) && path !== '/admin/dashboard'
        );
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

    const isAdmin = user?.role === 'ADMIN';

    return (
        <div className="bg-amber-50 text-red-950 rounded-lg shadow-lg overflow-hidden w-full">
            <div className="p-4 pb-1">
                <div className="flex items-center gap-3">
                    <Link
                        to={'/dashboard/profile'}
                        className="relative w-16 hover:opacity-85"
                    >
                        <img
                            src={user?.avatar || defaultAvatar}
                            alt={user?.name}
                            className="w-16 h-16 p-0.5 rounded-full object-cover border-2 border-red-600"
                        />
                        {isAdmin && (
                            <span
                                className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-xs font-medium
                            px-2.5 py-0.5 rounded-full"
                            >
                                Quản trị
                            </span>
                        )}
                    </Link>
                    <div className="min-w-0">
                        <Link
                            to={'/dashboard/profile'}
                            className="flex items-center gap-1 text-sm font-bold truncate
                        text-red-600 hover:text-red-400"
                            title="Tài khoản"
                        >
                            {user?.name}
                            <RiExternalLinkFill className="mb-2" />
                        </Link>
                        <p className="text-xs truncate">{user?.email}</p>
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <GradientText
                        colors={[
                            '#FFD700',
                            '#FFB300',
                            '#FF8C00',
                            '#FF4500',
                            '#B22222',
                        ]}
                        animationSpeed={3}
                        showBorder={false}
                        className="custom-class"
                    >
                        <span className="text-xs">Điểm tích lũy:</span>
                        {isLoadingPoints ? (
                            <BiRefresh className="animate-spin" />
                        ) : (
                            <span className="text-xs font-bold px-2">
                                {user?.rewardsPoint?.toLocaleString() || 0}
                            </span>
                        )}
                    </GradientText>
                    <button
                        onClick={fetchUserPoints}
                        disabled={isLoadingPoints}
                        className="text-orange-600 hover:text-orange-400 disabled:opacity-50"
                    >
                        <BiRefresh
                            className={`inline-block ${
                                isLoadingPoints ? 'animate-spin' : ''
                            }`}
                        />
                    </button>
                </div>
            </div>
            <Divider />

            <div className="grid gap-1">
                {links.map((l) => (
                    <Link
                        key={l.href}
                        to={l.href}
                        onClick={close}
                        className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-amber-100 rounded-md hover:scale-[1.02]"
                    >
                        <p className="text-slate-800">{l.icon}</p>
                        {l.label}
                    </Link>
                ))}
            </div>
            <Divider />

            <div className="pb-2">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium
                    text-red-600 hover:bg-red-50 rounded-md hover:scale-[1.02] transition-all duration-300 ease-out"
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default UserMenu;
