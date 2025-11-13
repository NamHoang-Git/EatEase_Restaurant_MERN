import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Vui lòng nhập tên"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Vui lòng nhập email"],
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Vui lòng nhập mật khẩu"],
        minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"]
    },
    phone: {
        type: String,
        trim: true
    },
    avatar: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: ["ADMIN", "MANAGER", "STAFF", "USER"],
        default: "USER"
    },
    position: {
        type: String,
        enum: ["WAITER", "CHEF", "CASHIER", null],
        default: null
    },
    // Điểm thưởng đơn giản
    points: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE"
    },
    refreshToken: String,
    lastLogin: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true
});

// Index cho tìm kiếm nhanh
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 });

const User = mongoose.model("User", userSchema);

export default User;
