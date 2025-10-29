import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Menu, Briefcase, Tag, HelpCircle, FileText, Info } from 'lucide-react';
import logo from '../assets/logo.png';
import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    MouseEvent,
    KeyboardEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCartPlus } from 'react-icons/fa6';
import {
    FaBoxOpen,
    FaCaretDown,
    FaCaretUp,
    FaHome,
    FaSearch,
} from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { DisplayPriceInVND } from '../utils/DisplayPriceInVND';
import { useGlobalContext } from '../provider/GlobalProvider';
import DisplayCartItem from './DisplayCartItem';
import defaultAvatar from '../assets/defaultAvatar.png';
import Search from './Search';
import { valideURLConvert } from '@/utils/valideURLConvert';
import UserMenu from './UserMenu';
import { RootState } from '@/store/store';

// Define types for the link items
interface NavLink {
    href: string;
    icon: React.ReactNode;
    label: string;
}

// Define type for the user object
interface User {
    _id?: string;
    name: string;
    avatar?: string;
    role?: string;
}

// Define type for the cart item
interface CartItem {
    // Add cart item properties here based on your application's structure
    [key: string]: any;
}

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const categoryData =
        useSelector((state: RootState) => state.product?.allCategory) || [];
    const firstCategory = categoryData.length > 0 ? categoryData[0] : null;

    const links: NavLink[] = [
        {
            href: '/',
            icon: <FaHome size={14} className="" />,
            label: 'Trang chủ',
        },
        {
            href: firstCategory
                ? `/${valideURLConvert(firstCategory.name)}-${
                      firstCategory._id
                  }`
                : '/products',
            icon: <FaBoxOpen size={14} className="" />,
            label: 'Sản phẩm',
        },
    ];

    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state?.user) as User | null;
    const [openUserMenu, setOpenUserMenu] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const cartItem = useSelector(
        (state: RootState) => state.cartItem?.cart
    ) as CartItem[];
    const { totalPrice, totalQty } = useGlobalContext();
    const [openCartSection, setOpenCartSection] = useState<boolean>(false);

    // Handle clicks outside the menu
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (!menuRef.current) return;
            const target = event.target as Node;
            const isClickInside = menuRef.current.contains(target);
            const isToggleButton = (event.target as HTMLElement).closest(
                'button[aria-haspopup="true"]'
            );
            if (!isClickInside && !isToggleButton) {
                setOpenUserMenu(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpenUserMenu(false);
            }
        };

        // Add type assertions for the event listeners
        document.addEventListener(
            'mousedown',
            handleClick as unknown as EventListener,
            true
        );
        document.addEventListener(
            'keydown',
            handleEscape as unknown as EventListener
        );

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClick as unknown as EventListener,
                true
            );
            document.removeEventListener(
                'keydown',
                handleEscape as unknown as EventListener
            );
        };
    }, []);

    // Toggle user menu
    const toggleUserMenu = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenUserMenu((prev) => !prev);
    }, []);

    // Close menu
    const closeMenu = useCallback(() => {
        setOpenUserMenu(false);
    }, []);

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    const redirectToLoginPage = () => {
        navigate('/login');
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <header className="sticky top-0 z-50 p-4 text-amber-50 font-semibold">
                <div className="container mx-auto">
                    <div className="flex h-16 items-center justify-between px-6 liquid-glass-header rounded-full">
                        {/* Brand Logo */}
                        <Link
                            to="/"
                            onClick={scrollToTop}
                            className="flex items-center gap-1.5"
                        >
                            <img
                                src={logo}
                                alt="EatEase logo"
                                width={25}
                                height={25}
                            />
                            <span className="font-semibold tracking-wide">
                                EatEase
                            </span>
                        </Link>
                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-6">
                            <nav className="flex items-center gap-6 text-sm">
                                {links.map((l) => (
                                    <Link
                                        key={l.href}
                                        to={l.href}
                                        onClick={scrollToTop}
                                        className="hover:text-amber-200 transition-colors flex items-center gap-[6px]"
                                    >
                                        {l.label}
                                    </Link>
                                ))}
                            </nav>
                            <Link to="/search">
                                <FaSearch size={14} className="mb-[3px]" />
                            </Link>
                        </div>
                        {/* User */}
                        <div className="hidden md:flex items-center justify-end gap-5">
                            {user?._id ? (
                                <div className="relative" ref={menuRef}>
                                    <div className="relative">
                                        <button
                                            onClick={toggleUserMenu}
                                            className="flex items-center gap-2 w-full px-2 py-1.5 text-white rounded-lg hover:bg-white/10 transition-colors"
                                            aria-expanded={openUserMenu}
                                            aria-haspopup="true"
                                            aria-label="User menu"
                                            type="button"
                                        >
                                            <div className="relative p-0.5 overflow-hidden rounded-full liquid-glass">
                                                <img
                                                    src={
                                                        user.avatar ||
                                                        defaultAvatar
                                                    }
                                                    alt={user.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    width={32}
                                                    height={32}
                                                />
                                            </div>
                                            <div className="flex flex-col items-start flex-1 min-w-0">
                                                <span
                                                    title={user.name}
                                                    className="text-sm font-medium text-white truncate max-w-16 lg:max-w-20 xl:max-w-max"
                                                >
                                                    {user.name}
                                                </span>
                                                {user.role === 'ADMIN' && (
                                                    <span className="text-xs text-purple-400">
                                                        Quản trị viên
                                                    </span>
                                                )}
                                            </div>
                                            {openUserMenu ? (
                                                <FaCaretUp
                                                    className="flex-shrink-0 ml-2"
                                                    size={15}
                                                />
                                            ) : (
                                                <FaCaretDown
                                                    className="flex-shrink-0 ml-2"
                                                    size={15}
                                                />
                                            )}
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {openUserMenu && (
                                            <motion.div
                                                className="absolute right-0 top-full mt-2 z-50 w-64"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{
                                                    duration: 0.15,
                                                    ease: 'easeOut',
                                                }}
                                            >
                                                <UserMenu
                                                    close={closeMenu}
                                                    menuTriggerRef={menuRef as React.RefObject<HTMLDivElement>}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <button
                                    onClick={redirectToLoginPage}
                                    className="underline text-sm hover:text-amber-200 transition-colors"
                                >
                                    Đăng nhập
                                </button>
                            )}
                            <button
                                onClick={
                                    user?._id
                                        ? () => setOpenCartSection(true)
                                        : redirectToLoginPage
                                }
                                className={`${
                                    cartItem[0] ? ' py-1.5' : ' py-3'
                                } flex items-center gap-2 bg-lime-400 text-gray-700 font-medium rounded-lg px-3.5
                                hover:bg-lime-300 hover:shadow-md hover:scale-[1.02] transition-all`}
                            >
                                <div className="animate-bounce">
                                    <FaCartPlus size={20} />
                                </div>
                                <div className="font-bold text-sm">
                                    {cartItem[0] ? (
                                        <div className="ml-1 flex flex-col items-center justify-center">
                                            <p>{totalQty} sản phẩm</p>
                                            <p>
                                                {DisplayPriceInVND(totalPrice)}
                                            </p>
                                        </div>
                                    ) : (
                                        <p>Giỏ hàng</p>
                                    )}
                                </div>
                            </button>
                        </div>
                        {/* Mobile Nav */}
                        <div className="md:hidden">
                            <Sheet
                                open={isMobileMenuOpen}
                                onOpenChange={setIsMobileMenuOpen}
                            >
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="border-gray-700 bg-gray-800 text-white hover:bg-gray-600 hover:text-lime-300"
                                    >
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">
                                            Open menu
                                        </span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="right"
                                    className="liquid-glass text-white border-gray-800 p-0 w-72 flex flex-col"
                                >
                                    <div className="flex items-center gap-1.5 px-4 py-4 border-b border-gray-800">
                                        <Link
                                            to="/"
                                            onClick={scrollToTop}
                                            className="flex items-center gap-1.5"
                                        >
                                            <img
                                                src={logo}
                                                alt="EatEase logo"
                                                width={25}
                                                height={25}
                                                className="h-5 w-5"
                                            />
                                            <span className="font-semibold tracking-wide text-white">
                                                EatEase
                                            </span>
                                        </Link>
                                    </div>
                                    <div className="px-2">
                                        <Search />
                                    </div>
                                    <nav className="flex flex-col gap-1 mt-2 text-gray-200">
                                        {links.map((l) => (
                                            <Link
                                                key={l.href}
                                                to={l.href}
                                                onClick={() => {
                                                    closeMenu();
                                                    closeMobileMenu();
                                                    scrollToTop();
                                                }}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900 hover:text-purple-400 transition-colors"
                                            >
                                                <span className="inline-flex items-center justify-center w-5 h-5">
                                                    {l.icon}
                                                </span>
                                                <span className="text-sm">
                                                    {l.label}
                                                </span>
                                            </Link>
                                        ))}
                                    </nav>
                                    <div className="mt-auto border-t border-gray-800 p-4">
                                        <div className="flex items-center justify-center w-full gap-5">
                                            {user?._id ? (
                                                <div
                                                    className="relative w-full"
                                                    ref={menuRef}
                                                >
                                                    <div className="relative">
                                                        <button
                                                            onClick={
                                                                toggleUserMenu
                                                            }
                                                            className="flex items-center gap-2 w-full px-2 py-1.5 text-white rounded-lg hover:bg-white/10 transition-colors"
                                                            aria-expanded={
                                                                openUserMenu
                                                            }
                                                            aria-haspopup="true"
                                                            aria-label="User menu"
                                                            type="button"
                                                        >
                                                            <div className="relative p-0.5 overflow-hidden rounded-full liquid-glass">
                                                                <img
                                                                    src={
                                                                        user.avatar ||
                                                                        defaultAvatar
                                                                    }
                                                                    alt={
                                                                        user.name
                                                                    }
                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                    width={32}
                                                                    height={32}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col items-start flex-1 min-w-0">
                                                                <span
                                                                    title={
                                                                        user.name
                                                                    }
                                                                    className="text-sm font-medium text-white"
                                                                >
                                                                    {user.name}
                                                                </span>
                                                                {user.role ===
                                                                    'ADMIN' && (
                                                                    <span className="text-xs text-purple-400">
                                                                        Quản trị
                                                                        viên
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {openUserMenu ? (
                                                                <FaCaretDown
                                                                    className="flex-shrink-0 ml-2"
                                                                    size={15}
                                                                />
                                                            ) : (
                                                                <FaCaretUp
                                                                    className="flex-shrink-0 ml-2"
                                                                    size={15}
                                                                />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <AnimatePresence>
                                                        {openUserMenu && (
                                                            <motion.div
                                                                className="absolute right-0 bottom-full mb-2 z-50 w-64"
                                                                initial={{
                                                                    opacity: 0,
                                                                    y: 10,
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    y: 0,
                                                                }}
                                                                exit={{
                                                                    opacity: 0,
                                                                    y: -10,
                                                                }}
                                                                transition={{
                                                                    duration: 0.15,
                                                                    ease: 'easeOut',
                                                                }}
                                                            >
                                                                <UserMenu
                                                                    close={
                                                                        closeMenu
                                                                    }
                                                                    menuTriggerRef={
                                                                        menuRef
                                                                    }
                                                                />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={
                                                        redirectToLoginPage
                                                    }
                                                    className="w-full text-center py-2 px-4 bg-lime-400 text-gray-800 rounded-lg hover:bg-lime-300 transition-colors font-medium"
                                                >
                                                    Đăng nhập
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>
            <div className="hidden md:block z-10">
                <Search />
            </div>
            {openCartSection && (
                <DisplayCartItem close={() => setOpenCartSection(false)} />
            )}
        </>
    );
}
