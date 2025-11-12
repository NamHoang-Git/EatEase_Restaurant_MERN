import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
    // Thông tin khách hàng
    customer: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "Vui lòng chọn khách hàng"]
    },

    // Thông tin bàn
    table: {
        type: mongoose.Schema.ObjectId,
        ref: "Table",
        required: [true, "Vui lòng chọn bàn"]
    },

    // Tên bàn (để hiển thị)
    tableNumber: {
        type: String,
        required: [true, "Vui lòng nhập số bàn"],
        trim: true
    },

    // Thông tin đặt bàn
    guestCount: {
        type: Number,
        required: [true, "Vui lòng nhập số lượng khách"],
        min: [1, "Số lượng khách tối thiểu là 1"]
    },

    reservationDate: {
        type: Date,
        required: [true, "Vui lòng chọn thời gian đặt bàn"]
    },

    // Thời gian dự kiến kết thúc
    endDate: {
        type: Date,
        required: [true, "Vui lòng chọn thời gian kết thúc"]
    },

    // Ghi chú
    note: {
        type: String,
        trim: true
    },

    // Nhân viên phục vụ
    staff: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    },

    // Trạng thái đặt bàn
    status: {
        type: String,
        enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
        default: "PENDING"
    },

    // Thông tin thanh toán
    deposit: {
        amount: {
            type: Number,
            default: 0,
            min: 0
        },
        status: {
            type: String,
            enum: ["PENDING", "PAID", "REFUNDED"],
            default: "PENDING"
        }
    }
}, {
    timestamps: true
});

// Index cho tìm kiếm nhanh
reservationSchema.index({ reservationDate: 1, status: 1 });
reservationSchema.index({ tableNumber: 1, reservationDate: 1 });
reservationSchema.index({ customer: 1, reservationDate: 1 });

// Middleware kiểm tra trùng lịch đặt bàn
reservationSchema.pre("save", async function (next) {
    if (this.isNew || this.isModified(["reservationDate", "tableNumber"])) {
        const Reservation = mongoose.model("Reservation");

        const existingReservation = await Reservation.findOne({
            tableNumber: this.tableNumber,
            $or: [
                {
                    reservationDate: { $lt: this.endDate },
                    endDate: { $gt: this.reservationDate }
                }
            ],
            status: { $in: ["PENDING", "CONFIRMED"] },
            _id: { $ne: this._id }
        });

        if (existingReservation) {
            const err = new Error(`Bàn ${this.tableNumber} đã được đặt trong khoảng thời gian này.`);
            return next(err);
        }
    }
    next();
});

// Tự động cập nhật trạng thái nếu quá hạn
reservationSchema.pre("find", function () {
    this.start = Date.now();
});

reservationSchema.post("find", async function (docs) {
    if (this._conditions.status === "PENDING") {
        const now = new Date();
        const expiredReservations = docs.filter(doc =>
            doc.reservationDate < now && doc.status === "PENDING"
        );

        if (expiredReservations.length > 0) {
            const Reservation = mongoose.model("Reservation");
            const ids = expiredReservations.map(doc => doc._id);

            await Reservation.updateMany(
                { _id: { $in: ids } },
                { $set: { status: "CANCELLED" } }
            );

            // Cập nhật lại docs để trả về
            docs.forEach(doc => {
                if (expiredReservations.some(r => r._id.equals(doc._id))) {
                    doc.status = "CANCELLED";
                }
            });
        }
    }
});

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;
