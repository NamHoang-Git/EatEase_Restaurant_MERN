import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
    // 👤 Người đặt bàn
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
        required: true,
    },

    // 🪑 Tham chiếu tới bàn
    tableId: {
        type: mongoose.Schema.ObjectId,
        ref: "table",
        required: true,
        index: true,
    },

    // 🏷️ Tên bàn (để hiển thị)
    tableNumber: {
        type: String,
        required: true,
        trim: true,
    },

    // 👥 Số lượng khách
    guestCount: {
        type: Number,
        required: true,
        min: 1,
    },

    // ⏰ Thời gian đặt
    reservationDate: {
        type: Date,
        required: true,
    },

    // 💬 Ghi chú thêm (ví dụ: “ngồi gần cửa sổ”)
    note: {
        type: String,
        default: "",
    },

    // 🧑‍🍳 Nhân viên phục vụ
    waiterId: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
        default: null,
    },

    // 🔗 Liên kết đơn hàng
    orders: [{
        type: mongoose.Schema.ObjectId,
        ref: "order"
    }],

    // 📝 Ghi chú nội bộ
    internalNotes: {
        type: String,
        default: "",
    },

    // 🔄 Trạng thái đặt bàn
    // PENDING: Chờ xác nhận
    // CONFIRMED: Đã xác nhận
    // SEATED: Đã đến nhà hàng
    // COMPLETED: Hoàn thành
    // CANCELLED: Đã hủy
    // NO_SHOW: Không đến
    status: {
        type: String,
        enum: ["PENDING", "CONFIRMED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"],
        default: "PENDING",
        index: true
    },

    // 📱 Thông tin khách vãng lai
    customerName: {
        type: String,
        default: "",
    },
    customerPhone: {
        type: String,
        default: "",
    },
    customerEmail: {
        type: String,
        default: "",
    },

    // 💰 Đặt cọc
    deposit: {
        type: Number,
        default: 0,
        min: 0,
    },

}, {
    timestamps: true
});

// 🔍 Index giúp truy vấn nhanh theo ngày & trạng thái
reservationSchema.index({ reservationDate: 1, status: 1 });
reservationSchema.index({ tableNumber: 1, reservationDate: 1 }, { unique: false });

/* 🧠 Middleware logic */

// 1️⃣ Trước khi lưu: kiểm tra trùng lịch bàn
reservationSchema.pre("save", async function (next) {
    const Reservation = mongoose.model("reservation");

    if (this.isNew || this.isModified("reservationDate") || this.isModified("tableNumber")) {
        const overlapping = await Reservation.findOne({
            tableNumber: this.tableNumber,
            reservationDate: this.reservationDate,
            status: { $in: ["PENDING", "CONFIRMED"] },
            _id: { $ne: this._id },
        });

        if (overlapping) {
            const err = new Error(`Bàn ${this.tableNumber} đã được đặt vào thời điểm này.`);
            return next(err);
        }
    }

    next();
});

// 2️⃣ Trước khi cập nhật: nếu đã quá giờ mà chưa CONFIRMED => chuyển NO_SHOW
reservationSchema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate();
    if (!update.status) {
        const docToUpdate = await this.model.findOne(this.getQuery());
        if (docToUpdate && docToUpdate.status === "PENDING") {
            const now = new Date();
            if (docToUpdate.reservationDate < now) {
                update.status = "NO_SHOW";
            }
        }
    }
    next();
});

// 3️⃣ Sau khi cập nhật trạng thái: đồng bộ với Order nếu có
reservationSchema.post("findOneAndUpdate", async function (doc) {
    if (!doc || !doc.orderId) return;

    const Order = mongoose.model("order");
    const order = await Order.findById(doc.orderId);
    if (!order) return;

    if (doc.status === "CANCELLED") {
        order.status = "CANCELLED";
    } else if (doc.status === "COMPLETED") {
        order.status = "COMPLETED";
    }

    await order.save();
});

const ReservationModel = mongoose.model("reservation", reservationSchema);

export default ReservationModel;
