import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/user.model.js';
import CartProductModel from '../models/cartProduct.model.js';
import OrderModel from '../models/order.model.js';

dotenv.config();

const testCartCleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // Lấy user hiện tại
        const user = await UserModel.findOne({ shopping_cart: { $exists: true, $ne: [] } });
        if (!user) {
            console.log('No user with cart items found');
            return;
        }

        console.log(`\n=== TESTING CART CLEANUP FOR USER: ${user.name} ===`);
        console.log('User ID:', user._id);

        // Lấy cart items hiện tại
        const cartItems = await CartProductModel.find({ userId: user._id });
        console.log('Current cart items:', cartItems.length);
        cartItems.forEach(item => {
            console.log(`- Cart ID: ${item._id}, Product ID: ${item.productId}, Quantity: ${item.quantity}`);
        });

        if (cartItems.length === 0) {
            console.log('No cart items to clean up');
            return;
        }

        // Simulate webhook cart cleanup logic
        console.log('\n=== SIMULATING WEBHOOK CART CLEANUP ===');

        // Lấy productIds từ cart items (giống như từ Stripe line items)
        const productIdsToRemove = cartItems.map(item => item.productId.toString());
        console.log('Product IDs to remove:', productIdsToRemove);

        // Tìm các CartProduct cần xóa
        const cartItemsToDelete = await CartProductModel.find({
            userId: new mongoose.Types.ObjectId(user._id),
            productId: { $in: productIdsToRemove.map(id => new mongoose.Types.ObjectId(id)) }
        });
        console.log('Cart items found to delete:', cartItemsToDelete.length);

        if (cartItemsToDelete.length > 0) {
            const cartItemIds = cartItemsToDelete.map(item => item._id);
            console.log('Cart item IDs to delete:', cartItemIds);

            // Xóa các CartProduct documents
            const cartDeleteResult = await CartProductModel.deleteMany({
                _id: { $in: cartItemIds }
            });
            console.log('✅ Cart delete result:', cartDeleteResult);

            // Xóa references từ User.shopping_cart
            const userUpdateResult = await UserModel.updateOne(
                { _id: new mongoose.Types.ObjectId(user._id) },
                { $pull: { shopping_cart: { $in: cartItemIds } } }
            );
            console.log('✅ User update result:', userUpdateResult);

            // Kiểm tra kết quả
            const remainingCartItems = await CartProductModel.find({ userId: user._id });
            const updatedUser = await UserModel.findById(user._id);

            console.log('\n=== CLEANUP RESULTS ===');
            console.log('Remaining cart items:', remainingCartItems.length);
            console.log('User shopping_cart length:', updatedUser.shopping_cart.length);

            if (remainingCartItems.length === 0 && updatedUser.shopping_cart.length === 0) {
                console.log('🎉 SUCCESS: Cart cleanup completed successfully!');
            } else {
                console.log('❌ ISSUE: Cart cleanup incomplete');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
};

testCartCleanup();
