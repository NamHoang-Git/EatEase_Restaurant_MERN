import type React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import GlareHover from '../GlareHover';
import { FaFacebookSquare, FaGoogle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '@/utils/AxiosToastError';
import Loading from '../Loading';

export function RegisterForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<'form'>) {
    const [data, setData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // const handleKeyDown = (e) => {
    //     if (e.key === 'Enter') {
    //         e.preventDefault();
    //         const form = e.target.form;
    //         const focusable = Array.from(form.elements).filter(
    //             (el) =>
    //                 el.tagName === 'INPUT' ||
    //                 el.tagName === 'SELECT' ||
    //                 el.tagName === 'TEXTAREA'
    //         );
    //         const index = focusable.indexOf(e.target);
    //         if (index > -1 && index < focusable.length - 1) {
    //             focusable[index + 1].focus();
    //         }
    //     }
    // };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setData((prev) => {
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const valideValue = Object.values(data).every((el) => el);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

        const validTLDs = [
            'com',
            'net',
            'org',
            'io',
            'co',
            'ai',
            'vn',
            'com.vn',
            'edu.vn',
            'gov.vn',
        ];

        if (!emailRegex.test(email)) {
            return false;
        }

        const domain = email.split('@')[1];
        const tld = domain.split('.').slice(1).join('.');

        if (!validTLDs.includes(tld)) {
            return false;
        }

        if (
            email.includes('..') ||
            email.startsWith('.') ||
            email.endsWith('.') ||
            email.split('@')[0].endsWith('.')
        ) {
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateEmail(data.email)) {
            toast.error('Vui lòng nhập địa chỉ email hợp lệ');
            return;
        }

        if (data.password !== data.confirmPassword) {
            toast.error('Mật khẩu và mật khẩu xác nhận phải giống nhau');
            return;
        }

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.register,
                data: data,
            });

            if (response.data.error) {
                toast.error(response.data.message);
            }

            if (response.data.success) {
                toast.success(response.data.message);

                navigate('/registration-success', {
                    state: { email: data.email },
                    replace: true,
                });
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            className={cn(
                'flex flex-col gap-6 font-bold text-red-950',
                className
            )}
            {...props}
            onSubmit={handleSubmit}
        >
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl">Tạo Tài Khoản</h1>
                <p className="text-balance text-sm">
                    Tạo một tài khoản mới để bắt đầu sử dụng TechSpace.
                </p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="name">Tên người dùng</Label>
                    <Input
                        id="name"
                        type="text"
                        name="name"
                        autoFocus
                        placeholder="Nhập tên của bạn"
                        onChange={handleChange}
                        value={data.name}
                        className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white/20 focus:border-[#3F3FF3]"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        autoFocus
                        placeholder="m@example.com"
                        onChange={handleChange}
                        value={data.email}
                        className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white/20 focus:border-[#3F3FF3]"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="mobile">Số điện thoại</Label>
                    <Input
                        id="mobile"
                        type="tel"
                        name="mobile"
                        autoFocus
                        placeholder="Nhập số điện thoại của bạn"
                        onChange={handleChange}
                        value={data.mobile}
                        className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white/20 focus:border-[#3F3FF3]"
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Nhập mật khẩu"
                            onChange={handleChange}
                            value={data.password}
                            className="h-12 pr-10 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white/20 focus:border-[#3F3FF3]"
                            required
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            placeholder="Nhập lại mật khẩu để xác nhận"
                            onChange={handleChange}
                            value={data.confirmPassword}
                            className="h-12 pr-10 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white/20 focus:border-[#3F3FF3]"
                            required
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                <GlareHover
                    glareColor="#b91c1c"
                    background="#fff"
                    borderColor="#fff"
                    glareOpacity={0.3}
                    glareAngle={-30}
                    glareSize={300}
                    transitionDuration={800}
                    playOnce={false}
                >
                    <Button
                        disabled={!valideValue}
                        type="submit"
                        className="w-full h-12 text-sm font-bold text-red-700 hover:opacity-90 shadow-none cursor-pointer
                        bg-amber-50 border-amber-50"
                    >
                        {loading ? <Loading /> : 'Đăng ký'}
                    </Button>
                </GlareHover>

                <>
                    <div className="relative">
                        <div className="relative text-center text-sm uppercase flex items-center justify-between px-1.5">
                            <div
                                className="relative after:absolute after:inset-0 after:top-1/2 after:left-0 after:z-0 after:flex after:items-end
                        after:border-t after:border-t-red-950 w-16 md:w-28 xl:w-56"
                            ></div>
                            <span className="relative z-10 px-2">
                                Hoặc đăng ký bằng
                            </span>
                            <div
                                className="relative after:absolute after:inset-0 after:top-1/2 after:right-0 after:z-0 after:flex after:items-start
                        after:border-t after:border-t-red-950 w-16 md:w-28 xl:w-56"
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-black">
                        <Button
                            variant="outline"
                            className="flex items-center gap-2 h-12 border-gray-200 hover:bg-amber-100 hover:text-gray-900 rounded-lg
                            bg-white/90 shadow-none cursor-pointer"
                        >
                            <FaGoogle className="mb-1" />
                            Google
                        </Button>
                        <Button
                            variant="outline"
                            className="flex items-center gap-2 h-12 border-gray-200 hover:bg-amber-100 hover:text-gray-900 rounded-lg
                            bg-white/90 shadow-none cursor-pointer"
                        >
                            <FaFacebookSquare className="mb-1" />
                            Facebook
                        </Button>
                    </div>
                </>
            </div>
            <div className="text-center text-sm">
                Bạn đã có tài khoản?{' '}
                <Link
                    to={'/login'}
                    className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer text-red-700"
                >
                    Đăng nhập.
                </Link>
            </div>
        </form>
    );
}
