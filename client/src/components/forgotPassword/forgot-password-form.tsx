import type React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import GlareHover from '../GlareHover';
import { Link, useNavigate } from 'react-router-dom';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '@/utils/AxiosToastError';
import Loading from '../Loading';

export function ForgotPasswordForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<'form'>) {
    const [data, setData] = useState({
        email: '',
    });

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.forgot_password,
                data: data,
            });

            if (response.data.error) {
                toast.error(response.data.message);
            }

            if (response.data.success) {
                toast.success(response.data.message);
                navigate('/verification-otp', {
                    state: data,
                });

                setData({
                    email: '',
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
                <h1 className="text-2xl font-bold">Quên Mật Khẩu</h1>
                <p className="text-balance text-sm">
                    Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn mã
                    OTP.
                </p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        autoFocus
                        placeholder="Nhập email của bạn"
                        onChange={handleChange}
                        value={data.email}
                        className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white/20 focus:border-[#3F3FF3]"
                        required
                    />
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
                        {loading ? <Loading /> : 'Gửi OTP'}
                    </Button>
                </GlareHover>
            </div>
            <div className="text-center text-sm">
                Nhớ mật khẩu?{' '}
                <Link
                    to={'/login'}
                    className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer text-red-700"
                >
                    Quay lại đăng nhập.
                </Link>
            </div>
        </form>
    );
}
