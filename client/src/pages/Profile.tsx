import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import defaultAvatar from '../assets/defaultAvatar.png';
import Axios from '@/utils/Axios';
import SummaryApi from '@/common/SummaryApi';
import fetchUserDetails from '@/utils/fetchUserDetails';
import { setUserDetails, updatedAvatar } from '@/store/userSlice';
import AxiosToastError from '@/utils/AxiosToastError';
import LiquidEther from '@/components/LiquidEther';
import GlareHover from '@/components/GlareHover';
import Loading from '@/components/Loading';

const Profile = () => {
    const user = useSelector((state: RootState) => state?.user);
    const [userData, setUserData] = useState({
        name: user.name,
        email: user.email,
        mobile: user.mobile,
    });

    const [loading, setLoading] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [isModified, setIsModified] = useState(false);
    const [mobileError, setMobileError] = useState('');
    const dispatch = useDispatch();

    const validateMobile = (mobile) => {
        // Vietnamese phone number validation
        // Starts with 0, followed by 9 or 1-9, then 8 more digits (total 10 digits)
        const mobileRegex = /^(0[1-9]|0[1-9][0-9]{8})$/;
        if (!mobile) {
            setMobileError('Vui lòng nhập số điện thoại');
            return false;
        }
        if (!mobileRegex.test(mobile)) {
            setMobileError('Số điện thoại không hợp lệ');
            return false;
        }
        setMobileError('');
        return true;
    };

    useEffect(() => {
        setUserData({
            name: user.name,
            email: user.email,
            mobile: user.mobile,
        });
        setIsModified(false);
    }, [user]);

    // Check if name or mobile has been modified
    useEffect(() => {
        const isNameModified = userData.name !== user.name;
        const isMobileModified = userData.mobile !== user.mobile;
        setIsModified(isNameModified || isMobileModified);
    }, [userData, user.name, user.mobile]);

    const handleOnChange = (e) => {
        const { name, value } = e.target;

        setUserData((prev) => {
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const handleUploadAvatar = async (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.upload_avatar,
                data: formData,
            });

            const { data: responseData } = response;
            dispatch(updatedAvatar(responseData.data.avatar));
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate mobile number before submission
        if (!validateMobile(userData.mobile)) {
            return;
        }

        try {
            setLoading(true);

            const response = await Axios({
                ...SummaryApi.update_user,
                data: userData,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                const userData = await fetchUserDetails();
                dispatch(setUserDetails(userData.data));
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <LiquidEther
                    colors={['#CBB3A7', '#A6B1E1', '#B7CADB']}
                    isViscous={false}
                    iterationsViscous={8}
                    iterationsPoisson={8}
                    resolution={0.2}
                    autoDemo={true}
                    autoSpeed={0.2}
                    autoRampDuration={1}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
            <form
                onSubmit={handleSubmit}
                className="container mx-auto grid gap-2 z-10 relative"
            >
                <Card className="border-2">
                    <CardHeader className="py-4">
                        <CardTitle className="font-bold uppercase">
                            Tài khoản
                        </CardTitle>
                        <CardDescription>
                            Quản lý thông tin tài khoản
                        </CardDescription>
                    </CardHeader>
                </Card>
                <Card className="space-y-4 py-4">
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Label>Current Avatar</Label>
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage
                                        src={user?.avatar || defaultAvatar}
                                        alt={user?.name || 'User'}
                                    />
                                    <AvatarFallback>
                                        {(user?.name || 'U')
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div>
                                <Label htmlFor="uploadProfile">
                                    {loading ? 'Đang tải lên...' : 'Chọn ảnh'}
                                </Label>
                                <Input
                                    onChange={handleUploadAvatar}
                                    type="file"
                                    accept="image/*"
                                    id="uploadProfile"
                                    className="hidden"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="full-name">Full Name</Label>
                            <Input
                                type="text"
                                placeholder="Nhập họ và tên"
                                value={userData.name}
                                name="name"
                                onChange={handleOnChange}
                                required
                                spellCheck={false}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                type="email"
                                value={userData.email}
                                name="email"
                                onChange={handleOnChange}
                                required
                                disabled
                                spellCheck={false}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                type="tel"
                                placeholder="Nhập số điện thoại"
                                value={userData.mobile}
                                name="mobile"
                                onChange={(e) => {
                                    handleOnChange(e);
                                    // Clear error when user starts typing
                                    if (mobileError) {
                                        validateMobile(e.target.value);
                                    }
                                }}
                                onBlur={(e) => validateMobile(e.target.value)}
                                required
                                spellCheck={false}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <GlareHover
                            background="transparent"
                            glareOpacity={0.3}
                            glareAngle={-30}
                            glareSize={300}
                            transitionDuration={800}
                            playOnce={false}
                        >
                            <Button
                                type="submit"
                                disabled={!mobileError && !isModified}
                                className="w-full h-12 text-sm font-bold text-foreground shadow-none cursor-pointer hover:bg-transparent border-border"
                            >
                                {loading ? <Loading /> : 'Lưu thay đổi'}
                            </Button>
                        </GlareHover>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
};

export default Profile;
