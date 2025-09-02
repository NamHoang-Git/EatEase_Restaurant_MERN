// src/store/orderSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: [],       // orders của user đăng nhập
    allOrders: [],  // tất cả orders (chỉ admin mới dùng)
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
});

export const { setOrder, setAllOrders } = orderSlice.actions;
export default orderSlice.reducer;
