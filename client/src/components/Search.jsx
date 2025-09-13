import React, { useEffect, useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { IoSearch } from 'react-icons/io5';
import { GiReturnArrow } from 'react-icons/gi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useMobile from '../hooks/useMobile';

const Search = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSearchPage, setIsSearchPage] = useState(false);
    const [isMobile] = useMobile();
    const params = useLocation();
    const searchText = params.search.slice(3);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        const isSearch = location.pathname === '/search';
        setIsSearchPage(isSearch);
    }, [location]);

    const redirectToSearchPage = () => {
        navigate('/search');
    };

    const handleOnChange = (e) => {
        const value = e.target.value;
        const url = `/search?q=${value}`;
        setIsTyping(true);
        navigate(url);
        setTimeout(() => {
            setIsTyping(false);
        }, 200);
    };

    return (
        <div
            className="w-full my-2 sm:my-0 h-8 sm:h-12 rounded-3xl border-[3px] border-inset overflow-hidden
        flex items-center text-neutral-500 bg-base-100 group focus-within:border-secondary-100"
        >
            <div>
                {isMobile && isSearchPage ? (
                    <Link
                        to={'/'}
                        className="flex justify-center items-center h-full p-1 m-2 group-focus-within:text-secondary-200
                    bg-white shadow-sm shadow-secondary-100 group-focus-within:shadow-secondary-100 rounded-full"
                    >
                        <GiReturnArrow size={14} />
                    </Link>
                ) : (
                    <button
                        className="flex justify-center items-center h-full p-4
                    group-focus-within:text-secondary-200 font-bold text-secondary-200"
                    >
                        <IoSearch size={18} />
                    </button>
                )}
            </div>
            <div className="w-full h-full">
                {!isSearchPage ? (
                    // Not in Search Page
                    <div
                        onClick={redirectToSearchPage}
                        className="w-full h-full flex items-center sm:text-base text-xs sm:pt-0 pt-[4px]
                    text-secondary-200 font-medium"
                    >
                        <TypeAnimation
                            sequence={[
                                'Tìm kiếm "điện thoại"',
                                1000,
                                'Tìm kiếm "iPad"',
                                1000,
                                'Tìm kiếm "laptop"',
                                1000,
                                'Tìm kiếm "tai nghe"',
                                1000,
                                'Tìm kiếm "tivi"',
                                1000,
                            ]}
                            wrapper="span"
                            speed={60}
                            repeat={Infinity}
                        />
                    </div>
                ) : (
                    // Search Page
                    <div className="relative w-full h-full">
                        <input
                            type="text"
                            placeholder="Bạn muốn mua gì hôm nay?"
                            autoFocus={true}
                            className="bg-transparent w-full h-full sm:text-base text-xs sm:pt-0 pt-[1px] outline-none
                            text-secondary-200"
                            defaultValue={searchText}
                            onChange={handleOnChange}
                            spellCheck={false}
                        />
                        {isTyping && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary-200"></div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
