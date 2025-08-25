import Stripe from "../config/stripe.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";
import CartProductModel from './../models/cartProduct.model.js';

export async function CashOnDeliveryOrderController(request, response) {
    try {
        const userId = request.userId;
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body;

        // Validate input
        if (!list_items?.length || !addressId || !subTotalAmt || !totalAmt) {
            return response.status(400).json({
                message: "Missing required fields",
                error: true,
                success: false
            });
        }

        // Tạo payload cho đơn hàng
        const payload = list_items.map(el => {
            return ({
                userId: userId,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: el.productId._id,
                product_details: {
                    name: el.productId.name,
                    image: el.productId.image
                },
                paymentId: "",
                payment_status: "CASH ON DELIVERY",
                delivery_address: addressId,
                subTotalAmt: subTotalAmt,
                totalAmt: totalAmt,
            });
        });

        // Tạo đơn hàng
        const generatedOrder = await OrderModel.insertMany(payload);
        console.log('CashOnDelivery Orders Created:', generatedOrder);

        // Lấy danh sách productId từ list_items
        const productIdsToRemove = list_items.map(el => el.productId._id);

        // Tìm cart items cần xóa để lấy _id của chúng
        const cartItemsToDelete = await CartProductModel.find({
            userId: userId,
            productId: { $in: productIdsToRemove }
        });
        const cartItemIds = cartItemsToDelete.map(item => item._id);

        // Xóa chỉ các sản phẩm được chọn khỏi CartProductModel
        const cartDeleteResult = await CartProductModel.deleteMany({
            userId: userId,
            productId: { $in: productIdsToRemove }
        });
        console.log('CashOnDelivery Cart Items Deleted:', cartDeleteResult);

        // Cập nhật shopping_cart trong UserModel - sử dụng cart item IDs thay vì product IDs
        const userUpdateResult = await UserModel.updateOne(
            { _id: userId },
            { $pull: { shopping_cart: { $in: cartItemIds } } }
        );
        console.log('CashOnDelivery User shopping_cart Updated:', userUpdateResult);

        return response.json({
            message: "Order Successfully",
            error: false,
            success: true,
            data: generatedOrder
        });
    } catch (error) {
        console.error('CashOnDeliveryOrderController Error:', error);
        return response.status(500).json({
            message: error.message || "Internal Server Error",
            error: true,
            success: false
        });
    }
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
                message: "Missing required fields",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        // Tạo order tạm thời
        const tempOrder = await OrderModel.insertMany(
            list_items.map(el => ({
                userId,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: el.productId._id,
                product_details: {
                    name: el.productId.name,
                    image: el.productId.image
                },
                paymentId: '',
                payment_status: 'pending',
                delivery_address: addressId,
                subTotalAmt,
                totalAmt,
            }))
        );

        const line_items = list_items.map(item => {
            if (!item.productId?._id || !item.productId?.name || !item.productId?.price) {
                throw new Error(`Invalid product data for item: ${JSON.stringify(item)}`);
            }
            return {
                price_data: {
                    currency: 'vnd',
                    product_data: {
                        name: item.productId.name,
                        images: Array.isArray(item.productId.image) ? item.productId.image : [item.productId.image],
                        metadata: {
                            productId: item.productId._id.toString() // Đảm bảo productId là string
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
                tempOrderIds: JSON.stringify(tempOrder.map(o => o._id.toString())) // Lưu ID order tạm
            },
            line_items,
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`
        };

        const session = await Stripe.checkout.sessions.create(params);
        return response.status(200).json(session);
    } catch (error) {
        console.error('paymentController Error:', error);
        return response.status(500).json({
            message: error.message || "Internal Server Error",
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
        console.error('No line items found in webhook');
        return productList;
    }

    for (const item of lineItems.data) {
        try {
            const product = await Stripe.products.retrieve(item.price.product);
            console.log('Retrieved Stripe product:', product);

            if (!product.metadata?.productId) {
                console.error('Missing productId in metadata for product:', product.id);
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
        console.log('=== WEBHOOK CALLED ===');
        console.log('Headers:', request.headers);
        console.log('Raw body length:', request.rawBody ? request.rawBody.length : 'No raw body');
        console.log('Request body:', JSON.stringify(request.body, null, 2));

        const event = request.body;
        const endPointSecret = process.env.STRIPE_ENPOINT_WEBHOOK_SECRET_KEY;

        console.log('Webhook event received:', event?.type || 'NO TYPE');
        if (event?.data?.object) {
            console.log('Event data:', JSON.stringify(event.data.object, null, 2));
        } else {
            console.log('No event data found');
        }

        // Tạm thời bỏ qua signature verification để debug
        // if (endPointSecret) {
        //     const signature = request.headers['stripe-signature'];
        //     try {
        //         event = Stripe.webhooks.constructEvent(request.rawBody, signature, endPointSecret);
        //     } catch (error) {
        //         console.error('Webhook signature verification failed:', error);
        //         return response.status(400).json({
        //             message: 'Webhook signature verification failed',
        //             error: true,
        //             success: false
        //         });
        //     }
        // }

        if (!event || !event.type) {
            console.error('Invalid event structure');
            return response.status(200).json({ received: true, message: 'Invalid event' });
        }

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log('Session metadata:', session.metadata);

                const { userId, addressId, tempOrderIds } = session.metadata || {};
                if (!userId || !addressId || !tempOrderIds) {
                    console.error('Missing metadata:', session.metadata);

                    // Nếu thiếu metadata, chỉ xóa cart items có trong recent orders
                    console.log('Attempting selective fallback cart cleanup...');
                    try {
                        // Tìm orders gần đây (trong 10 phút) để lấy productIds
                        const recentOrders = await OrderModel.find({
                            createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }, // 10 phút
                            payment_status: { $in: ['paid', session.payment_status] }
                        });
                        
                        if (recentOrders.length > 0) {
                            // Nhóm theo userId
                            const userProductMap = {};
                            recentOrders.forEach(order => {
                                const userId = order.userId.toString();
                                if (!userProductMap[userId]) {
                                    userProductMap[userId] = [];
                                }
                                userProductMap[userId].push(order.productId.toString());
                            });
                            
                            // Xóa selective cho từng user
                            for (const [userId, productIds] of Object.entries(userProductMap)) {
                                const cartItemsToDelete = await CartProductModel.find({
                                    userId: new mongoose.Types.ObjectId(userId),
                                    productId: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) }
                                });
                                
                                if (cartItemsToDelete.length > 0) {
                                    const cartItemIds = cartItemsToDelete.map(item => item._id);
                                    
                                    await CartProductModel.deleteMany({
                                        _id: { $in: cartItemIds }
                                    });
                                    
                                    await UserModel.updateOne(
                                        { _id: new mongoose.Types.ObjectId(userId) },
                                        { $pull: { shopping_cart: { $in: cartItemIds } } }
                                    );
                                    
                                    console.log(`✅ Selective fallback cleanup for user ${userId}: ${cartItemsToDelete.length} items`);
                                }
                            }
                        } else {
                            console.log('No recent orders found for fallback cleanup');
                        }
                    } catch (error) {
                        console.error('Fallback cleanup error:', error);
                    }

                    return response.status(200).json({
                        message: 'Missing metadata - performed fallback cleanup',
                        received: true
                    });
                }

                const orderIds = JSON.parse(tempOrderIds);
                console.log('Parsed orderIds:', orderIds);

                try {
                    const updatedOrders = await OrderModel.updateMany(
                        { _id: { $in: orderIds.map(id => new mongoose.Types.ObjectId(id)) } },
                        { paymentId: session.payment_intent, payment_status: session.payment_status }
                    );
                    console.log('Updated orders result:', updatedOrders);
                } catch (error) {
                    console.error('Error updating orders:', error);
                    return response.status(500).json({
                        message: 'Error updating orders',
                        error: true,
                        success: false
                    });
                }

                try {
                    const lineItems = await Stripe.checkout.sessions.listLineItems(session.id, {
                        expand: ['data.price.product']
                    });
                    console.log('Line items:', JSON.stringify(lineItems.data, null, 2));

                    let productIdsToRemove = [];

                    // Lấy productId từ expanded product metadata
                    for (const item of lineItems.data) {
                        if (item.price?.product?.metadata?.productId) {
                            productIdsToRemove.push(item.price.product.metadata.productId);
                        }
                    }

                    console.log('Product IDs to remove from line items:', productIdsToRemove);

                    if (productIdsToRemove.length === 0 && orderIds.length > 0) {
                        const orders = await OrderModel.find({ _id: { $in: orderIds.map(id => new mongoose.Types.ObjectId(id)) } });
                        const fallbackProductIds = orders.map(order => order.productId.toString()).filter(id => id);
                        if (fallbackProductIds.length > 0) {
                            productIdsToRemove.push(...fallbackProductIds);
                            console.log('Fallback product IDs to remove:', fallbackProductIds);
                        } else {
                            console.error('No fallback product IDs found in orders:', orders);
                        }
                    }

                    if (productIdsToRemove.length > 0) {
                        console.log('=== STARTING CART CLEANUP ===');
                        console.log('UserId:', userId);
                        console.log('ProductIds to remove:', productIdsToRemove);

                        // Kiểm tra tất cả cart items của user trước khi xóa
                        const allUserCartItems = await CartProductModel.find({
                            userId: new mongoose.Types.ObjectId(userId)
                        });
                        console.log('All user cart items before deletion:', allUserCartItems);

                        // Tìm các CartProduct cần xóa để lấy _id của chúng
                        const cartItemsToDelete = await CartProductModel.find({
                            userId: new mongoose.Types.ObjectId(userId),
                            productId: { $in: productIdsToRemove.map(id => new mongoose.Types.ObjectId(id)) }
                        });
                        console.log('Cart items found to delete:', cartItemsToDelete);

                        if (cartItemsToDelete.length > 0) {
                            const cartItemIds = cartItemsToDelete.map(item => item._id);
                            console.log('Cart item IDs to delete:', cartItemIds);

                            // Xóa các CartProduct documents
                            const cartDeleteResult = await CartProductModel.deleteMany({
                                _id: { $in: cartItemIds }
                            });
                            console.log('Cart delete result:', cartDeleteResult);

                            // Kiểm tra User trước khi update
                            const userBefore = await UserModel.findById(userId);
                            console.log('User shopping_cart before update:', userBefore.shopping_cart);

                            // Xóa references từ User.shopping_cart
                            const userUpdateResult = await UserModel.updateOne(
                                { _id: new mongoose.Types.ObjectId(userId) },
                                { $pull: { shopping_cart: { $in: cartItemIds } } }
                            );
                            console.log('User update result:', userUpdateResult);

                            // Kiểm tra User sau khi update
                            const userAfter = await UserModel.findById(userId);
                            console.log('User shopping_cart after update:', userAfter.shopping_cart);

                            // Kiểm tra cart items còn lại
                            const remainingCartItems = await CartProductModel.find({
                                userId: new mongoose.Types.ObjectId(userId)
                            });
                            console.log('Remaining cart items after deletion:', remainingCartItems);

                        } else {
                            console.log('No cart items found to delete for these products');
                            console.log('Checking if productIds match existing cart items...');

                            // Debug: So sánh productIds
                            allUserCartItems.forEach(item => {
                                console.log(`Cart item productId: ${item.productId}, type: ${typeof item.productId}`);
                                productIdsToRemove.forEach(pid => {
                                    console.log(`Product to remove: ${pid}, type: ${typeof pid}, match: ${item.productId.toString() === pid.toString()}`);
                                });
                            });
                        }
                        console.log('=== CART CLEANUP COMPLETED ===');
                    } else {
                        console.error('No product IDs to remove from cart');
                    }
                } catch (error) {
                    console.error('Error processing line items or cart:', error);
                    return response.status(500).json({
                        message: 'Error processing line items or cart',
                        error: true,
                        success: false
                    });
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
                return response.status(200).json({ received: true });
        }

        response.json({ received: true });
    } catch (error) {
        console.error('webhookStripe Error:', error);
        console.error('Error stack:', error.stack);
        response.status(500).json({
            message: error.message || "Webhook processing failed",
            error: true,
            success: false
        });
    }
}

export async function getOrderDetailsController(request, response) {
    try {
        const userId = request.userId;

        const orderlist = await OrderModel.find({ userId: userId })
            .sort({ createdAt: -1 })
            .populate('delivery_address');

        console.log('Order list retrieved:', orderlist);

        return response.json({
            message: "Order List",
            data: orderlist,
            error: false,
            success: true
        });
    } catch (error) {
        console.error('getOrderDetailsController Error:', error);
        return response.status(500).json({
            message: error.message || "Internal Server Error",
            error: true,
            success: false
        });
    }
}