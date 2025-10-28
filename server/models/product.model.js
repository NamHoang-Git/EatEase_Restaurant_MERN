import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema({
    // 🍽️ Tên món ăn
    name: {
        type: String,
        required: true,
        trim: true,
    },

    // 🔗 Slug cho URL thân thiện
    slug: {
        type: String,
        unique: true,
        trim: true,
    },

    // 🖼️ Hình ảnh món ăn
    image: {
        type: [String],
        default: [],
    },

    // 📂 Danh mục món ăn (Khai vị, Món chính, Nước uống,...)
    category: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "menuCategory",
        }
    ],

    subCategory: {
        type: mongoose.Schema.ObjectId,
        ref: "subMenuCategory",
        default: null,
    },

    // 🧾 Đơn vị tính (ví dụ: phần, ly, tô,…)
    unit: {
        type: String,
        default: "phần",
    },

    // 💰 Giá món ăn
    price: {
        type: Number,
        required: true,
        min: 0,
    },

    // 🔖 Giảm giá (nếu có)
    discount: {
        type: Number,
        default: 0,
        min: 0,
    },

    // 📝 Mô tả ngắn
    description: {
        type: String,
        default: "",
    },

    // 📋 Thông tin chi tiết (nguyên liệu, khối lượng,…)
    more_details: {
        type: Object,
        default: {},
    },

    // ⭐ Điểm thưởng (reward points) người dùng nhận được khi mua món này
    rewardPoints: {
        type: Number,
        default: 0,
        min: 0,
    },

    // 👁️ Trạng thái hiển thị trong menu
    publish: {
        type: Boolean,
        default: true,
    },

    // 📊 Đánh giá trung bình (nếu sau này có phần review)
    ratingAvg: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },

    // 🔢 Số lượng đánh giá
    ratingCount: {
        type: Number,
        default: 0,
        min: 0,
    },

}, {
    timestamps: true
});

// 🔧 Tự động tạo slug từ tên món ăn
productSchema.pre("save", function (next) {
    if (this.isModified("name") || !this.slug) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

// 🔍 Index hỗ trợ tìm kiếm nhanh theo tên và mô tả
productSchema.index(
    { name: "text", description: "text" },
    { weights: { name: 10, description: 5 } }
);

const ProductModel = mongoose.model("product", productSchema);

export default ProductModel;
