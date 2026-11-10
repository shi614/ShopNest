import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { shortId } from '../utils/api';
import '../styles/pages.css';

const OrderSuccess = () => {
    const { id } = useParams();

    return (
        <div className='container narrow'>
            <div className='card success-card'>
                <div className='success-icon' aria-hidden='true'>✓</div>
                <h1>Thank you for your order!</h1>
                <p>
                    Your order <strong>{shortId(id)}</strong> has been placed successfully.
                    You'll receive a confirmation email shortly.
                </p>
                <div className='button-row center'>
                    <Link to='/profile' className='btn btn-primary'>View my orders</Link>
                    <Link to='/shop' className='btn btn-outline'>Continue shopping</Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
