import React, { useEffect, useState, ChangeEvent } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { IoSearch } from 'react-icons/io5';
import { GiReturnArrow } from 'react-icons/gi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useMobile from '../hooks/useMobile';

const Search: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSearchPage, setIsSearchPage] = useState<boolean>(false);
    const [isMobile] = useMobile();
    const params = useLocation();
    const searchText = params.search?.slice(3) || '';
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>('');

    useEffect(() => {
        const isSearch = location.pathname === '/search';
        setIsSearchPage(isSearch);

        // Update search value when URL changes
        if (location.pathname === '/search' && location.search) {
            const searchParams = new URLSearchParams(location.search);
            setSearchValue(searchParams.get('q') || '');
        }
    }, [location]);

    const redirectToSearchPage = (): void => {
        navigate('/search');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    let timer: ReturnType<typeof setTimeout>;

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value;
        setSearchValue(value);
        const url = value
            ? `/search?q=${encodeURIComponent(value)}`
            : '/search';
        setIsTyping(true);
        navigate(url);

        // Nếu người dùng gõ tiếp, hủy timer cũ
        clearTimeout(timer);

        timer = setTimeout(() => {
            setIsTyping(false);
        }, 200);
    };

    return (
        <search className="cursor-pointer liquid-glass-menu max-w-2xl container mx-auto rounded-3xl">
            <div
                className="md:px-8 px-2 sm:my-0 h-8 sm:h-12 rounded-3xl border-[3px] overflow-hidden
                flex items-center text-sm text-red-600 liquid-glass group focus-within:border-purple-400"
            >
                <div>
                    {isMobile && isSearchPage ? (
                        <Link
                            to={'/'}
                            className="flex justify-center items-center h-full p-1 m-2 group-focus-within:text-purple-400
                        shadow-sm shadow-purple-400 group-focus-within:shadow-purple-400 rounded-full"
                        >
                            <GiReturnArrow size={14} />
                        </Link>
                    ) : (
                        <button
                            onClick={redirectToSearchPage}
                            className="p-1 m-2 group-focus-within:text-purple-400
                            shadow-sm shadow-purple-400 group-focus-within:shadow-purple-400 rounded-full"
                        >
                            <IoSearch size={16} />
                        </button>
                    )}
                </div>
                <input
                    type="text"
                    placeholder={
                        isSearchPage
                            ? 'Tìm kiếm sản phẩm...'
                            : 'Bạn muốn ăn gì hôm nay?'
                    }
                    className={`bg-transparent outline-none w-full h-full px-2 placeholder-red-400/70 text-sm sm:text-base ${
                        isSearchPage ? 'cursor-text' : 'cursor-pointer'
                    }`}
                    value={searchValue}
                    onChange={handleOnChange}
                    onClick={!isSearchPage ? redirectToSearchPage : undefined}
                    readOnly={!isSearchPage}
                />
                {isSearchPage && searchValue && (
                    <button
                        onClick={() => {
                            setSearchValue('');
                            navigate('/search');
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors px-2"
                    >
                        ✕
                    </button>
                )}
            </div>
            {isSearchPage && !isTyping && !searchValue && (
                <div className="text-center mt-2 text-sm text-gray-400">
                    <TypeAnimation
                        sequence={[
                            'Nhập tên món ăn bạn muốn tìm...',
                            1000,
                            'Ví dụ: Phở bò, Bánh mì, Cơm tấm...',
                            1000,
                        ]}
                        wrapper="span"
                        speed={50}
                        style={{
                            fontSize: '0.875rem',
                            display: 'inline-block',
                        }}
                        repeat={Infinity}
                    />
                </div>
            )}
        </search>
    );
};

export default Search;
