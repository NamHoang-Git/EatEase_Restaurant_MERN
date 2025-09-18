import Stripe from "../config/stripe.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";
import CartProductModel from './../models/cartProduct.model.js';
import { updateProductStock } from "../utils/productStockUpdater.js";
import { calculatePointsFromOrder, calculateUsablePoints } from "../utils/pointsUtils.js";
import VoucherModel from "../models/voucher.model.js";

export async function CashOnDeliveryOrderController(request, response) {
    const maxRetries = 3;
    let retryCount = 0;
    let session;

    while (retryCount < maxRetries) {
        session = await mongoose.startSession();

        try {
            const result = await session.withTransaction(async () => {
                const userId = request.userId;
                const { list_items, totalAmt, addressId, subTotalAmt, pointsToUse = 0, voucherCode, freeShippingVoucherCode } = request.body;

                // Validate input
                if (!list_items?.length || !addressId || !subTotalAmt || !totalAmt) {
                    throw new Error("Vui lòng điền đầy đủ các trường bắt buộc.");
                }

                const user = await UserModel.findById(userId).session(session);
                if (!user) {
                    throw new Error('Người dùng không tồn tại');
                }

                // Validate vouchers
                let regularVoucher = null;
                let freeShippingVoucher = null;
                let discountAmount = 0;
                let shippingCost = 30000; // From CheckoutPage.jsx
                const now = new Date();

                // Validate regular voucher
                if (voucherCode) {
                    regularVoucher = await VoucherModel.findOne({
                        code: voucherCode,
                        isActive: true,
                        startDate: { $lte: now },
                        endDate: { $gte: now },
                        $or: [
                            { usageLimit: null },
                            { $expr: { $gt: ['$usageLimit', '$usageCount'] } }
                        ],
                        usersUsed: { $nin: [userId] }
                    }).session(session);

                    if (!regularVoucher) {
                        throw new Error('Mã voucher giảm giá không hợp lệ hoặc đã hết hạn');
                    }

                    if (subTotalAmt < regularVoucher.minOrderValue) {
                        throw new Error(`Đơn hàng phải có giá trị tối thiểu ${regularVoucher.minOrderValue} để sử dụng voucher này`);
                    }

                    // Validate products/categories if not applyForAllProducts
                    if (!regularVoucher.applyForAllProducts) {
                        const productIds = list_items.map(item => item.productId._id.toString());
                        const isValidProducts = regularVoucher.products.length === 0 || productIds.some(id => regularVoucher.products.includes(id));
                        const isValidCategories = regularVoucher.categories.length === 0 || list_items.some(item => regularVoucher.categories.includes(item.productId.category));
                        if (!isValidProducts && !isValidCategories) {
                            throw new Error('Voucher này không áp dụng cho sản phẩm trong giỏ hàng');
                        }
                    }

                    if (regularVoucher.discountType === 'percentage') {
                        discountAmount = (subTotalAmt * regularVoucher.discountValue) / 100;
                        if (regularVoucher.maxDiscount && discountAmount > regularVoucher.maxDiscount) {
                            discountAmount = regularVoucher.maxDiscount;
                        }
                    } else if (regularVoucher.discountType === 'fixed') {
                        discountAmount = regularVoucher.discountValue;
                    }
                }

                // Validate free shipping voucher
                if (freeShippingVoucherCode) {
                    freeShippingVoucher = await VoucherModel.findOne({
                        code: freeShippingVoucherCode,
                        isActive: true,
                        startDate: { $lte: now },
                        endDate: { $gte: now },
                        isFreeShipping: true,
                        $or: [
                            { usageLimit: null },
                            { $expr: { $gt: ['$usageLimit', '$usageCount'] } }
                        ],
                        usersUsed: { $nin: [userId] }
                    }).session(session);

                    if (!freeShippingVoucher) {
                        throw new Error('Mã voucher miễn phí vận chuyển không hợp lệ hoặc đã hết hạn');
                    }

                    if (subTotalAmt < freeShippingVoucher.minOrderValue) {
                        throw new Error(`Đơn hàng phải có giá trị tối thiểu ${freeShippingVoucher.minOrderValue} để sử dụng voucher miễn phí vận chuyển`);
                    }

                    // Validate products/categories if not applyForAllProducts
                    if (!freeShippingVoucher.applyForAllProducts) {
                        const productIds = list_items.map(item => item.productId._id.toString());
                        const isValidProducts = freeShippingVoucher.products.length === 0 || productIds.some(id => freeShippingVoucher.products.includes(id));
                        const isValidCategories = freeShippingVoucher.categories.length === 0 || list_items.some(item => freeShippingVoucher.categories.includes(item.productId.category));
                        if (!isValidProducts && !isValidCategories) {
                            throw new Error('Voucher miễn phí vận chuyển này không áp dụng cho sản phẩm trong giỏ hàng');
                        }
                    }

                    shippingCost = 0;
                }

                // Validate list_items
                for (const item of list_items) {
                    if (!item.productId?._id || !item.quantity || !item.productId.price) {
                        throw new Error('Thông tin sản phẩm không hợp lệ');
                    }
                }

                // Create the order
                const orderItems = list_items.map(item => {
                    const itemSubTotal = item.productId.price * item.quantity;
                    let itemTotal = itemSubTotal * (1 - (item.productId.discount || 0) / 100);
                    if (discountAmount > 0) {
                        const itemDiscount = (itemSubTotal / subTotalAmt) * discountAmount;
                        itemTotal -= itemDiscount;
                    }
                    if (shippingCost === 0) {
                        itemTotal = itemSubTotal * (1 - (item.productId.discount || 0) / 100);
                    }
                    return {
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
                        subTotalAmt: itemSubTotal,
                        totalAmt: itemTotal,
                        status: 'pending',
                        voucherApplied: [
                            regularVoucher ? {
                                code: regularVoucher.code,
                                discountType: regularVoucher.discountType,
                                discountValue: discountAmount,
                                isFreeShipping: false
                            } : null,
                            freeShippingVoucher ? {
                                code: freeShippingVoucher.code,
                                discountType: 'free_shipping',
                                discountValue: 0,
                                isFreeShipping: true
                            } : null
                        ].filter(Boolean)
                    };
                });

                const newOrders = await OrderModel.insertMany(orderItems, { session });
                const newOrderIds = newOrders.map(order => order._id);

                // Update product stock
                const stockUpdateResult = await updateProductStock(newOrderIds, session);
                if (!stockUpdateResult.success) {
                    throw new Error(stockUpdateResult.message);
                }

                // Update vouchers
                if (regularVoucher) {
                    await VoucherModel.findOneAndUpdate(
                        { code: regularVoucher.code },
                        {
                            $inc: { usageCount: 1 },
                            $push: { usersUsed: userId },
                            $set: {
                                isActive: regularVoucher.usageLimit ? regularVoucher.usageCount + 1 < regularVoucher.usageLimit : regularVoucher.isActive
                            }
                        },
                        { session }
                    );
                }
                if (freeShippingVoucher) {
                    await VoucherModel.findOneAndUpdate(
                        { code: freeShippingVoucher.code },
                        {
                            $inc: { usageCount: 1 },
                            $push: { usersUsed: userId },
                            $set: {
                                isActive: freeShippingVoucher.usageLimit ? freeShippingVoucher.usageCount + 1 < freeShippingVoucher.usageLimit : freeShippingVoucher.isActive
                            }
                        },
                        { session }
                    );
                }

                // Calculate points earned from this order
                const finalTotalAmt = orderItems.reduce((sum, item) => sum + item.totalAmt, 0) + shippingCost;
                const pointsEarned = calculatePointsFromOrder(finalTotalAmt);

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
                        pointsUsed: pointsToUse,
                        voucherApplied: {
                            regular: regularVoucher ? {
                                code: regularVoucher.code,
                                discountType: regularVoucher.discountType,
                                discountValue: discountAmount,
                                isFreeShipping: false
                            } : null,
                            freeShipping: freeShippingVoucher ? {
                                code: freeShippingVoucher.code,
                                discountType: 'free_shipping',
                                discountValue: 0,
                                isFreeShipping: true
                            } : null
                        }
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

            let errorMessage = 'Có lỗi xảy ra khi xử lý đơn hàng';
            if (error.message.includes('Người dùng không tồn tại')) {
                errorMessage = 'Người dùng không tồn tại';
            } else if (error.message.includes('Số điểm không đủ')) {
                errorMessage = 'Số điểm không đủ để sử dụng';
            } else if (error.message.includes('Mã voucher')) {
                errorMessage = error.message;
            } else if (error.message.includes('Đơn hàng phải có giá trị tối thiểu')) {
                errorMessage = error.message;
            } else if (error.message.includes('Thông tin sản phẩm không hợp lệ')) {
                errorMessage = error.message;
            } else if (error.message.includes('Voucher này không áp dụng')) {
                errorMessage = error.message;
            } else if (error.name === 'CastError') {
                errorMessage = 'Dữ liệu voucher không hợp lệ';
            }

            return response.status(400).json({
                message: errorMessage,
                error: true,
                success: false,
                errorDetails: error.name === 'CastError' ? { path: error.path, value: error.value } : undefined
            });
        } finally {
            if (session) {
                await session.endSession().catch(endSessionError => {
                    console.error('Error ending session:', endSessionError);
                });
            }
        }
    }

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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = request.userId;
        const { list_items, totalAmt, addressId, subTotalAmt, pointsToUse = 0, voucherCode, freeShippingVoucherCode } = request.body;

        if (!list_items?.length || !addressId || !subTotalAmt || !totalAmt) {
            return response.status(400).json({
                message: "Vui lòng điền đầy đủ các trường bắt buộc.",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return response.status(404).json({
                message: "Không tìm thấy User",
                error: true,
                success: false
            });
        }

        // Validate vouchers
        let regularVoucher = null;
        let freeShippingVoucher = null;
        let discountAmount = 0;
        let shippingCost = 30000; // Default shipping cost
        const now = new Date();

        // Validate regular voucher
        if (voucherCode) {
            regularVoucher = await VoucherModel.findOne({
                code: voucherCode,
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now },
                $or: [
                    { usageLimit: null },
                    { $expr: { $gt: ['$usageLimit', '$usageCount'] } }
                ],
                usersUsed: { $nin: [userId] }
            }).session(session);

            if (!regularVoucher) {
                await session.abortTransaction();
                session.endSession();
                return response.status(400).json({
                    message: 'Mã voucher giảm giá không hợp lệ hoặc đã hết hạn',
                    error: true,
                    success: false
                });
            }

            if (subTotalAmt < regularVoucher.minOrderValue) {
                await session.abortTransaction();
                session.endSession();
                return response.status(400).json({
                    message: `Đơn hàng phải có giá trị tối thiểu ${regularVoucher.minOrderValue} để sử dụng voucher này`,
                    error: true,
                    success: false
                });
            }

            // Validate products/categories if not applyForAllProducts
            if (!regularVoucher.applyForAllProducts) {
                const productIds = list_items.map(item => item.productId._id.toString());
                const isValidProducts = regularVoucher.products.length === 0 ||
                    productIds.some(id => regularVoucher.products.includes(id));
                const isValidCategories = regularVoucher.categories.length === 0 ||
                    list_items.some(item => regularVoucher.categories.includes(item.productId.category));

                if (!isValidProducts && !isValidCategories) {
                    await session.abortTransaction();
                    session.endSession();
                    return response.status(400).json({
                        message: 'Voucher này không áp dụng cho sản phẩm trong giỏ hàng',
                        error: true,
                        success: false
                    });
                }
            }

            if (regularVoucher.discountType === 'percentage') {
                discountAmount = (subTotalAmt * regularVoucher.discountValue) / 100;
                if (regularVoucher.maxDiscount && discountAmount > regularVoucher.maxDiscount) {
                    discountAmount = regularVoucher.maxDiscount;
                }
            } else if (regularVoucher.discountType === 'fixed') {
                discountAmount = regularVoucher.discountValue;
            }
        }

        // Validate free shipping voucher
        if (freeShippingVoucherCode) {
            freeShippingVoucher = await VoucherModel.findOne({
                code: freeShippingVoucherCode,
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now },
                isFreeShipping: true,
                $or: [
                    { usageLimit: null },
                    { $expr: { $gt: ['$usageLimit', '$usageCount'] } }
                ],
                usersUsed: { $nin: [userId] }
            }).session(session);

            if (!freeShippingVoucher) {
                await session.abortTransaction();
                session.endSession();
                return response.status(400).json({
                    message: 'Mã voucher miễn phí vận chuyển không hợp lệ hoặc đã hết hạn',
                    error: true,
                    success: false
                });
            }

            if (subTotalAmt < freeShippingVoucher.minOrderValue) {
                await session.abortTransaction();
                session.endSession();
                return response.status(400).json({
                    message: `Đơn hàng phải có giá trị tối thiểu ${freeShippingVoucher.minOrderValue} để sử dụng voucher miễn phí vận chuyển`,
                    error: true,
                    success: false
                });
            }

            // Validate products/categories if not applyForAllProducts
            if (!freeShippingVoucher.applyForAllProducts) {
                const productIds = list_items.map(item => item.productId._id.toString());
                const isValidProducts = freeShippingVoucher.products.length === 0 ||
                    productIds.some(id => freeShippingVoucher.products.includes(id));
                const isValidCategories = freeShippingVoucher.categories.length === 0 ||
                    list_items.some(item => freeShippingVoucher.categories.includes(item.productId.category));

                if (!isValidProducts && !isValidCategories) {
                    await session.abortTransaction();
                    session.endSession();
                    return response.status(400).json({
                        message: 'Voucher miễn phí vận chuyển này không áp dụng cho sản phẩm trong giỏ hàng',
                        error: true,
                        success: false
                    });
                }
            }

            shippingCost = 0;
        }

        // Calculate final amount after applying vouchers
        let finalTotal = totalAmt;
        if (discountAmount > 0) {
            finalTotal = Math.max(0, finalTotal - discountAmount);
        }
        if (shippingCost === 0) {
            finalTotal = Math.max(0, finalTotal - 30000); // Subtract default shipping cost if free shipping
        }

        // Handle case where total amount is 0 after using points and vouchers
        if (finalTotal === 0) {
            const session = await mongoose.startSession();
            try {
                const result = await session.withTransaction(async () => {
                    // Calculate item totals with discounts
                    const orderItems = list_items.map(item => {
                        const itemSubTotal = item.productId.price * item.quantity;
                        let itemTotal = itemSubTotal * (1 - (item.productId.discount || 0) / 100);

                        // Apply voucher discount proportionally to each item
                        if (discountAmount > 0) {
                            const itemDiscount = (itemSubTotal / subTotalAmt) * discountAmount;
                            itemTotal -= itemDiscount;
                        }

                        // If free shipping, don't include shipping cost in item total
                        if (shippingCost === 0) {
                            itemTotal = itemSubTotal * (1 - (item.productId.discount || 0) / 100);
                        }

                        return {
                            userId,
                            orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                            productId: item.productId._id,
                            product_details: {
                                name: item.productId.name,
                                image: item.productId.image
                            },
                            quantity: item.quantity,
                            payment_status: 'Đã thanh toán', // Paid with points
                            delivery_address: addressId,
                            subTotalAmt: itemSubTotal,
                            totalAmt: Math.max(0, itemTotal),
                            status: 'pending',
                            voucherApplied: [
                                regularVoucher ? {
                                    code: regularVoucher.code,
                                    discountType: regularVoucher.discountType,
                                    discountValue: discountAmount,
                                    isFreeShipping: false
                                } : null,
                                freeShippingVoucher ? {
                                    code: freeShippingVoucher.code,
                                    discountType: 'free_shipping',
                                    discountValue: 0,
                                    isFreeShipping: true
                                } : null
                            ].filter(Boolean)
                        };
                    });

                    const newOrders = await OrderModel.insertMany(orderItems, { session });
                    const newOrderIds = newOrders.map(order => order._id);

                    // Update voucher usage
                    const updatePromises = [];
                    if (regularVoucher) {
                        updatePromises.push(
                            VoucherModel.findByIdAndUpdate(
                                regularVoucher._id,
                                {
                                    $inc: { usageCount: 1 },
                                    $addToSet: { usedBy: userId }
                                },
                                { session }
                            )
                        );
                    }
                    if (freeShippingVoucher) {
                        updatePromises.push(
                            VoucherModel.findByIdAndUpdate(
                                freeShippingVoucher._id,
                                {
                                    $inc: { usageCount: 1 },
                                    $addToSet: { usedBy: userId }
                                },
                                { session }
                            )
                        );
                    }
                    await Promise.all(updatePromises);

                    // Update product stock
                    const stockUpdateResult = await updateProductStock(newOrderIds, session);
                    if (!stockUpdateResult.success) {
                        throw new Error(stockUpdateResult.message);
                    }

                    await UserModel.findByIdAndUpdate(userId,
                        { $inc: { rewardsPoint: -pointsToUse } },
                        { session }
                    );

                    const cartItemIds = list_items.map(item => item._id);
                    await CartProductModel.deleteMany({ _id: { $in: cartItemIds } }, { session });

                    // Commit the transaction
                    await session.commitTransaction();
                    session.endSession();

                    return response.status(200).json({
                        message: 'Đặt hàng thành công',
                        error: false,
                        success: true,
                        data: {
                            message: 'Đặt hàng thành công bằng điểm thưởng',
                            orders: newOrders,
                            pointsUsed: pointsToUse,
                            voucherCode: regularVoucher?.code,
                            freeShippingVoucherCode: freeShippingVoucher?.code
                        },
                        isFreeOrder: true
                    });
                });

                // If we get here, the transaction was already committed
                return;

            } catch (error) {
                console.error('Error in zero-amount order transaction:', error);
                return response.status(500).json({ message: 'Lỗi khi xử lý đơn hàng miễn phí', error: true, success: false });
            } finally {
                await session.endSession();
            }
        }

        // Tạo order tạm thởi
        const tempOrder = await OrderModel.insertMany(
            list_items.map(el => {
                const quantity = Number(el.quantity) || 1;
                const price = Number(el.productId.price) || 0;
                const subTotal = price * quantity;

                return {
                    userId,
                    orderId: `TEMP-${new mongoose.Types.ObjectId()}`,
                    productId: el.productId._id,
                    product_details: {
                        name: el.productId.name || 'Sản phẩm không tên',
                        image: Array.isArray(el.productId.image) ? el.productId.image : [el.productId.image || '']
                    },
                    quantity: quantity,
                    paymentId: '',
                    payment_status: 'Chờ thanh toán',
                    delivery_address: addressId,
                    subTotalAmt: subTotal,
                    totalAmt: subTotal, // For individual items, totalAmt is same as subTotal
                    status: 'pending',
                    isTemporary: true,
                    voucherCode: regularVoucher?.code || undefined,
                    freeShippingVoucherCode: freeShippingVoucher?.code || undefined
                };
            }),
            { session }
        );

        // For VND, we don't need to multiply by 100 as it doesn't have decimals
        const line_items = list_items.map((item) => {
            const product = item.productId;
            let unitAmount = Math.round(product.price * (1 - (product.discount || 0) / 100));

            // Apply voucher discount proportionally to each item
            if (discountAmount > 0) {
                const itemSubTotal = product.price * item.quantity;
                const itemDiscount = Math.round((itemSubTotal / subTotalAmt) * discountAmount);
                unitAmount = Math.max(0, unitAmount - Math.round(itemDiscount / item.quantity));
            }

            // For VND, we don't need to multiply by 100 as it doesn't have decimals
            unitAmount = Math.max(1, unitAmount); // Ensure minimum amount is 1 VND

            return {
                price_data: {
                    currency: 'vnd',
                    product_data: {
                        name: product.name,
                        images: Array.isArray(product.image)
                            ? product.image
                            : [typeof product.image === 'string' ? product.image : ''],
                        metadata: {
                            productId: product._id?.toString() || ''
                        }
                    },
                    unit_amount: unitAmount,
                },
                adjustable_quantity: {
                    enabled: false, // Disable quantity adjustment to prevent price miscalculations
                },
                quantity: item.quantity || 1
            };
        });

        // Add shipping as a separate line item if not free
        if (shippingCost > 0 && shippingCost < 100000000) { // Check Stripe's max amount
            line_items.push({
                price_data: {
                    currency: 'vnd',
                    product_data: {
                        name: 'Phí vận chuyển',
                        description: 'Phí vận chuyển tiêu chuẩn',
                    },
                    unit_amount: Math.round(shippingCost), // No need to multiply by 100 for VND
                },
                quantity: 1,
            });
        }

        const params = {
            submit_type: 'pay',
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: user.email,
            metadata: {
                userId: userId.toString(),
                addressId: addressId.toString(),
                tempOrderIds: JSON.stringify(tempOrder.map(o => o._id.toString())),
                orderTotal: Math.round(finalTotal).toString(), // Ensure we're sending a rounded number
                pointsToUse: pointsToUse.toString(),
                voucherCode: regularVoucher?.code || '',
                freeShippingVoucherCode: freeShippingVoucher?.code || ''
            },
            payment_intent_data: {
                metadata: {
                    userId: userId.toString(),
                    addressId: addressId.toString(),
                    orderTotal: Math.round(finalTotal).toString()
                }
            },
            line_items,
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`
        };

        // Commit the transaction before creating the Stripe session
        await session.commitTransaction();
        session.endSession();

        // Create the Stripe session
        const stripeSession = await Stripe.checkout.sessions.create(params);
        return response.status(200).json(stripeSession);

    } catch (error) {
        // If there's an error, abort any open transaction
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        console.error('Error in payment controller:', error);
        return response.status(500).json({
            message: error.message || "Lỗi Server",
            error: true,
            success: false
        });
    } finally {
        // Always end the session
        if (session.inTransaction()) {
            await session.endSession();
        }
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
            case 'checkout.session.completed': {
                const stripeSession = event.data.object;
                const dbSession = await mongoose.startSession();

                try {
                    await dbSession.withTransaction(async () => {
                        const { userId, tempOrderIds, pointsToUse: pointsToUseStr, orderTotal } = stripeSession.metadata || {};
                        if (!userId || !tempOrderIds) {
                            throw new Error('Missing required metadata in Stripe session');
                        }

                        const orderIds = JSON.parse(tempOrderIds);
                        const pointsToUse = Number(pointsToUseStr) || 0;
                        const totalAmount = Number(orderTotal) || 0;

                        // Idempotency Check: Ensure this transaction hasn't been processed
                        const firstOrder = await OrderModel.findById(orderIds[0]).session(dbSession);
                        if (!firstOrder || firstOrder.payment_status === 'Đã thanh toán') {
                            console.log(`Webhook for order ${orderIds[0]} already processed.`);
                            return; // Exit gracefully
                        }

                        // Update orders to 'Đã thanh toán'
                        await OrderModel.updateMany(
                            { _id: { $in: orderIds } },
                            { paymentId: stripeSession.payment_intent, payment_status: 'Đã thanh toán' },
                            { session: dbSession }
                        );

                        // Update product stock
                        const stockUpdateResult = await updateProductStock(orderIds, dbSession);
                        if (!stockUpdateResult.success) {
                            throw new Error(`Failed to update product stock: ${stockUpdateResult.message}`);
                        }

                        // Calculate points earned
                        const pointsEarned = calculatePointsFromOrder(totalAmount);
                        const pointsChange = pointsEarned - pointsToUse;

                        // Update user's points
                        if (pointsChange !== 0) {
                            await UserModel.findByIdAndUpdate(userId,
                                { $inc: { rewardsPoint: pointsChange } },
                                { session: dbSession }
                            );
                        }

                        // Update voucher usage count if vouchers were used
                        const { voucherCode, freeShippingVoucherCode } = stripeSession.metadata || {};

                        // Update regular voucher usage
                        if (voucherCode) {
                            await VoucherModel.findOneAndUpdate(
                                { code: voucherCode },
                                {
                                    $inc: { usageCount: 1 },
                                    $addToSet: { usersUsed: userId }
                                },
                                { session: dbSession, new: true }
                            );
                        }

                        // Update free shipping voucher usage
                        if (freeShippingVoucherCode) {
                            await VoucherModel.findOneAndUpdate(
                                { code: freeShippingVoucherCode },
                                {
                                    $inc: { usageCount: 1 },
                                    $addToSet: { usersUsed: userId }
                                },
                                { session: dbSession, new: true }
                            );
                        }
                    });
                } catch (error) {
                    console.error('Stripe webhook transaction failed:', error);
                    // Do not send a 500 to Stripe, as it will retry. Log the error for manual inspection.
                } finally {
                    await dbSession.endSession();
                }
                break;
            }
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

export async function updateOrderStatusController(request, response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const orderId = request.params.orderId;
        const { status } = request.body;

        console.log('Updating order status:', { orderId, status }); // Debug log
        const userId = request.userId;

        if (!orderId || !status) {
            return response.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc (orderId, status)'
            });
        }

        // Prepare update data
        const updateData = {
            payment_status: status,
            status: status === 'Đã thanh toán' ? 'processing' : 'pending'
        };

        // If status is being updated to 'Đã hủy', set the cancelledAt timestamp and save cancelReason
        if (status === 'Đã hủy') {
            updateData.status = 'cancelled';
            updateData.cancelledAt = new Date();
            
            if (request.body.cancelReason) {
                updateData.cancelReason = request.body.cancelReason;
            }
        }

        // Find and update the order
        const order = await OrderModel.findOneAndUpdate(
            { _id: orderId },
            { $set: updateData },
            { new: true, session }
        );

        if (!order) {
            await session.abortTransaction();
            return response.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // If status is updated to 'Đã thanh toán', add points to user
        if (status === 'Đã thanh toán') {
            const pointsEarned = Math.floor(order.totalAmt / 100); // 1 point per 100 VND

            await UserModel.findByIdAndUpdate(
                order.userId,
                {
                    $inc: { points: pointsEarned },
                    $push: {
                        pointHistory: {
                            points: pointsEarned,
                            type: 'earn',
                            orderId: order._id,
                            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
                        }
                    }
                },
                { session }
            );
        }

        await session.commitTransaction();

        response.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công',
            data: order
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error updating order status:', error);
        response.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật trạng thái đơn hàng'
        });
    } finally {
        session.endSession();
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