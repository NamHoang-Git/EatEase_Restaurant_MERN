import mongoose from "mongoose";

const subMenuCategorySchema = new mongoose.Schema({
    // 🏷️ Tên danh mục con
    name: {
        type: String,
        required: true,
        trim: true,
    },

    // 🖼️ Ảnh minh hoạ
    image: {
        type: String,
        default: "",
    },

    // 💬 Mô tả ngắn (ví dụ: “Các món cà phê đặc trưng của quán”)
    description: {
        type: String,
        default: "",
    },

    // 🔗 Liên kết tới danh mục cha (MenuCategory)
    parentCategory: {
        type: mongoose.Schema.ObjectId,
        ref: "menuCategory",
        required: true,
        index: true,
    },

    // 🍽️ Danh sách sản phẩm thuộc danh mục con này
    products: [{
        type: mongoose.Schema.ObjectId,
        ref: "product"
    }],

    // ⚙️ Trạng thái hiển thị
    publish: {
        type: Boolean,
        default: true,
    },

    // 📊 Thứ tự hiển thị (ưu tiên, nếu bạn muốn sắp xếp menu)
    sortOrder: {
        type: Number,
        default: 0,
    },

}, {
    timestamps: true
});

// 🔍 Index giúp lọc theo danh mục cha và thứ tự
subMenuCategorySchema.index({ parentCategory: 1, sortOrder: 1 });

const SubMenuCategoryModel = mongoose.model("subMenuCategory", subMenuCategorySchema);

export default SubMenuCategoryModel;
