import mongoose from "mongoose";

// Schema cho từng sản phẩm trong giỏ hàng
const cartItemSchema = new mongoose.Schema({
    // ID sản phẩm
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Vui lòng chọn sản phẩm"],
    },
    // Số lượng sản phẩm
    quantity: {
        type: Number,
        required: [true, "Vui lòng nhập số lượng"],
        min: [1, "Số lượng tối thiểu là 1"],
        max: [100, "Số lượng tối đa là 100"],
    },
    // Giá sản phẩm
    price: {
        type: Number,
        required: [true, "Vui lòng nhập giá sản phẩm"],
        min: [0, "Giá sản phẩm không được âm"],
    },
    // Tên sản phẩm
    name: {
        type: String,
        required: [true, "Vui lòng nhập tên sản phẩm"],
        trim: true,
    },
    // Ảnh đại diện sản phẩm
    image: {
        type: String,
        default: "",
    },
    // Ghi chú cho sản phẩm (ví dụ: ít đá, không đường)
    note: {
        type: String,
        trim: true,
        maxlength: [200, "Ghi chú không vượt quá 200 ký tự"],
    },
}, { _id: false, timestamps: true });

// Schema chính cho giỏ hàng
const cartSchema = new mongoose.Schema({
    // Tham chiếu đến người dùng (null cho khách vãng lai)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },

    // Dành cho khách vãng lai
    sessionId: {
        type: String,
        index: true,
    },

    // Danh sách sản phẩm trong giỏ
    items: [cartItemSchema],

    // Thông tin voucher
    voucher: {
        // Mã voucher
        code: {
            type: String,
            trim: true,
        },
        // Số tiền giảm giá
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        // Giá trị đơn hàng tối thiểu
        minOrderValue: {
            type: Number,
            default: 0,
        },
    },

    // Thông tin điểm tích lũy
    points: {
        // Số điểm đã sử dụng
        used: {
            type: Number,
            default: 0,
            min: 0,
        },
        // Số tiền giảm từ điểm
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },

    // Các tổng tiền
    // Tổng tiền tạm tính
    subtotal: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Tổng tiền giảm giá
    discountTotal: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Tổng tiền thanh toán cuối cùng
    total: {
        type: Number,
        default: 0,
        min: 0,
    },

    // Thời gian hết hạn (tự động xóa giỏ hàng cũ)
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
        index: { expires: 0 }, // TTL index
    },

    // Thông tin bổ sung
    metadata: {
        type: Map,
        of: String,
        default: {},
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Tạo index cho các trường thường dùng để tìm kiếm
cartSchema.index({ user: 1, sessionId: 1 }); // Tìm giỏ hàng theo user hoặc session
cartSchema.index({ updatedAt: 1 }); // Sắp xếp hoặc tìm kiếm theo thời gian cập nhật

// Ảo tính tổng số lượng sản phẩm trong giỏ
cartSchema.virtual('itemCount').get(function () {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Tính toán lại tất cả các giá trị tổng
cartSchema.methods.calculateTotals = function () {
    // Tính tổng tiền tạm tính
    this.subtotal = this.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
    );

    // Áp dụng giảm giá voucher nếu đủ điều kiện
    const voucherDiscount = this.subtotal >= this.voucher.minOrderValue
        ? this.voucher.discount
        : 0;

    // Áp dụng giảm giá từ điểm (không vượt quá giá trị đơn hàng)
    const pointsDiscount = Math.min(
        this.points.discount,
        this.subtotal - voucherDiscount
    );

    // Tổng tiền giảm giá
    this.discountTotal = voucherDiscount + pointsDiscount;
    // Tổng tiền thanh toán cuối cùng (không âm)
    this.total = Math.max(0, this.subtotal - this.discountTotal);

    return this.save();
};

// Thêm sản phẩm vào giỏ hàng
cartSchema.methods.addItem = async function (item) {
    // Kiểm tra xem sản phẩm đã có trong giỏ chưa
    const existingItem = this.items.find(
        i => i.product.toString() === item.product.toString()
    );

    // Nếu đã có thì cộng thêm số lượng
    if (existingItem) {
        existingItem.quantity += item.quantity;
    } else {
        // Nếu chưa có thì thêm mới
        this.items.push(item);
    }

    // Tính toán lại tổng tiền
    return this.calculateTotals();
};

// Xóa sản phẩm khỏi giỏ hàng
cartSchema.methods.removeItem = async function (productId) {
    // Tìm vị trí sản phẩm trong mảng
    const index = this.items.findIndex(
        item => item.product.toString() === productId.toString()
    );

    // Nếu tìm thấy thì xóa
    if (index > -1) {
        this.items.splice(index, 1);
        return this.calculateTotals();
    }

    return this;
};

// Áp dụng voucher
cartSchema.methods.applyVoucher = async function (voucher) {
    // Cập nhật thông tin voucher
    this.voucher = {
        code: voucher.code,
        discount: voucher.calculateDiscount(this.subtotal),
        minOrderValue: voucher.minOrderValue || 0,
    };

    // Tính toán lại tổng tiền
    return this.calculateTotals();
};

// Xóa toàn bộ giỏ hàng
cartSchema.methods.clear = function () {
    this.items = []; // Xóa tất cả sản phẩm
    this.voucher = {}; // Xóa voucher
    this.points = { used: 0, discount: 0 }; // Reset điểm
    return this.calculateTotals(); // Tính toán lại tổng tiền
};

// Kiểm tra trước khi lưu: phải có ít nhất user hoặc sessionId
cartSchema.pre('save', function (next) {
    if (!this.user && !this.sessionId) {
        const err = new Error('Giỏ hàng phải có ít nhất user hoặc sessionId');
        return next(err);
    }
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;