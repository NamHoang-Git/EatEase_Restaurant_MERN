import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const voucherSchema = new mongoose.Schema({
    // 🎟️ Mã giảm giá
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    
    // 🔄 Trạng thái kích hoạt
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    // 🏷️ Loại voucher
    voucherType: {
        type: String,
        enum: ["DISCOUNT", "GIFT", "MEMBERSHIP", "PROMOTION"],
        default: "DISCOUNT"
    },

    // 📛 Tên chương trình
    name: {
        type: String,
        required: true,
        trim: true
    },

    // 💬 Mô tả thêm
    description: {
        type: String,
        default: ""
    },

    // 💰 Loại giảm giá: phần trăm hoặc cố định
    discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true
    },
    
    // 🎯 Điều kiện áp dụng
    conditions: {
        // Số lần sử dụng tối đa
        maxUsage: {
            type: Number,
            default: null
        },
        // Số lần đã sử dụng
        usageCount: {
            type: Number,
            default: 0
        },
        // Giới hạn số lần sử dụng mỗi user
        maxUsagePerUser: {
            type: Number,
            default: 1
        },
        // Danh sách sản phẩm áp dụng
        applicableProducts: [{
            type: mongoose.Schema.ObjectId,
            ref: "product"
        }],
        // Danh sách danh mục áp dụng
        applicableCategories: [{
            type: mongoose.Schema.ObjectId,
            ref: "menuCategory"
        }],
        // Người dùng được áp dụng
        applicableUsers: [{
            type: mongoose.Schema.ObjectId,
            ref: "user"
        }],
        // Cấp độ thành viên được áp dụng
        applicableMembershipLevels: [{
            type: String,
            enum: ["BRONZE", "SILVER", "GOLD", "PLATINUM"]
        }]
    },

    // 💸 Giá trị giảm
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },

    // 💵 Giới hạn giảm tối đa (nếu là percentage)
    maxDiscount: {
        type: Number,
        default: null
    },
    
    // 📊 Thống kê sử dụng
    statistics: {
        totalDiscount: {
            type: Number,
            default: 0
        },
        totalOrders: {
            type: Number,
            default: 0
        },
        totalRevenue: {
            type: Number,
            default: 0
        }
    },
    
    // 📝 Lịch sử sử dụng
    usageHistory: [{
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "user"
        },
        orderId: {
            type: mongoose.Schema.ObjectId,
            ref: "order"
        },
        discountAmount: Number,
        orderTotal: Number,
        usedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // 💳 Giá trị đơn hàng tối thiểu để áp dụng
    minOrderValue: {
        type: Number,
        default: 0
    },

    // ⏰ Thời gian hiệu lực
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },

    // 🔢 Giới hạn số lượt sử dụng
    usageLimit: {
        type: Number,
        default: null
    },
    usageCount: {
        type: Number,
        default: 0
    },

    // ⚙️ Trạng thái hoạt động
    isActive: {
        type: Boolean,
        default: true
    },

    // 🎯 Áp dụng toàn hệ thống hay một số sản phẩm nhất định
    applyForAllProducts: {
        type: Boolean,
        default: true
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product"
        }
    ],
    categories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "menuCategory"
        }
    ],

    // 👤 Người dùng đã dùng
    usersUsed: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        }
    ],

}, { timestamps: true });

// 🔍 Index giúp tối ưu truy vấn
voucherSchema.index({ code: 1, isActive: 1, startDate: 1, endDate: 1 });
voucherSchema.index({ products: 1 });
voucherSchema.index({ categories: 1 });

// 📄 Plugin phân trang
voucherSchema.plugin(mongoosePaginate);

// 🧮 Phương thức tính giá trị giảm thực tế
voucherSchema.methods.calculateDiscount = function (orderTotal) {
    let discount = 0;

    if (this.discountType === "percentage") {
        discount = (orderTotal * this.discountValue) / 100;
        if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
    } else if (this.discountType === "fixed") {
        discount = Math.min(this.discountValue, orderTotal);
    }

    return discount;
};

const VoucherModel = mongoose.model("voucher", voucherSchema);

export default VoucherModel;
