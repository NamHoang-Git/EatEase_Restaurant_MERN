import UserModel from "../models/user.model.js";
import CartProductModel from './../models/cartProduct.model.js';

export const addToCartItemController = async (request, response) => {
    try {
        const userId = request.userId
        const { productId } = request.body

        if (!productId) {
            return response.status(402).json({
                message: "Vui lòng cung cấp productId",
                error: true,
                success: false
            })
        }

        const checkItemCart = await CartProductModel.findOne({
            userId: userId,
            productId: productId
        })

        if (checkItemCart) {
            return response.status(400).json({
                message: "Sản phẩm đã tồn tại trong giỏ hàng",
                error: true,
                success: false
            })
        }

        const cartItem = new CartProductModel({
            quantity: 1,
            userId: userId,
            productId: productId
        })
        const save = await cartItem.save()

        const updateCartUser = await UserModel.updateOne({ _id: userId }, {
            $push: {
                shopping_cart: save._id
            }
        })

        return response.json({
            data: save,
            message: "Sản phẩm đã được thêm vào giỏ hàng",
            error: false,
            success: true
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const getCartItemController = async (request, response) => {
    try {
        const userId = request.userId

        const cartItem = await CartProductModel.find({
            userId: userId
        }).populate('productId')

        return response.json({
            data: cartItem,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const updateCartItemQtyController = async (request, response) => {
    try {
        const userId = request.userId
        const { _id, qty } = request.body

        if (!_id || !qty) {
            return response.status(400).json({
                message: "Vui lòng cung cấp _id, qty",
                error: true,
                success: false
            })
        }

        const updateCartitem = await CartProductModel.updateOne({
            _id: _id,
            userId: userId
        }, {
            quantity: qty
        })

        return response.json({
            message: "Cập nhật giỏ hàng",
            success: true,
            error: false,
            data: updateCartitem
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const deleteCartItemQtyController = async (request, response) => {
    try {
        const userId = request.userId // middleware
        const { _id } = request.body

        if (!_id) {
            return response.status(400).json({
                message: "Vui lòng cung cấp _id",
                error: true,
                success: false
            })
        }

        const deleteCartItem = await CartProductModel.deleteOne({ _id: _id, userId: userId })

        // Cũng cần xóa reference từ User.shopping_cart
        await UserModel.updateOne(
            { _id: userId },
            { $pull: { shopping_cart: _id } }
        )

        return response.json({
            message: "Sản phẩm đã được xóa",
            error: false,
            success: true,
            data: deleteCartItem
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

// API để clear cart sau thanh toán (toàn bộ hoặc các sản phẩm được chọn)
export const clearCartController = async (request, response) => {
    try {
        const userId = request.userId
        const { selectedProductIds } = request.body // Danh sách productId được chọn (optional)

        let deleteResult, userUpdateResult;

        console.log('clearCartController received:', { userId, selectedProductIds });

        if (selectedProductIds && selectedProductIds.length > 0) {
            // Xóa chỉ các sản phẩm được chọn
            console.log('Clearing selected products:', selectedProductIds);

            // Tìm cart items cần xóa
            const cartItemsToDelete = await CartProductModel.find({
                userId: userId,
                productId: { $in: selectedProductIds }
            });
            const cartItemIds = cartItemsToDelete.map(item => item._id);

            // Xóa cart items được chọn
            deleteResult = await CartProductModel.deleteMany({
                userId: userId,
                productId: { $in: selectedProductIds }
            });

            // Xóa references từ User.shopping_cart
            userUpdateResult = await UserModel.updateOne(
                { _id: userId },
                { $pull: { shopping_cart: { $in: cartItemIds } } }
            );

            console.log('Selected cart clear:', { deleteResult, userUpdateResult, selectedProductIds });
        } else {
            // Xóa tất cả cart items của user (logic cũ)
            deleteResult = await CartProductModel.deleteMany({ userId: userId });

            userUpdateResult = await UserModel.updateOne(
                { _id: userId },
                { $set: { shopping_cart: [] } }
            );

            console.log('Full cart clear:', { deleteResult, userUpdateResult });
        }

        return response.json({
            message: selectedProductIds && selectedProductIds.length > 0
                ? "Đã xóa các sản phẩm được chọn"
                : "Giỏ hàng đã được xóa",
            error: false,
            success: true,
            data: { deletedCount: deleteResult.deletedCount }
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}