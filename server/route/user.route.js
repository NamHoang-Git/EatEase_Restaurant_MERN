import { Router } from 'express'
import {
    changePassword, forgotPasswordController, loginController,
    logoutController, refreshTokenController, registerUserController, resetPassword,
    updateUserDetails, uploadAvatar, userDetails, verifyEmailController,
    verifyForgotPasswordOtp, verifyPassword
} from '../controllers/user.controller.js'
import { getUserPoints, calculatePointsForOrder, applyPointsToOrder } from '../controllers/pointsController.js';
import auth from '../middleware/auth.js'
import upload from './../middleware/multer.js';

const userRouter = Router()

userRouter.post('/register', registerUserController)
userRouter.post('/verify-email', verifyEmailController)
userRouter.post('/login', loginController)
userRouter.get('/logout', auth, logoutController)
userRouter.put('/upload-avatar', auth, upload.single('avatar'), uploadAvatar)
userRouter.put('/update-user', auth, updateUserDetails)
userRouter.put('/forgot-password', forgotPasswordController)
userRouter.put('/verify-forgot-password-otp', verifyForgotPasswordOtp)
userRouter.put('/reset-password', resetPassword)
userRouter.post('/refresh-token', refreshTokenController)
userRouter.post('/verify-password', auth, verifyPassword)
userRouter.put('/change-password', auth, changePassword)
userRouter.get('/user-details', auth, userDetails)

// Points related routes
userRouter.get('/points', auth, getUserPoints);
userRouter.post('/points/calculate', auth, calculatePointsForOrder);
userRouter.post('/points/apply', auth, applyPointsToOrder);

export default userRouter