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
