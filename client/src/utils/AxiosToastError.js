import toast from "react-hot-toast"

const AxiosToastError = (error) => {
    // Không hiển thị toast nếu error được đánh dấu suppressToast
    if (error?.suppressToast) {
        console.log('🔕 Toast suppressed for error:', error?.response?.data?.message);
        return;
    }
    
    toast.error(error?.response?.data?.message)
}

export default AxiosToastError