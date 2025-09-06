import Stripe from "../config/stripe.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";
import CartProductModel from './../models/cartProduct.model.js';
import { updateProductStock } from "../utils/productStockUpdater.js";

export async function CashOnDeliveryOrderController(request, response) {
    try {
        const userId = request.userId;
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body;

        // Validate input
        if (!list_items?.length || !addressId || !subTotalAmt || !totalAmt) {
            return response.status(400).json({
                message: "Vui lòng điền đầy đủ các trường bắt buộc.",
                error: true,
                success: false
            });
        }

        // Tạo payload cho đơn hàng
        const payload = list_items.map(el => {
            const quantity = Number(el.quantity) || 1;
            const price = Number(el.productId.price) || 0;
            const subTotal = price * quantity;

            return {
                userId: userId,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: el.productId._id,
                product_details: {
                    name: el.productId.name || 'Sản phẩm không tên',
                    image: Array.isArray(el.productId.image) ? el.productId.image : [el.productId.image || '']
                },
                quantity: quantity,
                paymentId: "",
                payment_status: "Thanh toán khi giao hàng",
                delivery_address: addressId,
                subTotalAmt: subTotal,
                totalAmt: subTotal,
                status: 'pending'
            };
        });

        // Tạo đơn hàng
        const generatedOrder = await OrderModel.insertMany(payload);

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

        const userUpdateResult = await UserModel.updateOne(
            { _id: userId },
            { $pull: { shopping_cart: { $in: cartItemIds } } }
        )

        // Cập nhật số lượng tồn kho
        try {
            const orderIds = generatedOrder.map(order => order._id);
            const stockUpdateResult = await updateProductStock(orderIds);

            if (!stockUpdateResult.success) {
                console.error('Failed to update product stock for COD order:', stockUpdateResult.message);
                // Continue with the order even if stock update fails, but log the error
            } else {
                console.log('Successfully updated product stock for COD order');
            }
        } catch (stockError) {
            console.error('Error updating stock for COD order:', stockError);
            // Continue with the order even if stock update fails
        }

        return response.json({
            message: "Đặt hàng thành công",
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
                tempOrderIds: JSON.stringify(tempOrder.map(o => o._id.toString()))
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

                const { userId, addressId, tempOrderIds } = session.metadata || {};
                if (!userId || !addressId || !tempOrderIds) {
                    return response.status(200).json({
                        message: 'Missing metadata',
                        received: true
                    });
                }

                const orderIds = JSON.parse(tempOrderIds);

                try {
                    const updatedOrders = await OrderModel.updateMany(
                        { _id: { $in: orderIds.map(id => new mongoose.Types.ObjectId(id)) } },
                        {
                            paymentId: session.payment_intent,
                            payment_status: 'Đã thanh toán'
                        }
                    );

                    const stockUpdateResult = await updateProductStock(orderIds);
                    if (!stockUpdateResult.success) {
                        console.error('Failed to update product stock:', stockUpdateResult.message);
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