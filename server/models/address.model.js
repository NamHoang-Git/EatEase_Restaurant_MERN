import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    address_line: {
        type: String,
        default: "",
    },
    city: {
        type: String,
        default: "",
    },
    state: {
        type: String,
        default: "",
    },
    country: {
        type: String,
        default: "",
    },
    mobile: {
        type: String,
        default: null,
    },
    status: {
        type: Boolean,
        default: true,
    },
    userId: {
        type: mongoose.Schema.ObjectId,
    },
    isDefault: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
})

const AddressModel = mongoose.model("address", addressSchema)

export default AddressModel