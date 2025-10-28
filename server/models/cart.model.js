import mongoose from "mongoose";

// 🧺 Schema cho từng món trong giỏ
const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1,
    },
    note: {
        type: String,
        default: "", // ví dụ: “ít cay”, “không đá”
    }
}, { _id: false });

// 🛒 Schema chính cho giỏ hàng
const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    items: [cartItemSchema],

    // 🎟️ Áp dụng voucher
    voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "voucher",
        default: null,
    },
    voucherCode: {
        type: String,
        default: null,
    },

    // 💎 Tích điểm thưởng (nếu có dùng điểm khi thanh toán)
    redeemedPoints: {
        type: Number,
        default: 0,
        min: 0,
    },

    // 💰 Tổng tiền tạm tính (chưa giảm)
    subtotal: {
        type: Number,
        default: 0,
        min: 0,
    },

    // 💸 Tổng sau khi áp dụng giảm giá
    total: {
        type: Number,
        default: 0,
        min: 0,
    },

    // ⚙️ Trạng thái giỏ (ACTIVE, CHECKED_OUT, EXPIRED)
    status: {
        type: String,
        enum: ["ACTIVE", "CHECKED_OUT", "EXPIRED"],
        default: "ACTIVE",
    }

}, { timestamps: true });


// 🧮 Middleware tự động tính subtotal & total
cartSchema.pre("save", async function (next) {
    if (!this.isModified("items") && !this.isModified("voucherId")) return next();

    // Lấy dữ liệu sản phẩm để tính tổng tiền
    const Product = mongoose.model("product");
    const itemsWithPrice = await Promise.all(
        this.items.map(async item => {
            const product = await Product.findById(item.productId).select("price");
            return product ? product.price * item.quantity : 0;
        })
    );

    this.subtotal = itemsWithPrice.reduce((sum, val) => sum + val, 0);

    // Nếu có voucher, tính giảm giá
    if (this.voucherId) {
        const Voucher = mongoose.model("voucher");
        const voucher = await Voucher.findById(this.voucherId);
        if (voucher && voucher.isActive) {
            const discount = voucher.calculateDiscount(this.subtotal);
            this.total = Math.max(0, this.subtotal - discount);
        } else {
            this.total = this.subtotal;
        }
    } else {
        this.total = this.subtotal;
    }

    next();
});

const CartModel = mongoose.model("cart", cartSchema);

export default CartModel;
