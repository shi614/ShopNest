import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/footer.css';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className='footer'>
            <div className='footer-content'>
                {/* Brand */}
                <div className='footer-brand'>
                    <Link to='/' className='footer-logo'>ShopNest</Link>
                    <p className='footer-tagline'>
                        Your one-stop shop for electronics, fashion, home essentials and more.
                    </p>
                </div>

                {/* Shop links */}
                <div className='footer-column'>
                    <h4 className='footer-heading'>Shop</h4>
                    <ul className='footer-links'>
                        <li><Link to='/shop'>All Products</Link></li>
                        <li><Link to='/cart'>Cart</Link></li>
                        <li><Link to='/profile'>My Account</Link></li>
                    </ul>
                </div>

                {/* Company links */}
                <div className='footer-column'>
                    <h4 className='footer-heading'>Company</h4>
                    <ul className='footer-links'>
                        <li><Link to='/about'>About Us</Link></li>
                        <li><Link to='/contact'>Contact</Link></li>
                    </ul>
                </div>

                {/* Legal links */}
                <div className='footer-column'>
                    <h4 className='footer-heading'>Legal</h4>
                    <ul className='footer-links'>
                        <li><Link to='/privacy'>Privacy Policy</Link></li>
                        <li><Link to='/terms'>Terms of Service</Link></li>
                    </ul>
                </div>
            </div>

            <div className='footer-bottom'>
                <p>&copy; {year} ShopNest. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
