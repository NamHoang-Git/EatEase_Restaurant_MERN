import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    image: {
        type: Array,
        default: [],
    },
    category: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'category',
        }
    ],
    unit: {
        type: String,
        default: "",
    },
    stock: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        default: "",
    },
    more_details: {
        type: Object,
        default: {}
    },
    publish: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true
})

// Tạo text index cho name & description với trọng số (weights)
productSchema.index(
    { name: "text", description: "text" },
    { weights: { name: 10, description: 5 } } // name ưu tiên cao hơn
);

const ProductModel = mongoose.model("product", productSchema)

export default ProductModel