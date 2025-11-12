import mongoose from "mongoose";
import slugify from "slugify";

const menuCategorySchema = new mongoose.Schema(
    {
        // Tên danh mục (VD: "Đồ uống", "Món khai vị")
        name: {
            type: String,
            required: [true, "Vui lòng nhập tên danh mục"],
            trim: true,
            maxlength: [100, "Tên danh mục không vượt quá 100 ký tự"],
            minlength: [2, "Tên danh mục ít nhất 2 ký tự"],
        },

        // Đường dẫn thân thiện cho SEO
        slug: {
            type: String,
            unique: true,
            trim: true,
        },

        // Ảnh đại diện danh mục
        image: {
            type: String,
            default: "",
            trim: true,
        },

        // Mô tả ngắn về danh mục
        description: {
            type: String,
            default: "",
            maxlength: [500, "Mô tả không vượt quá 500 ký tự"],
        },

        // Thứ tự hiển thị trên menu (số nhỏ hiển thị trước)
        order: {
            type: Number,
            default: 0,
            min: [0, "Thứ tự không được nhỏ hơn 0"],
        },

        // Trạng thái hiển thị
        isActive: {
            type: Boolean,
            default: true,
        },

        // Danh sách sản phẩm thuộc danh mục này
        products: [{
            type: mongoose.Schema.ObjectId,
            ref: "product"
        }],

        // Danh sách danh mục con
        subCategories: [{
            type: mongoose.Schema.ObjectId,
            ref: "subMenuCategory"
        }],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Tự động tạo slug từ tên danh mục
menuCategorySchema.pre("save", function (next) {
    if (this.isModified("name") || !this.slug) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
            locale: 'vi',
            remove: /[*+~.()'"!:@]/g
        });
    }
    next();
});

// Virtual để đếm số lượng sản phẩm trong danh mục
menuCategorySchema.virtual('productCount').get(function () {
    return this.products?.length || 0;
});

// Virtual để đếm số lượng danh mục con
menuCategorySchema.virtual('subCategoryCount').get(function () {
    return this.subCategories?.length || 0;
});

// Index cho tìm kiếm và sắp xếp
menuCategorySchema.index({ name: 'text', description: 'text' });
menuCategorySchema.index({ order: 1, name: 1 });
menuCategorySchema.index({ isActive: 1, order: 1 });

// Middleware xử lý trước khi xóa
menuCategorySchema.pre('remove', async function (next) {
    // Xử lý xóa danh mục con và sản phẩm liên quan
    // Có thể thêm logic xử lý ở đây
    next();
});

const MenuCategory = mongoose.model("MenuCategory", menuCategorySchema);

export default MenuCategory;
