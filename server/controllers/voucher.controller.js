import VoucherModel from '../models/voucher.model.js';

export const addVoucerController = async (req, res) => {
    try {
        const { code, name, description, discountType, discountValue, minOrderValue,
            maxDiscount, startDate, endDate, usageLimit, isActive, isFreeShipping, applyForAllProducts, products, categories } = req.body;

        // Validate free shipping voucher
        if (discountType === 'free_shipping') {
            // For free shipping, we don't need discountValue
            delete req.body.discountValue;
            delete req.body.maxDiscount; // Free shipping doesn't need max discount
        } else if (discountType === 'percentage' && !maxDiscount) {
            return res.status(400).json({
                message: "Vui lòng nhập giảm giá tối đa cho loại giảm giá phần trăm",
                error: true,
                success: false
            });
        }

        const existVoucher = await VoucherModel.findOne({ code });

        if (existVoucher) {
            return res.status(400).json({
                message: "Mã voucher đã tồn tại",
                error: true,
                success: false
            });
        }

        const voucherData = {
            code,
            name,
            description,
            discountType,
            minOrderValue: minOrderValue || 0,
            startDate,
            endDate,
            usageLimit: usageLimit || null,
            isActive: isActive !== undefined ? isActive : true,
            isFreeShipping: discountType === 'free_shipping',
            applyForAllProducts: applyForAllProducts || false,
            products: applyForAllProducts ? [] : (products || []),
            categories: applyForAllProducts ? [] : (categories || [])
        };

        // Only add discountValue and maxDiscount if not free shipping
        if (discountType !== 'free_shipping') {
            voucherData.discountValue = discountValue;
            if (discountType === 'percentage') {
                voucherData.maxDiscount = maxDiscount;
            }
        }

        const addVoucher = new VoucherModel(voucherData);

        const saveVoucher = await addVoucher.save()

        if (!saveVoucher) {
            return res.status(500).json({
                message: "Không tạo được voucher",
                error: true,
                success: false
            })
        }

        return res.json({
            message: "Thêm voucher thành công",
            data: saveVoucher,
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const getAllVoucherController = async (req, res) => {
    try {
        const data = await VoucherModel.find().sort({ createdAt: -1 })

        return res.json({
            message: 'Danh mục Data',
            data: data,
            error: false,
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const updateVoucherController = async (req, res) => {
    try {
        const { _id, code, name, description, discountType, discountValue, minOrderValue,
            maxDiscount, startDate, endDate, usageLimit, isActive, isFreeShipping, applyForAllProducts, products, categories } = req.body

        const check = await VoucherModel.findById(_id)

        if (!check) {
            return res.status(400).json({
                message: 'Không tìm thấy _id',
                error: true,
                success: false
            })
        }

        const updateData = {
            code,
            name,
            description,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscount,
            startDate,
            endDate,
            usageLimit,
            isActive,
            isFreeShipping: discountType === 'free_shipping' ? true : (isFreeShipping || false),
            applyForAllProducts,
            products,
            categories
        };

        const update = await VoucherModel.findByIdAndUpdate(
            _id,
            updateData,
            { new: true }
        )

        return res.json({
            message: 'Cập nhật voucher thành công',
            data: update,
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const deleteVoucherController = async (req, res) => {
    try {
        const { _id } = req.body

        const deleteVoucher = await VoucherModel.findByIdAndDelete(_id)

        return res.json({
            message: 'Xóa voucher thành công',
            data: deleteVoucher,
            error: false,
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const bulkDeleteVouchersController = async (req, res) => {
    try {
        const { voucherIds } = req.body;

        if (!voucherIds || !Array.isArray(voucherIds) || voucherIds.length === 0) {
            return res.status(400).json({
                message: 'Danh sách voucher không hợp lệ',
                error: true,
                success: false
            });
        }

        // Delete multiple vouchers by their IDs
        const result = await VoucherModel.deleteMany({
            _id: { $in: voucherIds }
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy voucher để xóa',
                error: true,
                success: false
            });
        }

        return res.status(200).json({
            message: `Đã xóa thành công ${result.deletedCount} voucher`,
            data: { deletedCount: result.deletedCount },
            error: false,
            success: true
        });

    } catch (error) {
        console.error('Lỗi khi xóa hàng loạt voucher:', error);
        return res.status(500).json({
            message: error.message || 'Đã xảy ra lỗi khi xóa voucher',
            error: true,
            success: false
        });
    }
}

export const getAvailableVouchersController = async (req, res) => {
    try {
        const { orderAmount, productIds = [], cartItems = [] } = req.body;

        console.log('Received request with:', {
            orderAmount,
            productIds: productIds.length,
            cartItems: cartItems.length
        });

        if (orderAmount === undefined || orderAmount === null) {
            return res.status(400).json({
                message: "Vui lòng cung cấp tổng giá trị đơn hàng",
                error: true,
                success: false
            });
        }

        const currentDate = new Date();

        // Calculate the actual total after applying product discounts
        let actualTotal = 0;
        if (Array.isArray(cartItems) && cartItems.length > 0) {
            // First, use the orderAmount as the base (should be the discounted total from frontend)
            actualTotal = parseFloat(orderAmount);

            // Then verify by calculating from cart items
            const calculatedTotal = cartItems.reduce((total, item) => {
                const product = item.productId || {};
                const price = product.discountPrice > 0 && product.discountPrice < product.price
                    ? product.discountPrice
                    : product.price;
                const itemTotal = price * (item.quantity || 1);

                console.log('Item calculation:', {
                    productId: product._id,
                    originalPrice: product.price,
                    discountPrice: product.discountPrice,
                    quantity: item.quantity,
                    itemTotal
                });

                return total + itemTotal;
            }, 0);

            console.log('Order amount from frontend:', actualTotal);
            console.log('Calculated total from cart items:', calculatedTotal);

            // Use the smaller of the two values to be safe
            actualTotal = Math.min(actualTotal, calculatedTotal);
        } else {
            actualTotal = parseFloat(orderAmount);
            console.log('No cart items, using provided order amount:', actualTotal);
        }

        // Find all active vouchers that match the price range, including upcoming ones
        const vouchers = await VoucherModel.find({
            isActive: true,
            endDate: { $gte: currentDate },
            $or: [
                { usageLimit: { $gt: 0 } }, // Has remaining usage
                { usageLimit: -1 } // Or unlimited usage
            ]
        }).sort({ startDate: 1 }); // Sort by start date ascending

        // Filter vouchers that are applicable to the products in the cart and meet the minimum order value
        const applicableVouchers = vouchers.filter(voucher => {
            // First check if the actual total meets the minimum order value
            const meetsMinOrder = actualTotal >= voucher.minOrderValue;
            if (!meetsMinOrder) return false;

            // If voucher is for all products, it's applicable
            if (voucher.applyForAllProducts) return true;

            // If no specific products are specified in the voucher, it's applicable
            if (!voucher.products || voucher.products.length === 0) return true;

            // Check if any product in the cart is in the voucher's product list
            return productIds.some(productId =>
                voucher.products.some(p => p.toString() === productId)
            );
        });

        // Format the response
        const formattedVouchers = applicableVouchers.map(voucher => {
            const now = new Date();
            const isUpcoming = new Date(voucher.startDate) > now;
            const isActive = !isUpcoming && new Date(voucher.endDate) > now;
            const isFreeShipping = voucher.discountType === 'free_shipping' || voucher.isFreeShipping === true;

            // Format the description to include free shipping info if applicable
            let description = voucher.description || '';
            if (isFreeShipping) {
                description = description ? `${description}. ` : '';
                description += 'Miễn phí vận chuyển cho đơn hàng từ ' +
                    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                        .format(voucher.minOrderValue || 0);
            }

            return {
                id: voucher._id,
                code: voucher.code,
                name: voucher.name,
                description,
                minOrder: voucher.minOrderValue,
                discount: isFreeShipping ? 0 : voucher.discountValue,
                discountType: voucher.discountType,
                startDate: voucher.startDate,
                expiryDate: new Date(voucher.endDate).toLocaleDateString('vi-VN'),
                isFreeShipping,
                maxDiscount: isFreeShipping ? null : (voucher.maxDiscount || null),
                isActive,
                isUpcoming,
                availableFrom: isUpcoming ? new Date(voucher.startDate).toLocaleDateString('vi-VN') : null,
                // Add human-readable discount text
                discountText: isFreeShipping
                    ? 'Miễn phí vận chuyển'
                    : voucher.discountType === 'percentage'
                        ? `Giảm ${voucher.discountValue}% (Tối đa ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(voucher.maxDiscount || 0)})`
                        : `Giảm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(voucher.discountValue || 0)}`
            };
        });

        return res.json({
            message: 'Danh sách voucher khả dụng',
            data: formattedVouchers,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const bulkUpdateVouchersStatusController = async (req, res) => {
    try {
        const { voucherIds, isActive } = req.body;

        if (!voucherIds || !Array.isArray(voucherIds) || voucherIds.length === 0) {
            return res.status(400).json({
                message: 'Danh sách voucher không hợp lệ',
                error: true,
                success: false
            });
        }

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({
                message: 'Trạng thái không hợp lệ',
                error: true,
                success: false
            });
        }

        // Update status of multiple vouchers
        const result = await VoucherModel.updateMany(
            { _id: { $in: voucherIds } },
            { $set: { isActive } },
            { new: true }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy voucher để cập nhật',
                error: true,
                success: false
            });
        }

        return res.status(200).json({
            message: `Đã cập nhật trạng thái thành công cho ${result.modifiedCount} voucher`,
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            },
            error: false,
            success: true
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái hàng loạt voucher:', error);
        return res.status(500).json({
            message: error.message || 'Đã xảy ra lỗi khi cập nhật trạng thái voucher',
            error: true,
            success: false
        });
    }
}
