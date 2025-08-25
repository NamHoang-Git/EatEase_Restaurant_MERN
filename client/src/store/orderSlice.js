import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: [],
};

const orderSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        setOrder: (state, action) => {
            state.data = [...action.payload];
        },
    },
});

export const { setOrder } = orderSlice.actions;
export default orderSlice.reducer;