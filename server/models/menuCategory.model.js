import mongoose from "mongoose";
import slugify from "slugify";

const menuCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        trim: true,
    },
    image: {
        type: String,
        default: "",
    },
    description: {
        type: String,
        default: "",
    },
    // 📋 Thứ tự hiển thị trên menu
    order: {
        type: Number,
        default: 0,
    },
    // ✅ Hiển thị hay ẩn trên website
    publish: {
        type: Boolean,
        default: true,
    },
    // 🔗 Danh sách sản phẩm thuộc danh mục này
    products: [{
        type: mongoose.Schema.ObjectId,
        ref: "product"
    }],
    // 📂 Danh sách danh mục con
    subCategories: [{
        type: mongoose.Schema.ObjectId,
        ref: "subMenuCategory"
    }],
}, {
    timestamps: true
});

// 🔧 Middleware tự động tạo slug từ name
menuCategorySchema.pre("save", function (next) {
    if (this.isModified("name") || !this.slug) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

// 🔍 Index hỗ trợ tìm kiếm nhanh
menuCategorySchema.index({ name: "text", description: "text" });

const MenuCategoryModel = mongoose.model("menuCategory", menuCategorySchema);

export default MenuCategoryModel;
