import { Outlet, useLocation } from 'react-router-dom';
import './App.css';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUserDetails } from './store/userSlice';
import { setAllCategory, setLoadingCategory } from './store/productSlice';
import Axios from './utils/Axios';
import SummaryApi from './common/SummaryApi';
import GlobalProvider from './provider/GlobalProvider';
import CartMobileLink from './components/CartMobile';
import AxiosToastError from './utils/AxiosToastError';
import fetchUserDetails from './utils/fetchUserDetails';
import { Footer } from './components/footer';
import Header from '@/components/Header';

function App() {
    const dispatch = useDispatch();
    const location = useLocation();
    const hiddenCartLinkPaths = ['/checkout', '/cart'];
    const hideLayout = [
        '/admin',
        '/dashboard',
        '/login',
        '/register',
        '/registration-success',
        '/forgot-password',
        '/verification-otp',
        '/reset-password',
    ].some((path) => location.pathname.startsWith(path));

    useEffect(() => {
        (async () => {
            const res = await fetchUserDetails();
            dispatch(setUserDetails(res?.success ? res.data : null));

            try {
                dispatch(setLoadingCategory(true));
                const catRes = await Axios({ ...SummaryApi.get_menu_category });

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
            {!hideLayout && (
                <>
                    <Header />
                    <main className="min-h-[80vh]">
                        <Outlet />
                    </main>
                    <Footer />
                    {!hiddenCartLinkPaths.includes(location.pathname) && (
                        <CartMobileLink />
                    )}
                </>
            )}
            {hideLayout && (
                <main className="min-h-screen">
                    <Outlet />
                </main>
            )}
            <Toaster />
        </GlobalProvider>
    );
}

export default App;
