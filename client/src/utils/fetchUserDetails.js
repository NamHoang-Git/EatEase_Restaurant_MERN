import Axios from "./Axios";
import SummaryApi from "../common/SummaryApi";

const fetchUserDetails = async () => {
    // Kiểm tra token trước khi gọi API
    const accessToken = localStorage.getItem('accesstoken');
    if (!accessToken) {
        return {
            success: false,
            data: null,
            message: "You have not login",
        };
    }

    try {
        const response = await Axios({
            ...SummaryApi.user_details,
        });
        return response.data; // { success, data, message }
    } catch (error) {
        // Suppress console errors và toast nếu là 401
        if (error.response?.status === 401 || error.suppressToast) {
            console.log('🔕 Suppressed fetchUserDetails error');
        } else {
            console.error("fetchUserDetails error:", error.response?.data || error.message);
        }

        // Trả về object thống nhất
        return {
            success: false,
            data: null,
            message: "You have not login",
        };
    }
};

export default fetchUserDetails;
