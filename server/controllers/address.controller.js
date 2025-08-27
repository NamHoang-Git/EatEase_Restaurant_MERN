import UserModel from "../models/user.model.js";
import AddressModel from "./../models/address.model.js";

export const addAddressController = async (request, response) => {
    try {
        const userId = request.userId;
        const { address_line, city, district, ward, country, mobile, isDefault } = request.body;

        if (isDefault) {
            await AddressModel.updateMany(
                { userId: userId, isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        const createAddress = new AddressModel({
            address_line,
            city,
            district,
            ward,
            country,
            mobile,
            userId: userId,
            isDefault: !!isDefault
        });
        const saveAddress = await createAddress.save();

        const addUserAddressId = await UserModel.findByIdAndUpdate(userId, {
            $push: {
                address_details: saveAddress._id
            }
        });

        return response.json({
            message: "Address Created Successfully",
            error: false,
            success: true,
            data: saveAddress
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const getAddressController = async (request, response) => {
    try {
        const userId = request.userId;

        const data = await AddressModel.find({ userId: userId }).sort({ createdAt: -1 });

        return response.json({
            data: data,
            message: "List of address",
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const updateAddressController = async (request, response) => {
    try {
        const userId = request.userId;
        const { _id, address_line, city, district, ward, country, mobile, isDefault } = request.body;

        if (isDefault) {
            await AddressModel.updateMany(
                { userId: userId, isDefault: true, _id: { $ne: _id } },
                { $set: { isDefault: false } }
            );
        }

        const updateAddress = await AddressModel.updateOne(
            { _id: _id, userId: userId },
            {
                address_line,
                city,
                district,
                ward,
                country,
                mobile,
                isDefault: !!isDefault
            }
        );

        return response.json({
            message: "Address Updated",
            error: false,
            success: true,
            data: updateAddress
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const deleteAddresscontroller = async (request, response) => {
    try {
        const userId = request.userId;
        const { _id } = request.body;

        const disableAddress = await AddressModel.updateOne(
            { _id: _id, userId },
            { status: false }
        );

        if (disableAddress.nModified === 0) {
            return response.status(404).json({
                message: "Address not found or not authorized",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Address removed successfully",
            error: false,
            success: true,
            data: disableAddress
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const restoreAddressController = async (request, response) => {
    try {
        const userId = request.userId;
        const { _id } = request.body;

        const restoreAddress = await AddressModel.updateOne(
            { _id: _id, userId },
            { status: true }
        );

        if (restoreAddress.nModified === 0) {
            return response.status(404).json({
                message: "Address not found or already active",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Address restored successfully",
            error: false,
            success: true,
            data: restoreAddress
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};