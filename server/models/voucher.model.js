import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema({
    // Mã voucher (VD: "GIAMGIA20")
    code: {
        type: String,
        required: [true, "Vui lòng nhập mã voucher"],
        unique: true,
        trim: true,
        uppercase: true
    },

    // Tên chương trình khuyến mãi
    name: {
        type: String,
        required: [true, "Vui lòng nhập tên chương trình"],
        trim: true,
        maxlength: [100, "Tên chương trình không quá 100 ký tự"]
    },

    // Mô tả ngắn
    description: {
        type: String,
        trim: true,
        maxlength: [200, "Mô tả không quá 200 ký tự"]
    },

    // Loại giảm giá
    type: {
        type: String,
        enum: {
            values: ["PERCENTAGE", "FIXED_AMOUNT"],
            message: "Loại giảm giá không hợp lệ"
        },
        required: [true, "Vui lòng chọn loại giảm giá"]
    },

    // Giá trị giảm giá
    value: {
        type: Number,
        required: [true, "Vui lòng nhập giá trị giảm giá"],
        min: [0, "Giá trị giảm giá không được âm"]
    },

    // Giá trị đơn hàng tối thiểu
    minOrderAmount: {
        type: Number,
        default: 0,
        min: [0, "Giá trị tối thiểu không được âm"]
    },

    // Số lần sử dụng tối đa
    maxUsage: {
        type: Number,
        min: [1, "Số lần sử dụng tối thiểu là 1"]
    },

    // Số lần đã sử dụng
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Mỗi khách được dùng tối đa
    maxUsagePerUser: {
        type: Number,
        default: 1,
        min: 1
    },

    // Thời gian hiệu lực
    startDate: {
        type: Date,
        required: [true, "Vui lòng chọn ngày bắt đầu"]
    },
    endDate: {
        type: Date,
        required: [true, "Vui lòng chọn ngày kết thúc"],
        validate: {
            validator: function (value) {
                return !this.startDate || value > this.startDate;
            },
            message: "Ngày kết thúc phải sau ngày bắt đầu"
        }
    },

    // Trạng thái
    isActive: {
        type: Boolean,
        default: true
    },

    // Áp dụng cho tất cả sản phẩm
    applyToAll: {
        type: Boolean,
        default: true
    },

    // Danh sách sản phẩm áp dụng (nếu không áp dụng cho tất cả)
    applicableProducts: [{
        type: mongoose.Schema.ObjectId,
        ref: "Product"
    }],

    // Danh sách danh mục áp dụng (nếu không áp dụng cho tất cả)
    applicableCategories: [{
        type: mongoose.Schema.ObjectId,
        ref: "MenuCategory"
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index cho tìm kiếm nhanh
voucherSchema.index({ code: 1, isActive: 1 });
voucherSchema.index({ startDate: 1, endDate: 1 });

// Kiểm tra voucher còn hiệu lực không
voucherSchema.virtual('isValid').get(function () {
    const now = new Date();
    return this.isActive &&
        this.startDate <= now &&
        this.endDate >= now &&
        (!this.maxUsage || this.usageCount < this.maxUsage);
});

// Phương thức tính tiền giảm giá
voucherSchema.methods.calculateDiscount = function (orderAmount) {
    if (orderAmount < this.minOrderAmount) {
        return 0; // Không đủ điều kiện
    }

    if (this.type === 'PERCENTAGE') {
        return Math.min(
            orderAmount * (this.value / 100),
            orderAmount // Không giảm quá tổng đơn hàng
        );
    } else {
        return Math.min(this.value, orderAmount);
    }
};

// Phương thức kiểm tra xem voucher có thể áp dụng không
voucherSchema.methods.canApply = function (userId, orderAmount) {
    if (!this.isValid) return false;
    if (orderAmount < this.minOrderAmount) return false;

    // TODO: Kiểm tra xem user đã dùng voucher này chưa

    return true;
};

const Voucher = mongoose.model("Voucher", voucherSchema);

export default Voucher;
