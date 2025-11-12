import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
    // Số bàn (VD: "B01", "VIP-02")
    number: {
        type: String,
        required: [true, "Vui lòng nhập số bàn"],
        unique: true,
        trim: true,
        uppercase: true
    },

    // Tên hiển thị (VD: "Bàn 01 - Tầng 1")
    name: {
        type: String,
        required: [true, "Vui lòng nhập tên bàn"],
        trim: true
    },

    // Khu vực (VD: "Tầng 1", "Sân vườn", "Khu VIP")
    area: {
        type: String,
        required: [true, "Vui lòng chọn khu vực"],
        default: "Tầng 1"
    },

    // Sức chứa tối đa
    capacity: {
        type: Number,
        required: [true, "Vui lòng nhập sức chứa"],
        min: [1, "Sức chứa tối thiểu là 1 người"],
        max: [20, "Sức chứa tối đa là 20 người"]
    },

    // Trạng thái hiện tại
    status: {
        type: String,
        enum: {
            values: ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"],
            message: "Trạng thái không hợp lệ"
        },
        default: "AVAILABLE"
    },

    // Đặt bàn hiện tại (nếu có)
    currentReservation: {
        type: mongoose.Schema.ObjectId,
        ref: "Reservation"
    },

    // Nhân viên phụ trách
    staff: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    },

    // Ghi chú
    note: {
        type: String,
        trim: true,
        maxlength: [200, "Ghi chú không được vượt quá 200 ký tự"]
    },

    // Vị trí (cho sắp xếp bàn)
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
    },

    // Cờ xác định bàn có đang hoạt động không
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index cho tìm kiếm nhanh
tableSchema.index({ number: 1 }, { unique: true });
tableSchema.index({ area: 1, status: 1 });
tableSchema.index({ status: 1 });

// Virtual để lấy thông tin đơn hàng hiện tại
// Sử dụng populate('currentOrder') khi cần

tableSchema.virtual('currentOrder', {
    ref: 'Order',
    localField: '_id',
    foreignField: 'table',
    justOne: true,
    match: { status: { $in: ['PENDING', 'PROCESSING'] } }
});

const Table = mongoose.model("Table", tableSchema);

export default Table;
