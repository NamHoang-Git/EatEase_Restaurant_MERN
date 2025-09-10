import Stripe from "../config/stripe.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";
import CartProductModel from './../models/cartProduct.model.js';
import { updateProductStock } from "../utils/productStockUpdater.js";
import { calculatePointsFromOrder, calculateUsablePoints } from "../utils/pointsUtils.js";

export async function CashOnDeliveryOrderController(request, response) {
    const maxRetries = 3;
    let retryCount = 0;
    let session;

    while (retryCount < maxRetries) {
        session = await mongoose.startSession();

        try {
            const result = await session.withTransaction(async () => {
                const userId = request.userId;
                const { list_items, totalAmt, addressId, subTotalAmt, pointsToUse = 0 } = request.body;

                // Validate input
                if (!list_items?.length || !addressId || !subTotalAmt || !totalAmt) {
                    throw new Error("Vui lòng điền đầy đủ các trường bắt buộc.");
                }

                const user = await UserModel.findById(userId).session(session);
                if (!user) {
                    throw new Error('Người dùng không tồn tại');
                }

                if (pointsToUse > 0) {
                    const maxUsablePoints = calculateUsablePoints(user.rewardsPoint, totalAmt);
                    if (pointsToUse > maxUsablePoints) {
                        throw new Error(`Bạn chỉ có thể sử dụng tối đa ${maxUsablePoints} điểm cho đơn hàng này`);
                    }
                }

                // Create the order
                const orderItems = list_items.map(item => ({
                    userId,
                    orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                    productId: item.productId._id,
                    product_details: {
                        name: item.productId.name,
                        image: item.productId.image
                    },
                    quantity: item.quantity,
                    payment_status: 'Đang chờ thanh toán',
                    delivery_address: addressId,
                    subTotalAmt: item.productId.price * item.quantity,
                    totalAmt: (item.productId.price * item.quantity) * (1 - (item.productId.discount || 0) / 100),
                    status: 'pending' // Initial status for COD
                }));

                const newOrders = await OrderModel.insertMany(orderItems, { session });
                const newOrderIds = newOrders.map(order => order._id);

                // Update product stock
                const stockUpdateResult = await updateProductStock(newOrderIds, session);
                if (!stockUpdateResult.success) {
                    throw new Error(stockUpdateResult.message); // This will abort the transaction
                }

                // Calculate points earned from this order
                const pointsEarned = calculatePointsFromOrder(totalAmt);

                // Update user points
                let pointsChange = pointsEarned;
                if (pointsToUse > 0) {
                    pointsChange -= pointsToUse;
                }

                if (pointsChange !== 0) {
                    await UserModel.findByIdAndUpdate(userId,
                        { $inc: { rewardsPoint: pointsChange } },
                        { session }
                    );
                }

                // Clear cart items
                const cartItemIds = list_items.map(item => item._id);
                await CartProductModel.deleteMany({ _id: { $in: cartItemIds } }, { session });

                return {
                    success: true,
                    data: {
                        message: 'Đặt hàng thành công',
                        orders: newOrders,
                        pointsEarned,
                        pointsUsed: pointsToUse
                    }
                };
            });

            return response.status(200).json({
                message: 'Đặt hàng thành công',
                error: false,
                success: true,
                data: result?.data
            });

        } catch (error) {
            console.error('Error in transaction:', error);

            if (error.errorLabels?.includes('TransientTransactionError') || error.code === 112 || error.code === 251) {
                retryCount++;
                console.warn(`Transient error detected, retrying (${retryCount}/${maxRetries})...`);
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
                    continue;
                }
            }

            // Hết retry hoặc lỗi khác → trả về luôn
            let errorMessage = 'Có lỗi xảy ra khi xử lý đơn hàng';
            if (error.message.includes('Người dùng không tồn tại')) {
                errorMessage = 'Người dùng không tồn tại';
            } else if (error.message.includes('không đủ điểm')) {
                errorMessage = 'Số điểm không đủ để sử dụng';
            } else if (error.message.includes('Bạn chỉ có thể sử dụng tối đa')) {
                errorMessage = error.message;
            } else if (error.message.includes('Vui lòng điền đầy đủ')) {
                errorMessage = error.message;
            }

            return response.status(500).json({
                message: errorMessage,
                error: true,
                success: false
            });
        } finally {
            if (session) {
                await session.endSession().catch(endSessionError => {
                    console.error('Error ending session:', endSessionError);
                });
            }
        }
    }

    // Nếu hết retry mà vẫn fail
    return response.status(500).json({
        message: 'Không thể hoàn tất đơn hàng do xung đột dữ liệu. Vui lòng thử lại sau.',
        error: true,
        success: false
    });
}

