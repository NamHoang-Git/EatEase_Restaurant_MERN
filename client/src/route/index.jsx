import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import Home from '@/pages/Home';
import SearchPage from '../pages/SearchPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import RegistrationSuccess from '@/pages/RegistrationSuccess';
import VerifyEmail from '@/pages/VerifyEmail';
import ForgotPassword from '@/pages/ForgotPassword';
import OtpVerification from '@/pages/OtpVerification';
import ResetPassword from '@/pages/ResetPassword';
import UserMenuMobile from '../pages/UserMenuMobile';
import Dashboard from '../layouts/Dashboard';
import Profile from '../pages/Profile';
import MyOrders from '../pages/MyOrders';
import CategoryPage from './../pages/CategoryPage';
import ProductAdmin from '../pages/ProductAdmin';
import AdminPermission from '../layouts/AdminPermission';
import ProductListPage from '../pages/ProductListPage';
import ProductDisplayPage from '../pages/ProductDisplayPage';
import CheckoutPage from './../pages/CheckoutPage';
import Success from './../pages/Success';
import Cancel from './../pages/Cancel';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import CartPage from '../pages/CartPage';
import BillPage from './../pages/BillPage';
import ReportPage from './../pages/ReportPage';
import VoucherPage from '../pages/VoucherPage';
import AdminDashboard from '@/layouts/AdminDashboard';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                path: '',
                element: <Home />,
            },
            {
                path: 'search',
                element: <SearchPage />,
            },
            {
                path: 'login',
                element: (
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                ),
            },
            {
                path: 'admin',
                element: (
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                ),
                children: [
                    {
                        path: 'dashboards',
                        element: <ReportPage />
                    },
                    {
                        path: 'profile',
                        element: <Profile />
                    },
                    // Add more admin routes here
                ]
            },
            {
                path: 'register',
                element: (
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                ),
            },
            {
                path: 'registration-success',
                element: (
                    <PublicRoute>
                        <RegistrationSuccess />
                    </PublicRoute>
                ),
            },
            {
                path: 'verify-email',
                element: (
                    <PublicRoute>
                        <VerifyEmail />
                    </PublicRoute>
                ),
            },
            {
                path: 'forgot-password',
                element: (
                    <PublicRoute>
                        <ForgotPassword />
                    </PublicRoute>
                ),
            },
            {
                path: 'verification-otp',
                element: (
                    <PublicRoute>
                        <OtpVerification />
                    </PublicRoute>
                ),
            },
            {
                path: 'reset-password',
                element: <ResetPassword />,
            },
            {
                path: 'user',
                element: <UserMenuMobile />,
            },
            {
                path: 'dashboard',
                element: (
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                ),
                children: [
                    {
                        path: 'profile',
                        element: <Profile />,
                    },
                    {
                        path: 'category',
                        element: (
                            <AdminPermission>
                                <CategoryPage />
                            </AdminPermission>
                        ),
                    },
                    {
                        path: 'product',
                        element: (
                            <AdminPermission>
                                <ProductAdmin />
                            </AdminPermission>
                        ),
                    },
                    {
                        path: 'bill',
                        element: (
                            <AdminPermission>
                                <BillPage />
                            </AdminPermission>
                        ),
                    },
                    {
                        path: 'report',
                        element: (
                            <AdminPermission>
                                <ReportPage />
                            </AdminPermission>
                        ),
                    },
                    {
                        path: 'voucher',
                        element: (
                            <AdminPermission>
                                <VoucherPage />
                            </AdminPermission>
                        ),
                    },
                    {
                        path: 'my-orders',
                        element: <MyOrders />,
                    },
                ],
            },
            {
                path: ':category',
                element: <ProductListPage />,
            },
            {
                path: 'product/:product',
                element: <ProductDisplayPage />,
            },
            {
                path: 'cart',
                element: <CartPage />,
            },
            {
                path: 'checkout',
                element: (
                    <ProtectedRoute>
                        <CheckoutPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'success',
                element: (
                    <ProtectedRoute>
                        <Success />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'cancel',
                element: (
                    <ProtectedRoute>
                        <Cancel />
                    </ProtectedRoute>
                ),
            },
        ],
    },
]);

export default router;
