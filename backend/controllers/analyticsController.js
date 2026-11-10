
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const getAdminStats = async (req, res) => {
    try{
       const totalUsers = await User.countDocuments({role: "user"});
       const totalProducts = await Product.countDocuments({});
       const totalOrders = await Order.countDocuments({});

       const orders = await Order.find({})
       const totalRevenueData = orders.reduce((acc, order) => acc + order.totalAmount, 0);

       res.json({
           users: totalUsers,
           products: totalProducts,
           orders: totalOrders,
           revenue: totalRevenueData
       });
    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}
module.exports = {
    getAdminStats
}