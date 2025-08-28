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
        navigate(url);
    };

    return (
        <div
            className="w-full h-11 lg:h-12 rounded-3xl border-[3px] border-inset overflow-hidden
        flex items-center text-neutral-500 bg-base-100 group focus-within:border-secondary-100"
        >
            <div>
                {isMobile && isSearchPage ? (
                    <Link
                        to={'/'}
                        className="flex justify-center items-center h-full p-1 m-2 group-focus-within:text-secondary-200
                    bg-white shadow-md group-focus-within:shadow-secondary-100 rounded-full"
                    >
                        <GiReturnArrow size={18} />
                    </Link>
                ) : (
                    <button
                        className="flex justify-center items-center h-full p-4
                    group-focus-within:text-secondary-200 font-bold"
                    >
                        <IoSearch size={20} />
                    </button>
                )}
            </div>
            <div className="w-full h-full">
                {!isSearchPage ? (
                    // Not in Search Page
                    <div
                        onClick={redirectToSearchPage}
                        className="w-full h-full flex items-center"
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
                    <div className="w-full h-full">
                        <input
                            type="text"
                            placeholder="Bạn muốn mua gì hôm nay?"
                            autoFocus={true}
                            className="bg-transparent w-full h-full outline-none"
                            defaultValue={searchText}
                            onChange={handleOnChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
