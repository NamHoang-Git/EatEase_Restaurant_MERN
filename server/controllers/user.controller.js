import sendEmail from '../config/sendEmail.js'
import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import verifyEmailTemplate from './../utils/verifyEmailTemplate.js';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';
import uploadImageCloudinary from '../utils/uploadImageCloudinary.js';
import generatedOtp from '../utils/generatedOtp.js';
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js';
import jwt from 'jsonwebtoken'

// Register Controller
export async function registerUserController(req, res) {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập các trường bắt buộc",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({ email })

        if (user) {
            return res.json({
                message: "Email đã tồn tại",
                error: true,
                success: false
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(password, salt)

        const payload = {
            name,
            email,
            password: hashPassword
        }

        const newUser = new UserModel(payload)
        const save = await newUser.save()

        const VerifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`

        const verifyEmail = await sendEmail({
            sendTo: email,
            subject: "Xác nhận email từ EcomSpace",
            html: verifyEmailTemplate({
                name,
                url: VerifyEmailUrl
            })
        })

        return res.json({
            message: "Đăng ký thành công",
            error: false,
            success: true,
            data: save
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// Verify Email
export async function verifyEmailController(req, res) {
    try {
        const { code } = req.body

        const user = await UserModel.findOne({ _id: code })

        if (!user) {
            return res.status(400).json({
                message: "Mã không hợp lệ",
                error: true,
                success: false
            })
        }

        const updateUser = await UserModel.updateOne({ _id: code }, {
            verify_email: true
        })

        return res.json({
            message: "Xác nhận email thành công",
            error: false,
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: true
        })
    }
}

// Login Controller
export async function loginController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập email, mật khẩu",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Tài khoản không tồn tại",
                error: true,
                success: false
            });
        }

        if (user.status !== "Active") {
            return res.status(400).json({
                message: "Liên hệ Admin",
                error: true,
                success: false
            });
        }

        const checkPassword = await bcryptjs.compare(password, user.password);

        if (!checkPassword) {
            return res.status(400).json({
                message: "Mật khẩu không chính xác",
                error: true,
                success: false
            });
        }

        const accessToken = await generatedAccessToken(user._id);
        const refreshToken = await generatedRefreshToken(user._id);

        const updateUser = await UserModel.findByIdAndUpdate(user?._id, {
            last_login_date: new Date()
        });

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        };

        // Lưu token vào cookie (vẫn giữ cho bảo mật)
        res.cookie('accessToken', accessToken, cookiesOption);
        res.cookie('refreshToken', refreshToken, cookiesOption);

        // Trả token trong response body để frontend sử dụng
        return res.json({
            message: "Đăng nhập thành công",
            error: false,
            success: true,
            data: {
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// Logout Controller
export async function logoutController(req, res) {
    try {
        const userId = req.userId // middleware

        const cookiesOption = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }

        res.clearCookie("accessToken", cookiesOption)
        res.clearCookie("refreshToken", cookiesOption)

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userId, {
            refresh_token: ""
        })

        return res.json({
            message: "Đăng xuất thành công",
            error: false,
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// Upload User Avatar
export async function uploadAvatar(req, res) {
    try {
        const userId = req.userId // auth middleware
        const image = req.file // multer middleware

        const upload = await uploadImageCloudinary(image)

        const updateUser = await UserModel.findByIdAndUpdate(userId, {
            avatar: upload.url
        })

        return res.json({
            message: "Upload avatar thành công",
            success: true,
            error: false,
            data: {
                _id: userId,
                avatar: upload.url
            }
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// Update User Details
export async function updateUserDetails(req, res) {
    try {
        const userId = req.userId // auth middleware
        const { name, email, mobile, password } = req.body

        let hashPassword = ""

        if (password) {
            const salt = await bcryptjs.genSalt(10)
            hashPassword = await bcryptjs.hash(password, salt)
        }

        const updateUser = await UserModel.updateOne({ _id: userId }, {
            ...(name && { name: name }),
            ...(email && { email: email }),
            ...(mobile && { mobile: mobile }),
            ...(password && { password: hashPassword }),
        })

        return res.json({
            message: "Cập nhật thông tin thành công",
            error: false,
            success: true,
            data: updateUser
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// Forgot Password API (not login)
export async function forgotPasswordController(req, res) {
    try {
        const { email } = req.body

        const user = await UserModel.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: "Email không tồn tại",
                error: true,
                success: false
            })
        }

        const otp = generatedOtp()
        const expireTime = new Date() + 60 * 60 * 1000 // 1hr

        const update = await UserModel.findByIdAndUpdate(user._id, {
            forgot_password_otp: otp,
            forgot_password_expiry: new Date(expireTime).toISOString()
        })

        await sendEmail({
            sendTo: email,
            subject: "Quên mật khẩu từ EcomSpace",
            html: forgotPasswordTemplate({
                name: user.name,
                otp: otp
            })
        })

        return res.json({
            message: "Kiểm tra email",
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// Verify Forgot Password Otp
export async function verifyForgotPasswordOtp(req, res) {
    try {
        const { email, otp } = req.body

        if (!email || !otp) {
            return res.status(400).json({
                message: "Vui lòng nhập email, otp.",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: "Email không tồn tại",
                error: true,
                success: false
            })
        }

        const currentTime = new Date().toISOString()

        if (user.forgot_password_expiry < currentTime) {
            return res.status(400).json({
                message: "Mã OTP đã hết hạn",
                error: true,
                success: false
            })
        }

        if (otp !== user.forgot_password_otp) {
            return res.status(400).json({
                message: "Mã OTP không chính xác",
                error: true,
                success: false
            })
        }

        const updateUser = await UserModel.findByIdAndUpdate(user?._id, {
            forgot_password_otp: '',
            forgot_password_expiry: ''
        })

        return res.json({
            message: "Xác nhận mã OTP thành công",
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// Verify Password
export async function verifyPassword(req, res) {
    try {
        const { password } = req.body;
        const userId = req.userId; // Changed from req.user._id to req.userId

        if (!password) {
            return res.status(400).json({
                message: "Vui lòng nhập mật khẩu hiện tại",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findById(userId).select('+password');

        if (!user) {
            return res.status(404).json({
                message: "Người dùng không tồn tại",
                error: true,
                success: false
            });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Mật khẩu không chính xác",
                error: true,
                success: false
            });
        }

        return res.json({
            message: "Xác thực mật khẩu thành công",
            error: false,
            success: true,
            email: user.email
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// Change Password
export async function changePassword(req, res) {
    try {
        const { newPassword, confirmPassword } = req.body;
        const userId = req.user._id;

        // Get user email for resetPassword function
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "Người dùng không tồn tại",
                error: true,
                success: false
            });
        }

        // Reuse resetPassword logic
        return resetPassword({
            ...req,
            body: {
                email: user.email,
                newPassword,
                confirmPassword
            }
        }, res);

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// Reset the Password
export async function resetPassword(req, res) {
    try {
        const { email, newPassword, confirmPassword } = req.body

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "Vui lòng nhập các trường bắt buộc",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: "Email không tồn tại",
                error: true,
                success: false
            })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Mật khẩu mới và mật khẩu xác nhận phải giống nhau.",
                error: true,
                success: false
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(newPassword, salt)

        const updater = await UserModel.findOneAndUpdate(user._id, {
            password: hashPassword
        })

        return res.json({
            message: "Mật khẩu đã được cập nhật",
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// Refresh Token API Controller
export async function refreshTokenController(req, res) {
    try {
        const refreshToken = req?.headers?.authorization?.split(" ")[1];

        if (!refreshToken) {
            return res.status(400).json({
                message: "Token không hợp lệ",
                error: true,
                success: false
            });
        }

        const verifyToken = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);

        if (!verifyToken) {
            return res.status(400).json({
                message: "Token hết hạn",
                error: true,
                success: false
            });
        }

        const userId = verifyToken?._id;
        const newAccessToken = await generatedAccessToken(userId);

        return res.json({
            message: "Token mới đã được tạo",
            error: false,
            success: true,
            data: {
                accessToken: newAccessToken,
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// Get Login User Details
export async function userDetails(req, res) {
    try {
        const userId = req.userId

        const user = await UserModel.findById(userId).select('-password -refresh_token')

        return res.json({
            message: 'Chi tiết người dùng',
            data: user,
            error: false,
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: 'Có lỗi xảy ra',
            error: true,
            success: false
        })
    }
}

export async function userPoints(req, res) {
    try {
        const userId = req.userId

        const user = await UserModel.findById(userId).select('points -password -refresh_token')

        return res.json({
            message: 'Điểm người dùng',
            data: user,
            error: false,
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: 'Có lỗi xảy ra',
            error: true,
            success: false
        })
    }
}