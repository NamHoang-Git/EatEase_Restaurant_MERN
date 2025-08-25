import express from 'express';
import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
    CashOnDeliveryOrderController,
    getOrderDetailsController,
    paymentController,
    webhookStripe
} from '../controllers/order.controller.js';

const orderRouter = Router();

orderRouter.post('/cash-on-delivery', auth, CashOnDeliveryOrderController);
orderRouter.post('/checkout', auth, paymentController);
orderRouter.post('/webhook', express.raw({ type: 'application/json' }), webhookStripe);
orderRouter.get('/webhook-test', (req, res) => {
    console.log('=== WEBHOOK TEST ENDPOINT CALLED ===');
    res.json({ message: 'Webhook endpoint is working', timestamp: new Date() });
});
orderRouter.get('/order-list', auth, getOrderDetailsController);

export default orderRouter;