const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');

//Create a new order
const createOrder = async (req, res) => {
    try{
        // paymentId is NOT taken from the client: it is only set by verifyPayment
        const { items, address } = req.body;
        const paymentMethod = req.body.paymentMethod === 'cod' ? 'cod' : 'online';
        if(!Array.isArray(items) || items.length === 0 || !address){
            return res.status(400).json({ message: 'Invalid order data' });
        }

        // Never trust prices/total from the client: look them up in the DB
        const orderItems = [];
        let totalAmount = 0;
        for(const item of items){
            if(!mongoose.isValidObjectId(item.productId)){
                return res.status(400).json({ message: `Invalid productId: ${item.productId}` });
            }
            const qty = Number(item.qty) || 1;
            if(!Number.isInteger(qty) || qty < 1){
                return res.status(400).json({ message: `Invalid qty for product ${item.productId}` });
            }
            const product = await Product.findById(item.productId);
            if(!product){
                return res.status(404).json({ message: `Product not found: ${item.productId}` });
            }
            if(product.stock < qty){
                return res.status(400).json({ message: `Only ${product.stock} left in stock for ${product.name}` });
            }
            orderItems.push({ productId: product._id, qty, price: product.price });
            totalAmount += product.price * qty;
        }

        const order = new Order({
            user: req.user._id,
            items: orderItems,
            totalAmount,
            address,
            paymentMethod
        });
        await order.save();

        // Reserve stock for this order (given back if the order is cancelled)
        for(const item of orderItems){
            await Product.updateOne({ _id: item.productId }, { $inc: { stock: -item.qty } });
        }

        // The order is already saved; an email failure must not turn this into a 500
        try{
            const message = `Your order with ID ${order._id} has been created successfully. Total amount: ${totalAmount}.`;
            await sendEmail(req.user.email, 'Order Created', message);
        }catch(emailErr){
            console.error('Order email failed:', emailErr.message);
        }

        res.status(201).json({ message: 'Order created successfully', order });
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

//Get OrderById(my orders)
const myOrders = async (req, res) => {
    try{
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.productId', 'name price imagesUrl');
        res.status(200).json({ orders });
    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

//Get all orders (admin only)
const getAllOrders = async (req, res) => {
    try{
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.productId', 'name');
        res.status(200).json({ orders });
    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

//Update order status (admin only)
const updateOrderStatus = async (req, res) => {
    try{
        const { status } = req.body;
        const allowed = Order.schema.path('status').enumValues;
        if(!allowed.includes(status)){
            return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
        }
        if(!mongoose.isValidObjectId(req.params.id)){
            return res.status(400).json({ message: 'Invalid order id' });
        }
        const order = await Order.findById(req.params.id);
        if(order){
            const wasCancelled = order.status === 'cancelled';
            const nowCancelled = status === 'cancelled';
            order.status = status;
            await order.save();
            // Give stock back when cancelling; take it again if un-cancelled
            if(wasCancelled !== nowCancelled){
                const sign = nowCancelled ? 1 : -1;
                for(const item of order.items){
                    await Product.updateOne({ _id: item.productId }, { $inc: { stock: sign * item.qty } });
                }
            }
            res.status(200).json({ message: 'Order status updated successfully', order });
        }else{
            res.status(404).json({ message: 'Order not found' });
        }
    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

module.exports = {
    createOrder,
    myOrders,
    getAllOrders,
    updateOrderStatus
}