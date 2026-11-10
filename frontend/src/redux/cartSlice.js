import { createSlice } from '@reduxjs/toolkit';

// Load cart saved from a previous visit (so it survives page refresh)
const loadCart = () => {
    try {
        return JSON.parse(localStorage.getItem('cartItems')) || [];
    } catch {
        return [];
    }
};

const saveCart = (items) => {
    try {
        localStorage.setItem('cartItems', JSON.stringify(items));
    } catch {
        // ignore storage errors (private mode etc.)
    }
};

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        cartItems: loadCart(),
    },
    reducers: {
        // payload: { _id, name, price, imagesUrl, stock, qty }
        addToCart: (state, action) => {
            const item = action.payload;
            const max = item.stock ?? Infinity; // never add more than what's in stock
            const existing = state.cartItems.find((i) => i._id === item._id);
            if (existing) {
                existing.qty = Math.min(existing.qty + (item.qty || 1), max);
                existing.stock = item.stock; // keep latest stock info
                existing.price = item.price; // and latest price
            } else {
                state.cartItems.push({ ...item, qty: Math.min(item.qty || 1, max) });
            }
            saveCart(state.cartItems);
        },
        // payload: product _id
        removeFromCart: (state, action) => {
            state.cartItems = state.cartItems.filter((i) => i._id !== action.payload);
            saveCart(state.cartItems);
        },
        // payload: { _id, qty }
        updateQty: (state, action) => {
            const item = state.cartItems.find((i) => i._id === action.payload._id);
            if (item) {
                item.qty = Math.min(Math.max(1, action.payload.qty), item.stock ?? Infinity);
            }
            saveCart(state.cartItems);
        },
        clearCart: (state) => {
            state.cartItems = [];
            saveCart(state.cartItems);
        },
    },
});

export const { addToCart, removeFromCart, updateQty, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
