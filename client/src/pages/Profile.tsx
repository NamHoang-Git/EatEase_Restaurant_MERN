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
        <form
            onSubmit={handleSubmit}
            className="container mx-auto py-10 grid gap-2"
        >
            <Card className="">
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                        Manage your account information
                    </CardDescription>
                </CardHeader>
            </Card>
            <Tabs defaultValue="account" className="space-y-4">
                <TabsContent value="account">
                    <Card>
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
                                        {loading
                                            ? 'Đang tải lên...'
                                            : 'Chọn ảnh'}
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
                                    onBlur={(e) =>
                                        validateMobile(e.target.value)
                                    }
                                    required
                                    spellCheck={false}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className={`px-6 py-2 ${
                                    !mobileError && isModified
                                        ? 'bg-primary-3 hover:opacity-80'
                                        : 'bg-gray-300 cursor-not-allowed'
                                } text-secondary-200 font-bold rounded-lg focus:outline-none
                                    focus:ring-2 focus:ring-offset-2 focus:ring-secondary-100 disabled:opacity-50 flex items-center`}
                            >
                                {loading ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Lưu thay đổi...
                                    </>
                                ) : (
                                    'Lưu thay đổi'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </form>
    );
};

export default Profile;
