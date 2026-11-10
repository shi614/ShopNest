import { apiRequest } from './api';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

// Load Razorpay's checkout script once
const loadRazorpay = () =>
    new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const script = document.createElement('script');
        script.src = RAZORPAY_SCRIPT;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Could not load Razorpay. Check your internet connection.'));
        document.body.appendChild(script);
    });

/**
 * Pay for an order that is already saved in MongoDB (status "pending").
 *  1. backend creates a Razorpay order (amount taken from the DB)
 *  2. Razorpay popup opens, user pays
 *  3. backend verifies the signature and marks the order as "paid"
 * Resolves with the paid order, rejects if payment fails or the popup is closed.
 */
export const payForOrder = async ({ orderId, token, user }) => {
    const rzpOrder = await apiRequest('/api/payment/order', {
        method: 'POST',
        body: { orderId },
        token,
    });
    await loadRazorpay();

    return new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
            key: rzpOrder.keyId,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            order_id: rzpOrder.id,
            name: 'ShopNest',
            description: 'Order payment',
            prefill: { name: user?.name, email: user?.email },
            theme: { color: '#810B38' },
            handler: async (response) => {
                try {
                    const result = await apiRequest('/api/payment/verify', {
                        method: 'POST',
                        body: { orderId, ...response },
                        token,
                    });
                    resolve(result.order);
                } catch (err) {
                    reject(err);
                }
            },
            modal: {
                ondismiss: () => reject(new Error('Payment was cancelled.')),
            },
        });
        razorpay.on('payment.failed', (res) =>
            reject(new Error(res.error?.description || 'Payment failed.'))
        );
        razorpay.open();
    });
};
