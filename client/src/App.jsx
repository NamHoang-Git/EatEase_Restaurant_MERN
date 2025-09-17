import { Outlet, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
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
            <Header />
            <main className="min-h-[80vh]">
                <Outlet />
            </main>
            <Footer />
            <Toaster />
            {!hiddenCartLinkPaths.includes(location.pathname) && (
                <CartMobileLink />
            )}
        </GlobalProvider>
    );
}

export default App;
