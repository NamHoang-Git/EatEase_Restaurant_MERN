import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.ObjectId,
        ref: "product",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    note: {
        type: String,
        default: "",
    },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    // 👤 Người dùng đặt bàn hoặc order
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
        required: true,
    },

    // 🧑‍🍳 Nhân viên liên quan
    waiterId: {
        type: mongoose.Schema.ObjectId,
        ref: "user", // phục vụ
        default: null,
    },
    chefId: {
        type: mongoose.Schema.ObjectId,
        ref: "user", // đầu bếp
        default: null,
    },
    cashierId: {
        type: mongoose.Schema.ObjectId,
        ref: "user", // thu ngân
        default: null,
    },

    // 🍽️ Loại đơn hàng (ăn tại bàn / mang đi)
    orderType: {
        type: String,
        enum: ["DINE_IN", "TAKE_AWAY"],
        default: "DINE_IN",
    },

    // 🪑 Đặt bàn (liên kết với Reservation nếu có)
    tableNumber: {
        type: String,
        default: null,
    },
    reservationId: {
        type: mongoose.Schema.ObjectId,
        ref: "reservation",
        default: null,
    },

    // 🧾 Danh sách món ăn
    items: [orderItemSchema],

    // 💰 Tổng tiền
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
    },
    total: {
        type: Number,
        required: true,
        min: 0,
    },

    // 🎟️ Voucher (nếu áp dụng)
    voucherId: {
        type: mongoose.Schema.ObjectId,
        ref: "voucher",
        default: null,
    },
    voucherCode: {
        type: String,
        default: null,
    },

    // 💳 Thanh toán
    paymentMethod: {
        type: String,
        enum: ["CASH", "CARD", "MOMO", "ZALOPAY"],
        default: "CASH",
    },
    paymentStatus: {
        type: String,
        enum: ["UNPAID", "PAID", "REFUNDED"],
        default: "UNPAID",
    },

    // 🧩 Trạng thái xử lý món ăn
    orderStatus: {
        type: String,
        enum: ["PENDING", "COOKING", "READY", "SERVED", "COMPLETED", "CANCELLED"],
        default: "PENDING",
    },

    // 💎 Tích điểm thưởng
    earnedPoints: {
        type: Number,
        default: 0,
        min: 0,
    },
    redeemedPoints: {
        type: Number,
        default: 0,
        min: 0,
    },

    // ⏰ Thời gian xử lý
    orderTime: {
        type: Date,
        default: Date.now,
    },
    completedTime: {
        type: Date,
        default: null,
    },

    // 📝 Ghi chú từ khách hoặc nhân viên
    note: {
        type: String,
        default: "",
    },

}, { timestamps: true });


// 🧮 Tự động tính điểm thưởng (1% tổng tiền)
orderSchema.pre('save', function (next) {
    if (this.isNew && this.total > 0) {
        this.earnedPoints = Math.floor(this.total * 0.01);
    }
    next();
});

const OrderModel = mongoose.model("order", orderSchema);

export default OrderModel;