export const pricewithDiscount = (price, dis = 1) => {
    const discountAmount = Math.ceil((Number(price) * Number(dis)) / 100);
    const actualPrice = Number(price) - Number(discountAmount);
    return actualPrice;
}

export async function paymentController(request, response) {
    try {
        const userId = request.userId;
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body;

        if (!list_items?.length || !addressId || !subTotalAmt || !totalAmt) {
            return response.status(400).json({
                message: "Vui lòng điền đầy đủ các trường bắt buộc.",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return response.status(404).json({
                message: "Không tìm thấy User",
                error: true,
                success: false
            });
        }

        // Tạo order tạm thởi
        const tempOrder = await OrderModel.insertMany(
            list_items.map(el => {
                const quantity = Number(el.quantity) || 1;
                const price = Number(el.productId.price) || 0;
                const subTotal = price * quantity;

                return {
                    userId,
                    orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                    productId: el.productId._id,
                    product_details: {
                        name: el.productId.name || 'Sản phẩm không tên',
                        image: Array.isArray(el.productId.image) ? el.productId.image : [el.productId.image || '']
                    },
                    quantity: quantity,
                    paymentId: '',
                    payment_status: 'Đang chờ thanh toán',
                    delivery_address: addressId,
                    subTotalAmt: subTotal,
                    totalAmt: subTotal, // For individual items, totalAmt is same as subTotal
                    status: 'pending'
                };
            })
        );

        const line_items = list_items.map(item => {
            if (!item.productId?._id || !item.productId?.name || !item.productId?.price) {
                throw new Error(`Không tìm thấy sản phẩm: ${JSON.stringify(item)}`);
            }
            return {
                price_data: {
                    currency: 'vnd',
                    product_data: {
                        name: item.productId.name,
                        images: Array.isArray(item.productId.image) ? item.productId.image : [item.productId.image],
                        metadata: {
                            productId: item.productId._id.toString()
                        }
                    },
                    unit_amount: pricewithDiscount(item.productId.price, item.productId.discount)
                },
                adjustable_quantity: {
                    enabled: true,
                    minimum: 1
                },
                quantity: item.quantity || 1
            };
        });

        const params = {
            submit_type: 'pay',
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: user.email,
            metadata: {
                userId: userId.toString(),
                addressId: addressId.toString(),
                tempOrderIds: JSON.stringify(tempOrder.map(o => o._id.toString())),
                orderTotal: totalAmt.toString() // Add total amount to metadata
            },
            line_items,
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`
        };

        const session = await Stripe.checkout.sessions.create(params);
        return response.status(200).json(session);
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Lỗi Server",
            error: true,
            success: false
        });
    }
}

const getOrderProductItems = async ({
    lineItems,
    userId,
    addressId,
    paymentId,
    payment_status,
}) => {
    const productList = [];

    if (!lineItems?.data?.length) {
        return productList;
    }

    for (const item of lineItems.data) {
        try {
            const product = await Stripe.products.retrieve(item.price.product);

            if (!product.metadata?.productId) {
                continue;
            }

            const payload = {
                userId: new mongoose.Types.ObjectId(userId),
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: new mongoose.Types.ObjectId(product.metadata.productId),
                product_details: {
                    name: product.name,
                    image: product.images
                },
                paymentId: paymentId,
                payment_status: payment_status,
                delivery_address: new mongoose.Types.ObjectId(addressId),
                subTotalAmt: Number(item.amount_total / 100),
                totalAmt: Number(item.amount_total / 100),
            };

            productList.push(payload);
        } catch (error) {
            console.error('Error processing line item:', error, 'Item:', item);
        }
    }

    return productList;
}

export async function webhookStripe(request, response) {

    try {
        const event = request.body;
        const endPointSecret = process.env.STRIPE_ENPOINT_WEBHOOK_SECRET_KEY;

        if (event?.data?.object) {
            console.log('Event data:', JSON.stringify(event.data.object, null, 2));
        } else {
            console.log('No event data found');
        }

        if (!event || !event.type) {
            console.error('Invalid event structure');
            return response.status(200).json({ received: true, message: 'Invalid event' });
        }

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;


                // Log the full session for debugging
                console.log('Stripe session:', JSON.stringify(session, null, 2));

                const { userId, addressId, tempOrderIds } = session.metadata || {};
                if (!userId || !addressId || !tempOrderIds) {
                    return response.status(200).json({
                        message: 'Missing metadata',
                        received: true
                    });
                }

                const orderIds = JSON.parse(tempOrderIds);

                try {

                    // Debug the entire session to see what data we're getting
                    console.log('Full session object:', JSON.stringify(session, null, 2));

                    // Get the total amount from the session metadata (preferred) or from the session amount
                    let totalAmount = 0;

                    // First try to get from metadata (more reliable)
                    if (session.metadata?.orderTotal) {
                        totalAmount = Number(session.metadata.orderTotal);
                        console.log('Using total amount from metadata (VND):', totalAmount);
                    }

                    // Fall back to session amount (in cents)
                    else if (session.amount_total) {
                        totalAmount = Number(session.amount_total) / 100; // Convert from cents to VND
                        console.log('Using total amount from session (converted from cents to VND):', totalAmount);
                    }

                    // Debug logging
                    console.log('Stripe session details:', {
                        metadata: session.metadata,
                        amount_total: session.amount_total,
                        amount_subtotal: session.amount_subtotal,
                        currency: session.currency,
                        payment_status: session.payment_status
                    });

                    // Verify the amount makes sense for the order
                    if (totalAmount <= 0) {
                        console.error('Invalid order amount received:', {
                            metadata: session.metadata,
                            amount_total: session.amount_total
                        });
                        return response.status(400).json({
                            message: 'Invalid order amount',
                            error: true,
                            success: false
                        });
                    }

                    // Calculate points for the entire order (1 point per 10,000 VND)
                    const pointsEarned = calculatePointsFromOrder(totalAmount);
                    console.log('Points calculated:', pointsEarned);

                    // Distribute points across order items
                    const pointsPerItem = Math.floor(pointsEarned / orderIds.length);
                    const remainingPoints = pointsEarned - (pointsPerItem * (orderIds.length - 1));

                    console.log('Points per item:', pointsPerItem);
                    console.log('Remaining points for last item:', remainingPoints);
                    console.log('Number of order items:', orderIds.length);

                    // Update each order with its share of points
                    const updatePromises = orderIds.map((orderId, index) => {
                        // For the last item, add any remaining points to handle rounding
                        const pointsForThisItem = index === orderIds.length - 1 ? remainingPoints : pointsPerItem;

                        return OrderModel.findByIdAndUpdate(
                            orderId,
                            {
                                paymentId: session.payment_intent,
                                payment_status: 'Đã thanh toán',
                                $set: {
                                    'earnedPoints': pointsForThisItem
                                }
                            },
                            { new: true }
                        );
                    });

                    await Promise.all(updatePromises);

                    // Update product stock
                    const stockUpdateResult = await updateProductStock(orderIds);
                    if (!stockUpdateResult.success) {
                        console.error('Failed to update product stock:', stockUpdateResult.message);
                    }

                    // Update user's points with the total points earned from this order
                    if (pointsEarned > 0) {
                        await UserModel.findByIdAndUpdate(
                            userId,
                            { $inc: { rewardsPoint: pointsEarned } },
                            { new: true }
                        );
                        console.log(`Added ${pointsEarned} points to user ${userId} for order ${orderIds.join(', ')}`);
                    }
                } catch (error) {
                    return response.status(500).json({
                        message: 'Lỗi khi cập nhật đơn hàng',
                        error: true,
                        success: false
                    });
                }
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
                break;
        }

        response.json({ received: true });
    } catch (error) {
        response.status(500).json({
            message: error.message || "Xử lý webhook không thành công",
            error: true,
            success: false
        });
    }
}

export async function getOrderDetailsController(request, response) {
    try {
        const userId = request.userId;
        const orderlist = await OrderModel.find({ userId })
            .sort({ createdAt: -1 })
            .populate('userId', 'name mobile email')
            .populate('delivery_address');

        return response.json({
            message: "Danh sách đơn hàng của bạn",
            data: orderlist,
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Lỗi Server",
            error: true,
            success: false
        });
    }
}

export async function getAllOrdersController(request, response) {
    try {
        const userId = request.userId;
        const user = await UserModel.findById(userId);
        if (user?.role !== 'ADMIN') {
            return response.status(403).json({
                message: "Truy cập bị từ chối. Chỉ admin mới được phép xem tất cả đơn hàng.",
                error: true,
                success: false
            });
        }

        const { search, status, startDate, endDate } = request.query;
        let query = {};

        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'userId.name': { $regex: search, $options: 'i' } },
                { 'userId.mobile': { $regex: search, $options: 'i' } },
                { 'product_details.name': { $regex: search, $options: 'i' } },
                { payment_status: { $regex: search, $options: 'i' } },
                { 'delivery_address.city': { $regex: search, $options: 'i' } },
            ];
        }

        if (status) {
            query.payment_status = status;
        }

        if (startDate) {
            query.createdAt = { $gte: new Date(startDate) };
        }

        if (endDate) {
            query.createdAt = {
                ...query.createdAt,
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        }

        const orderlist = await OrderModel.find(query)
            .sort({ createdAt: -1 })
            .populate('userId', 'name mobile email')
            .populate('delivery_address');

        return response.json({
            message: "Tất cả đơn hàng",
            data: orderlist,
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || "Lỗi Server",
            error: true,
            success: false
        });
    }
}