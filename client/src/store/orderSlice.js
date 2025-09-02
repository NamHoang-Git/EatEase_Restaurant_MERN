// src/store/orderSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';

export const fetchAllOrders = createAsyncThunk(
    'orders/fetchAll',
    async (filters = {}, { getState, rejectWithValue }) => {
        try {
            const { user } = getState();
            const accessToken = localStorage.getItem('accesstoken');

            if (!accessToken || !user?._id || user?.role !== 'ADMIN') {
                throw new Error('Bạn không có quyền truy cập');
            }

            // Remove search from params since we'll handle it client-side
            const { search, ...apiFilters } = filters;

            const response = await Axios({
                ...SummaryApi.all_orders,
                params: {
                    ...apiFilters,
                    // Don't send search to the server
                    status: filters.status || undefined,
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined,
                },
            });

            if (response.data.success) {
                const orders = response.data.data || [];
                return { orders, filters };
            }
            throw new Error(response.data.message || 'Lỗi khi tải danh sách đơn hàng');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    data: [],       // orders của user đăng nhập
    allOrders: [],  // tất cả orders (chỉ admin mới dùng)
    loading: false,
    error: null,
    filters: {},
};

const orderSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        setOrder: (state, action) => {
            state.data = [...action.payload];
        },
        setAllOrders: (state, action) => {
            state.allOrders = [...action.payload];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.allOrders = action.payload.orders;
                state.filters = action.payload.filters;
            })
            .addCase(fetchAllOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setOrder, setAllOrders } = orderSlice.actions;
export default orderSlice.reducer;
