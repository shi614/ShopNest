import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages.css';

// Simple content pages linked from the footer.
// Edit the text below to match your real business details.

const InfoLayout = ({ title, children }) => (
    <div className='container narrow'>
        <h1 className='page-title'>{title}</h1>
        <div className='card info-content'>{children}</div>
    </div>
);

export const About = () => (
    <InfoLayout title='About ShopNest'>
        <p>
            ShopNest is an online store for everyday essentials: electronics, fashion,
            home &amp; kitchen, books, sports gear and more, all in one place.
        </p>
        <h2>What we care about</h2>
        <ul>
            <li><strong>Fair prices:</strong> what you see is what you pay, with free shipping on every order.</li>
            <li><strong>Secure payments:</strong> pay online through Razorpay or choose Cash on Delivery.</li>
            <li><strong>Easy tracking:</strong> follow every order from your account page.</li>
        </ul>
        <p><Link to='/shop'>Browse the shop →</Link></p>
    </InfoLayout>
);

export const Contact = () => (
    <InfoLayout title='Contact Us'>
        <p>Have a question about an order or a product? Reach out and we'll get back to you.</p>
        <ul className='contact-list'>
            <li><strong>Email:</strong> support@shopnest.example</li>
            <li><strong>Phone:</strong> +91 00000 00000</li>
            <li><strong>Hours:</strong> Monday to Saturday, 10:00 AM – 6:00 PM IST</li>
        </ul>
        <p className='hint'>
            For order issues, please include your order number (shown in <Link to='/profile'>My Orders</Link>).
        </p>
    </InfoLayout>
);

export const Privacy = () => (
    <InfoLayout title='Privacy Policy'>
        <p>This page explains what information ShopNest collects and how it is used.</p>
        <h2>Information we collect</h2>
        <ul>
            <li>Account details: your name, email address and an encrypted password.</li>
            <li>Order details: items purchased, shipping address and payment status.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
            <li>To process and deliver your orders.</li>
            <li>To send order and account emails.</li>
        </ul>
        <h2>Payments</h2>
        <p>
            Online payments are handled by Razorpay. ShopNest never sees or stores your
            card or UPI details.
        </p>
    </InfoLayout>
);

export const Terms = () => (
    <InfoLayout title='Terms of Service'>
        <p>By using ShopNest you agree to the following terms.</p>
        <h2>Orders</h2>
        <ul>
            <li>All prices are in Indian Rupees (₹) and include free shipping.</li>
            <li>An order is confirmed once it is placed; stock is reserved at that time.</li>
            <li>We may cancel an order if a product becomes unavailable; any payment will be refunded.</li>
        </ul>
        <h2>Accounts</h2>
        <ul>
            <li>You are responsible for keeping your password safe.</li>
            <li>Please provide accurate shipping details so we can deliver your order.</li>
        </ul>
    </InfoLayout>
);

export const NotFound = () => (
    <div className='container'>
        <div className='empty-state'>
            <h3>404: Page not found</h3>
            <p>The page you're looking for doesn't exist or has been moved.</p>
            <Link to='/' className='btn btn-primary'>Go home</Link>
        </div>
    </div>
);
