import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
    // 🪑 Mã / số bàn (ví dụ: "B01", "VIP-02")
    tableNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    // 📍 Khu vực (ví dụ: “Tầng 1”, “Sân vườn”, “VIP Room”)
    area: {
        type: String,
        default: "Main Hall",
        trim: true,
    },

    // 👥 Sức chứa tối đa của bàn
    capacity: {
        type: Number,
        required: true,
        min: 1,
    },

    // ⚙️ Trạng thái hiện tại của bàn
    status: {
        type: String,
        enum: ["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING", "OUT_OF_SERVICE"],
        default: "AVAILABLE",
    },

    // 🔗 Đặt bàn hiện tại (nếu có)
    currentReservation: {
        type: mongoose.Schema.ObjectId,
        ref: "reservation",
        default: null,
    },

    // 🧑‍🍳 Nhân viên phục vụ chính cho bàn
    assignedWaiter: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
        default: null,
    },

    // 🛒 Các đơn hàng hiện tại của bàn
    currentOrders: [{
        type: mongoose.Schema.ObjectId,
        ref: "order"
    }],

    // 📅 Lịch sử đặt bàn
    reservations: [{
        type: mongoose.Schema.ObjectId,
        ref: "reservation"
    }],

    // 🗺️ Vị trí trên sơ đồ (nếu có UI layout)
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
    },

    // 💬 Ghi chú nội bộ (ví dụ: “Gần cửa sổ”, “Dành cho khách VIP”)
    note: {
        type: String,
        default: "",
    },

}, {
    timestamps: true
});

// Index giúp lọc nhanh theo trạng thái & khu vực
tableSchema.index({ area: 1, status: 1 });

const TableModel = mongoose.model("table", tableSchema);

export default TableModel;
