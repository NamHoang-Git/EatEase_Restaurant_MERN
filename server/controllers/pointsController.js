import mongoose from 'mongoose';
import UserModel from "../models/user.model.js";
import OrderModel from "../models/order.model.js";
import { calculateUsablePoints } from "../utils/pointsUtils.js";

/**
 * Get user's points balance
 */
export const getUserPoints = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await UserModel.findById(userId).select('rewardsPoint');
        
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                error: true,
                success: false
            });
        }
        
        return res.json({
            message: 'User points retrieved successfully',
            data: {
                points: user.rewardsPoint || 0
            },
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Error getting user points:', error);
        return res.status(500).json({
            message: 'Error retrieving user points',
            error: true,
            success: false
        });
    }
};

/**
 * Calculate how many points can be used for an order
 */
export const calculatePointsForOrder = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderTotal } = req.body;
        
        if (!orderTotal || isNaN(orderTotal)) {
            return res.status(400).json({
                message: 'Invalid order total',
                error: true,
                success: false
            });
        }
        
        const user = await UserModel.findById(userId).select('rewardsPoint');
        
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                error: true,
                success: false
            });
        }
        
        const usablePoints = calculateUsablePoints(user.rewardsPoint || 0, orderTotal);
        const pointValue = 100; // 1 point = 100 VND
        const discountAmount = usablePoints * pointValue;
        
        return res.json({
            message: 'Points calculation successful',
            data: {
                usablePoints,
                discountAmount,
                pointValue,
                pointsBalance: user.rewardsPoint || 0
            },
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Error calculating points for order:', error);
        return res.status(500).json({
            message: 'Error calculating points for order',
            error: true,
            success: false
        });
    }
};

/**
 * Apply points to an order
 */
export const applyPointsToOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const userId = req.userId;
        const { orderId, pointsToUse } = req.body;
        
        if (!orderId || pointsToUse === undefined || pointsToUse < 0) {
            await session.abortTransaction();
            return res.status(400).json({
                message: 'Invalid request data',
                error: true,
                success: false
            });
        }
        
        // Find the user and lock the document for update
        const user = await UserModel.findById(userId).session(session);
        
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({
                message: 'User not found',
                error: true,
                success: false
            });
        }
        
        // Verify user has enough points
        if (user.rewardsPoint < pointsToUse) {
            await session.abortTransaction();
            return res.status(400).json({
                message: 'Not enough points',
                error: true,
                success: false
            });
        }
        
        // Find the order
        const order = await OrderModel.findOne({
            _id: orderId,
            userId: userId,
            status: 'pending' // Only allow applying points to pending orders
        }).session(session);
        
        if (!order) {
            await session.abortTransaction();
            return res.status(404).json({
                message: 'Order not found or not eligible for points',
                error: true,
                success: false
            });
        }
        
        // Calculate discount amount (100 VND per point)
        const pointValue = 100;
        const discountAmount = pointsToUse * pointValue;
        
        // Update order with points discount
        order.usedPoints = pointsToUse;
        order.totalAmt = Math.max(0, order.totalAmt - discountAmount);
        await order.save({ session });
        
        // Deduct points from user
        user.rewardsPoint -= pointsToUse;
        await user.save({ session });
        
        await session.commitTransaction();
        
        return res.json({
            message: 'Points applied successfully',
            data: {
                pointsUsed: pointsToUse,
                discountAmount,
                newOrderTotal: order.totalAmt,
                remainingPoints: user.rewardsPoint
            },
            error: false,
            success: true
        });
        
    } catch (error) {
        await session.abortTransaction();
        console.error('Error applying points to order:', error);
        return res.status(500).json({
            message: 'Error applying points to order',
            error: true,
            success: false
        });
    } finally {
        session.endSession();
    }
};
