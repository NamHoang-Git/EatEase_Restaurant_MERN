import toast from "react-hot-toast"

const AxiosToastError = (error) => {
    if (error?.suppressToast) {
        console.log('🔕 Toast suppressed for error:', error?.response?.data?.message || error?.message);
        return;
    }

    const message =
        error?.response?.data?.message || // lỗi từ Axios response
        error?.message ||                 // lỗi custom mình tự truyền { message: "..." }
        (typeof error === "string" ? error : null) || // khi truyền thẳng string
        "Đã xảy ra lỗi không xác định";   // fallback cuối

    toast.error(message);
}

export default AxiosToastError;
