import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import fetchUserDetails from './utils/fetchUserDetails';
import { useDispatch } from 'react-redux';
import { setUserDetails } from './store/userSlice';
import { setAllCategory, setLoadingCategory } from './store/productSlice';
import Axios from './utils/Axios';
import SummaryApi from './common/SummaryApi';
import GlobalProvider from './provider/GlobalProvider';
import CartMobileLink from './components/CartMobile';
import AxiosToastError from './utils/AxiosToastError';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import OtpVerification from './pages/OtpVerification';
import ResetPassword from './pages/ResetPassword';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import Header from './components/Header';
import { Footer } from './components/footer';
import ProductListPage from './pages/ProductListPage';

function App() {
    const dispatch = useDispatch();
    const location = useLocation();
    const hiddenCartLinkPaths = ['/checkout', '/cart'];

    useEffect(() => {
        (async () => {
            // 1) User
            const res = await fetchUserDetails();
            dispatch(setUserDetails(res?.success ? res.data : null));

            try {
                dispatch(setLoadingCategory(true));
                const catRes = await Axios({ ...SummaryApi.get_category });

                if (catRes.data?.success) {
                    dispatch(
                        setAllCategory(
                            catRes.data.data.sort((a, b) =>
                                a.name.localeCompare(b.name)
                            )
                        )
                    );
                }
            } catch (error) {
                AxiosToastError(error);
            } finally {
                dispatch(setLoadingCategory(false));
            }
        })();
    }, [dispatch]);

    return (
        <GlobalProvider>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<SearchPage />} />
                </Route>

                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                    />
                    <Route
                        path="/verification-otp"
                        element={<OtpVerification />}
                    />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    <Route path="/dashboard/profile" element={<Profile />} />
                    <Route
                        path="/dashboard/category"
                        element={<CategoryPage />}
                    />
                </Route>
            </Routes>

            <Toaster />
            {!hiddenCartLinkPaths.includes(location.pathname) && (
                <CartMobileLink />
            )}
        </GlobalProvider>
    );
}

export default App;
