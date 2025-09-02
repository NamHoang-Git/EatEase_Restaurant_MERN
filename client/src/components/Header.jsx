import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.png';
import Search from './Search';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCartPlus } from 'react-icons/fa6';
import {
    FaCaretDown,
    FaCaretUp,
    FaUserAlt,
    FaUserCheck,
    FaUserTimes,
} from 'react-icons/fa';
import useMobile from '../hooks/useMobile';
import { useSelector } from 'react-redux';
import UserMenu from './UserMenu';
import { DisplayPriceInVND } from '../utils/DisplayPriceInVND';
import { useGlobalContext } from '../provider/GlobalProvider';
import DisplayCartItem from './DisplayCartItem';
import defaultAvatar from '../assets/defaultAvatar.png';

const Header = () => {
    const [isMobile] = useMobile();
    const location = useLocation();
    const isSearchPage = location.pathname === '/search';
    const navigate = useNavigate();
    const user = useSelector((state) => state?.user);
    const [openUserMenu, setOpenUserMenu] = useState(false);
    const cartItem = useSelector((state) => state.cartItem.cart);
    const { totalPrice, totalQty } = useGlobalContext();
    const [openCartSection, setOpenCartSection] = useState(false);

    const [scrolled, setScrolled] = useState(false);

    const redirectToLoginPage = () => {
        navigate('/login');
    };

    const handleCloseUserMenu = () => {
        setOpenUserMenu(false);
    };

    const handleMobileUser = () => {
        if (!user._id) {
            navigate('/login');
            return;
        }

        navigate('/user');
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        if (location.pathname === '/') {
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        } else {
            setScrolled(true); // luôn trắng ở các trang khác
        }
    }, [location.pathname]);

    return (
        <header
            className={`${
                location.pathname === '/'
                    ? 'fixed top-0 left-0 right-0 z-50 min-w-full'
                    : 'sticky top-0 left-0 right-0 z-50 min-w-full'
            } ${
                scrolled
                    ? 'bg-zinc-800 shadow-md shadow-black'
                    : 'bg-opacity-45 bg-black border-b-[3px] border-b-black'
            }`}
        >
            <div className="w-full max-w-[100vw] overflow-x-hidden">
                <div className="lg:h-28 p-4 flex flex-col justify-center gap-2 shadow-lg">
                    {!(isSearchPage && isMobile) && (
                        <div className="container mx-auto flex items-center gap-4 px-2 justify-between">
                            {/* Search */}
                            <div className="hidden lg:block lg:flex-1">
                                <Search />
                            </div>

                            {/* {Logo} */}
                            <div className="h-full lg:flex-1">
                                <Link
                                    to={'/'}
                                    onClick={scrollToTop}
                                    className="h-full flex justify-center items-center"
                                >
                                    <img
                                        src={logo}
                                        width={120}
                                        alt="logo"
                                        className="hidden lg:block"
                                    />
                                    <img
                                        src={logo}
                                        width={120}
                                        alt="logo"
                                        className="hidden lg:hidden sm:block"
                                    />
                                    <img
                                        src={logo}
                                        width={80}
                                        alt="logo"
                                        className="lg:hidden sm:hidden"
                                    />
                                </Link>
                            </div>

                            {/* Login & My Cart */}
                            <div className="lg:flex-1">
                                {/* { User icons display in only Mobile version } */}
                                {user?._id ? (
                                    <button
                                        className="text-secondary-200 flex items-center justify-end lg:hidden
                                border-2 border-secondary-100 bg-primary-2 rounded-xl p-2"
                                        onClick={handleMobileUser}
                                    >
                                        <FaUserCheck size={26} />
                                    </button>
                                ) : (
                                    <button
                                        className="text-secondary-200 flex items-center justify-end lg:hidden
                                border-2 border-primary-200 bg-primary-4 rounded-xl p-2"
                                        onClick={handleMobileUser}
                                    >
                                        <FaUserTimes size={26} />
                                    </button>
                                )}

                                {/* { Desktop } */}
                                <div className="hidden lg:flex items-center justify-end gap-8">
                                    {user?._id ? (
                                        <div className="relative">
                                            <div
                                                onClick={() =>
                                                    setOpenUserMenu((prev) => !prev)
                                                }
                                                className="flex select-none items-center gap-1 cursor-pointer transition-all duration-300 ease-in-out"
                                            >
                                                <img
                                                    src={user.avatar || defaultAvatar}
                                                    alt={user.name}
                                                    className="w-[52px] h-[52px] rounded-full border-[3px] border-inset border-primary-200"
                                                />
                                                {openUserMenu ? (
                                                    <FaCaretUp
                                                        size={20}
                                                        className="text-primary-200"
                                                    />
                                                ) : (
                                                    <FaCaretDown
                                                        size={20}
                                                        className="text-primary-200"
                                                    />
                                                )}
                                            </div>
                                            {openUserMenu && (
                                                <div className="absolute right-0 top-[60px]">
                                                    <div className="bg-white min-w-[216px] lg:shadow-md lg:shadow-secondary-100 rounded p-4">
                                                        <UserMenu
                                                            close={
                                                                handleCloseUserMenu
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={redirectToLoginPage}
                                            className={`${
                                                scrolled
                                                    ? 'text-base-100'
                                                    : 'text-primary-100'
                                            } text-lg font-bold px-2 underline`}
                                        >
                                            Login
                                        </button>
                                    )}
                                    <button
                                        onClick={
                                            user?._id
                                                ? () => setOpenCartSection(true)
                                                : redirectToLoginPage
                                        }
                                        className="flex items-center gap-2 bg-primary-3 hover:bg-green-800 p-3
                                rounded-lg text-secondary-200 font-bold"
                                    >
                                        {/* { Add to cart icons } */}
                                        <div className="animate-bounce">
                                            <FaCartPlus size={22} />
                                        </div>
                                        <div className="font-semibold text-sm">
                                            {cartItem[0] ? (
                                                <div className="ml-1 flex flex-col items-center justify-center">
                                                    <p>{totalQty} Items</p>
                                                    <p>
                                                        {DisplayPriceInVND(
                                                            totalPrice
                                                        )}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p>My Cart</p>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="container mx-auto px-2 lg:hidden">
                        <Search />
                    </div>

                    {openCartSection && (
                        <DisplayCartItem close={() => setOpenCartSection(false)} />
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
