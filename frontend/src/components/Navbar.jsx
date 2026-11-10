import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import '../styles/navbar.css';
import { AuthContext } from '../context/AuthContext';
import { useSelector } from 'react-redux';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const cartItems = useSelector((state) => state.cart.cartItems);
    const navigate = useNavigate();

    // total number of items (2 × headphones = 2), not just number of rows
    const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className='navbar'>
            <div className='nav-brand'>
                <Link to='/'>
                    <img src='/logo.svg' alt='' className='navbar-logo' />
                    ShopNest
                </Link>
            </div>
            <ul className='navbar-links'>
                <li><NavLink to='/shop'>Shop</NavLink></li>
                <li>
                    <NavLink to='/cart' className='cart-link'>
                        Cart
                        {cartCount > 0 && <span className='cart-count'>{cartCount}</span>}
                    </NavLink>
                </li>
                {user ? (
                    <>
                        <li><NavLink to='/profile'>Hi, {user.name.split(' ')[0]}</NavLink></li>
                        {user.role === 'admin' && <li><NavLink to='/admin'>Admin</NavLink></li>}
                        <li><button onClick={handleLogout} className='btn-logout'>Logout</button></li>
                    </>
                ) : (
                    <li><NavLink to='/login'>Login</NavLink></li>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;
