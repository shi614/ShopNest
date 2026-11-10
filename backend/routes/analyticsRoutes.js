const express = require("express");
const router = express.Router();

const {protect} = require("../middleware/authMiddleware");
const {admin} = require("../middleware/adminMiddleware");
const {getAdminStats }=require("../controllers/analyticsController");

router.get("/",protect,admin,getAdminStats);




module.exports = router;

