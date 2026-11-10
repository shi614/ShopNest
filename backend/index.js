const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/authRoutes');
const connectDB = require('./config/db');


dotenv.config();
connectDB();

const app = express();

// CORS: only allow our own frontend(s).
// CLIENT_URL can hold several URLs separated by commas, e.g.
//   CLIENT_URL=https://shopnest.vercel.app,http://localhost:3000
// If CLIENT_URL is not set (local development), every origin is allowed.
const allowedOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, '')) // ignore trailing slashes
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // no origin = Postman, curl, server-to-server → allow
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.use('/api/auth', userRoutes);
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));


// Error handler: short JSON instead of an HTML stack trace
app.use((err, req, res, next) => {
    if (err.message && err.message.includes('not allowed by CORS')) {
        return res.status(403).json({ message: 'Origin not allowed' });
    }
    console.error(err);
    res.status(err.status || 500).json({ message: 'Server error' });
});

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});