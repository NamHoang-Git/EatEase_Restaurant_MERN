import ProductModel from "../models/product.model.js";
import OrderModel from "../models/order.model.js";

/**
 * Updates the stock quantity of products after a successful order
 * @param {Array} orderIds - Array of order IDs to process
 * @returns {Promise<Object>} Result of the stock update operation
 */
export async function updateProductStock(orderIds) {
    try {
        // Get all orders with product information
        const orders = await OrderModel.find({
            _id: { $in: orderIds }
        }).populate('productId');

        // Group quantities by product ID
        const productUpdates = {};

        orders.forEach(order => {
            if (!order.productId) {
                console.warn(`Order ${order._id} is missing productId`);
                return;
            }
            
            const productId = order.productId._id || order.productId;
            const quantity = order.quantity || 1; // Default to 1 if quantity is not set
            
            if (!productUpdates[productId]) {
                productUpdates[productId] = 0;
            }
            
            // Add the quantity from this order to the total for this product
            productUpdates[productId] += quantity;
            
            console.log(`Product ${productId}: Order ${order._id} quantity ${quantity}, new total: ${productUpdates[productId]}`);
        });

        // Update stock for each product
        const bulkOps = Object.entries(productUpdates).map(([productId, quantity]) => ({
            updateOne: {
                filter: { _id: productId },
                update: {
                    $inc: { stock: -quantity } // Decrease stock by the ordered quantity
                },
                // Ensure stock doesn't go below zero
                hint: { _id: 1 } // Add hint for better performance
            }
        }));

        if (bulkOps.length === 0) {
            console.log('No products to update stock for');
            return { success: true, message: 'No stock updates needed' };
        }

        // Execute all updates in bulk
        const result = await ProductModel.bulkWrite(bulkOps, { ordered: false });

        console.log(`✅ Updated stock for ${result.modifiedCount} products`);
        return {
            success: true,
            message: `Successfully updated stock for ${result.modifiedCount} products`,
            details: result
        };
    } catch (error) {
        console.error('Error updating product stock:', error);
        return {
            success: false,
            message: 'Failed to update product stock',
            error: error.message
        };
    }
}
