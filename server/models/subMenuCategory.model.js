import mongoose from "mongoose";
import slugify from "slugify";

const subMenuCategorySchema = new mongoose.Schema(
    {
        // Tên danh mục phụ (VD: "Cà phê đặc biệt", "Nước ép trái cây")
        name: {
            type: String,
            required: [true, "Vui lòng nhập tên danh mục phụ"],
            trim: true,
            maxlength: [100, "Tên danh mục phụ không vượt quá 100 ký tự"],
            minlength: [2, "Tên danh mục phụ ít nhất 2 ký tự"],
        },

        // Đường dẫn thân thiện cho SEO
        slug: {
            type: String,
            unique: true,
            trim: true,
        },

        // Ảnh đại diện
        image: {
            type: String,
            default: "",
            trim: true,
        },

        // Mô tả ngắn về danh mục phụ
        description: {
            type: String,
            default: "",
            maxlength: [500, "Mô tả không vượt quá 500 ký tự"],
        },

        // Danh mục cha
        parentCategory: {
            type: mongoose.Schema.ObjectId,
            ref: "MenuCategory",
            required: [true, "Vui lòng chọn danh mục cha"],
            index: true,
        },

        // Thứ tự hiển thị (số nhỏ hiển thị trước)
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

        // Đánh dấu danh mục nổi bật
        isFeatured: {
            type: Boolean,
            default: false,
        },

        // Danh sách sản phẩm thuộc danh mục này
        products: [{
            type: mongoose.Schema.ObjectId,
            ref: "Product"
        }],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Tự động tạo slug từ tên danh mục phụ
subMenuCategorySchema.pre("save", function (next) {
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

// Virtual để đếm số lượng sản phẩm
subMenuCategorySchema.virtual('productCount').get(function () {
    return this.products?.length || 0;
});

// Index cho tìm kiếm và sắp xếp
subMenuCategorySchema.index({ name: 'text', description: 'text' });
subMenuCategorySchema.index({ parentCategory: 1, order: 1 });
subMenuCategorySchema.index({ isActive: 1, isFeatured: 1, order: 1 });

// Middleware xử lý trước khi xóa
subMenuCategorySchema.pre('remove', async function (next) {
    // Xử lý xóa sản phẩm liên quan
    // Có thể thêm logic xử lý ở đây
    next();
});

// Middleware xử lý sau khi lưu để cập nhật danh sách subCategories của MenuCategory
subMenuCategorySchema.post('save', async function (doc) {
    if (doc.isNew) {
        const MenuCategory = mongoose.model('MenuCategory');
        await MenuCategory.findByIdAndUpdate(
            doc.parentCategory,
            { $addToSet: { subCategories: doc._id } }
        );
    }
});

// Middleware xử lý trước khi xóa để xóa khỏi danh sách subCategories của MenuCategory
subMenuCategorySchema.pre('remove', async function (next) {
    const MenuCategory = mongoose.model('MenuCategory');
    await MenuCategory.findByIdAndUpdate(
        this.parentCategory,
        { $pull: { subCategories: this._id } }
    );
    next();
});

const SubMenuCategory = mongoose.model("SubMenuCategory", subMenuCategorySchema);

export default SubMenuCategory;
