const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');

const isConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// Step 1: create a Razorpay order for one of the user's own (pending) orders.
// The amount comes from the order saved in MongoDB, never from the client.
const createOrder = async (req, res) => {
    try{
        if(!isConfigured()){
            return res.status(503).json({ message: 'Online payment is not configured on the server (missing Razorpay keys).' });
        }
        const { orderId } = req.body;
        if(!mongoose.isValidObjectId(orderId)){
            return res.status(400).json({ message: 'Invalid orderId' });
        }
        const order = await Order.findOne({ _id: orderId, user: req.user._id });
        if(!order){
            return res.status(404).json({ message: 'Order not found' });
        }
        if(order.status !== 'pending'){
            return res.status(400).json({ message: `Order is already ${order.status}` });
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        const rzpOrder = await instance.orders.create({
            amount: Math.round(order.totalAmount * 100), // paise, must be an integer
            currency: 'INR',
            receipt: order._id.toString()
        });

        // Remember which Razorpay order belongs to this order (checked in verifyPayment)
        order.razorpayOrderId = rzpOrder.id;
        await order.save();

        res.status(200).json({
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID // public key, safe to send to the browser
        });
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Could not start payment', error: error.message || error.error?.description });
    }
};

// Step 3: verify Razorpay's signature, then mark the order as paid.
const verifyPayment = async (req, res) => {
    try{
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if(!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature){
            return res.status(400).json({ message: 'Missing payment details' });
        }
        if(!mongoose.isValidObjectId(orderId)){
            return res.status(400).json({ message: 'Invalid orderId' });
        }
        const order = await Order.findOne({ _id: orderId, user: req.user._id });
        if(!order){
            return res.status(404).json({ message: 'Order not found' });
        }
        if(order.razorpayOrderId !== razorpay_order_id){
            return res.status(400).json({ message: 'Payment does not belong to this order' });
        }

        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');
        const valid = expected.length === razorpay_signature.length &&
            crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
        if(!valid){
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        order.status = 'paid';
        order.paymentId = razorpay_payment_id;
        await order.save();
        res.status(200).json({ message: 'Payment verified successfully', order });
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createOrder,
    verifyPayment
};
