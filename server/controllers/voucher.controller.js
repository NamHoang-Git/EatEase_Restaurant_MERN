import VoucherModel from '../models/voucher.model.js';

export const addVoucerController = async (req, res) => {
    try {
        const { code, name, description, discountType, discountValue, minOrderValue,
            maxDiscount, startDate, endDate, usageLimit, isActive, applyForAllProducts, products, categories } = req.body

        const existVoucher = await VoucherModel.findOne({ code })

        if (existVoucher) {
            return res.status(400).json({
                message: "Mã voucher đã tồn tại",
                error: true,
                success: false
            })
        }

        const addVoucher = new VoucherModel({
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
            applyForAllProducts,
            products,
            categories
        })

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
            maxDiscount, startDate, endDate, usageLimit, isActive, applyForAllProducts, products, categories } = req.body

        const check = await VoucherModel.findById(_id)

        if (!check) {
            return res.status(400).json({
                message: 'Không tìm thấy _id',
                error: true,
                success: false
            })
        }

        const update = await VoucherModel.findByIdAndUpdate(
            _id,
            {
                code, name, description, discountType, discountValue, minOrderValue,
                maxDiscount, startDate, endDate, usageLimit, isActive, applyForAllProducts, products, categories
            },
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
        const { orderAmount, productIds = [] } = req.body;
        
        if (!orderAmount) {
            return res.status(400).json({
                message: "Vui lòng cung cấp tổng giá trị đơn hàng",
                error: true,
                success: false
            });
        }

        const currentDate = new Date();
        
        // Find all active vouchers that are valid for the current date
        const vouchers = await VoucherModel.find({
            isActive: true,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate },
            minOrderValue: { $lte: parseFloat(orderAmount) },
            $or: [
                { usageLimit: { $gt: 0 } }, // Has remaining usage
                { usageLimit: -1 } // Or unlimited usage
            ]
        }).sort({ minOrderValue: -1 }); // Sort by minOrderValue descending

        // Filter vouchers that are applicable to the products in the cart
        const applicableVouchers = vouchers.filter(voucher => {
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
        const formattedVouchers = applicableVouchers.map(voucher => ({
            id: voucher._id,
            code: voucher.code,
            name: voucher.name,
            description: voucher.description,
            minOrder: voucher.minOrderValue,
            discount: voucher.discountValue,
            discountType: voucher.discountType,
            expiryDate: new Date(voucher.endDate).toLocaleDateString('vi-VN'),
            isFreeShipping: voucher.discountType === 'freeship',
            maxDiscount: voucher.maxDiscount || null
        }));

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