import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema({
    // Tên món ăn
    name: {
        type: String,
        required: [true, "Vui lòng nhập tên sản phẩm"],
        trim: true,
    },

    // Slug cho URL thân thiện
    slug: {
        type: String,
        unique: true,
        trim: true,
    },

    // Hình ảnh
    images: [{
        type: String,
        default: []
    }],

    // Danh mục chính
    category: {
        type: mongoose.Schema.ObjectId,
        ref: "Category",
        required: [true, "Vui lòng chọn danh mục"]
    },

    // Danh mục phụ (nếu có)
    subCategory: {
        type: mongoose.Schema.ObjectId,
        ref: "SubCategory"
    },

    // Giá bán
    price: {
        type: Number,
        required: [true, "Vui lòng nhập giá bán"],
        min: [0, "Giá bán không được âm"]
    },

    // Giá gốc (để hiển thị giảm giá)
    originalPrice: {
        type: Number,
        default: 0
    },

    // Mô tả
    description: {
        type: String,
        trim: true
    },

    // Đơn vị tính
    unit: {
        type: String,
        default: "phần"
    },

    // Trạng thái (còn hàng/hết hàng)
    inStock: {
        type: Boolean,
        default: true
    },

    // Có hiển thị trên menu không
    isActive: {
        type: Boolean,
        default: true
    },

    // Thông tin bổ sung
    more_details: {
        type: Object,
        default: {},
    },

    // Điểm thưởng khi mua sản phẩm
    rewardPoints: {
        type: Number,
        default: 0,
        min: 0
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Tự động tạo slug từ tên sản phẩm
productSchema.pre("save", function (next) {
    if (this.isModified("name") || !this.slug) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }

    // Tự động điền originalPrice nếu chưa có
    if (this.isNew && !this.originalPrice) {
        this.originalPrice = this.price;
    }

    next();
});

// Index cho tìm kiếm nhanh
productSchema.index({ name: "text", description: "text" }, {
    weights: {
        name: 10,
        description: 5
    }
});

// Tạo virtual field cho giá giảm
productSchema.virtual('discount').get(function () {
    if (this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

const Product = mongoose.model("Product", productSchema);

export default Product;
