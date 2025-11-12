import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: [true, "Vui lòng chọn sản phẩm"]
    },
    name: {
        type: String,
        required: [true, "Vui lòng nhập tên sản phẩm"]
    },
    price: {
        type: Number,
        required: [true, "Vui lòng nhập giá sản phẩm"],
        min: [0, "Giá sản phẩm không được âm"]
    },
    quantity: {
        type: Number,
        required: [true, "Vui lòng nhập số lượng"],
        min: [1, "Số lượng tối thiểu là 1"]
    },
    note: {
        type: String,
        trim: true
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    // Thông tin khách hàng
    customer: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "Vui lòng chọn khách hàng"]
    },

    // Thông tin nhân viên
    staff: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    },

    // Thông tin đơn hàng
    orderType: {
        type: String,
        enum: ["DINE_IN", "TAKE_AWAY"],
        default: "DINE_IN"
    },

    // Thông tin bàn (nếu là đơn tại bàn)
    table: {
        type: mongoose.Schema.ObjectId,
        ref: "Table"
    },
    tableNumber: String,

    // Chi tiết đơn hàng
    items: [orderItemSchema],

    // Thông tin thanh toán
    subtotal: {
        type: Number,
        required: [true, "Vui lòng nhập tổng tiền"],
        min: [0, "Tổng tiền không được âm"]
    },

    discount: {
        amount: {
            type: Number,
            default: 0,
            min: 0
        },
        voucher: {
            type: mongoose.Schema.ObjectId,
            ref: "Voucher"
        }
    },

    total: {
        type: Number,
        required: [true, "Vui lòng nhập tổng thanh toán"],
        min: [0, "Tổng thanh toán không được âm"]
    },

    // Trạng thái đơn hàng
    status: {
        type: String,
        enum: ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"],
        default: "PENDING"
    },

    // Thông tin thanh toán
    payment: {
        method: {
            type: String,
            enum: ["CASH", "CARD", "MOMO", "ZALOPAY"],
            default: "CASH"
        },
        status: {
            type: String,
            enum: ["PENDING", "PAID", "REFUNDED"],
            default: "PENDING"
        },
        transactionId: String
    },

    // Điểm thưởng
    points: {
        earned: {
            type: Number,
            default: 0,
            min: 0
        },
        used: {
            type: Number,
            default: 0,
            min: 0
        }
    },

    // Ghi chú
    note: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Tính điểm thưởng (1% tổng tiền)
orderSchema.pre('save', function (next) {
    if (this.isNew || this.isModified('total')) {
        this.points.earned = Math.floor(this.total * 0.01);
    }
    next();
});

// Index cho tìm kiếm nhanh
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1, createdAt: -1 });

// Virtual để lấy thông tin giảm giá
orderSchema.virtual('discountAmount').get(function () {
    return this.subtotal - this.total + (this.discount?.amount || 0);
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
