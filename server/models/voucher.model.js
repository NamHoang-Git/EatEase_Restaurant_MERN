import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed', 'free_shipping'],
        required: true
    },
    isFreeShipping: {
        type: Boolean,
        default: function() {
            return this.discountType === 'free_shipping';
        }
    },
    discountValue: {
        type: Number,
        required: function() {
            return this.discountType !== 'free_shipping';
        },
        min: 0,
        default: 0
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    maxDiscount: {
        type: Number,
        default: null
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: null
    },
    usageCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applyForAllProducts: {
        type: Boolean,
        default: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    }],
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    }],
    usersUsed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    // createdBy: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'user',
    //     required: true
    // }
}, {
    timestamps: true
});

// Chỉ giữ index compound cho isActive và endDate
voucherSchema.index({ isActive: 1, endDate: 1 });

// Áp dụng plugin trước khi tạo model
voucherSchema.plugin(mongoosePaginate);

const VoucherModel = mongoose.model('voucher', voucherSchema);

export default VoucherModel;