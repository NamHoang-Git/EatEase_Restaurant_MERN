import ProductModel from "../models/product.model.js"
import mongoose from "mongoose";
import CartModel from './../models/cart.model.js';

export const addProductController = async (req, res) => {
    try {
        const { name, image, category, unit, stock,
            price, discount, description, more_details } = req.body

        if (!name || !image[0] || !category[0] || !unit || !stock || !price) {
            return res.status(400).json({
                message: "Vui lòng nhập các trường bắt buộc",
                error: true,
                success: false
            })
        }

        const addProduct = new ProductModel({
            name,
            image,
            category,
            unit,
            stock,
            price,
            discount,
            description,
            more_details
        })

        const saveProduct = await addProduct.save()

        if (!saveProduct) {
            return res.status(500).json({
                message: "Không tạo được",
                error: true,
                success: false
            })
        }

        return res.json({
            message: "Thêm sản phẩm thành công",
            data: saveProduct,
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const getProductController = async (req, res) => {
    try {
        let { page, limit, search, minPrice, maxPrice, sort, category } = req.body;

        if (!page) page = 1;
        if (!limit) limit = 10;

        // Build query object
        const query = {};

        // Add search query if provided
        if (search) {
            query.$text = { $search: search };
        }

        // Add price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Add category filter
        if (category && category !== 'all') {
            query.category = new mongoose.Types.ObjectId(category);
        }

        // Build sort object
        let sortOptions = {};

        // Apply sorting based on the sort parameter
        switch (sort) {
            case 'price_asc':
                sortOptions = { price: 1 };
                break;
            case 'price_desc':
                sortOptions = { price: -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            default: // 'newest' or any other value
                sortOptions = { createdAt: -1 };
        }

        const skip = (page - 1) * limit;

        const [data, totalCount] = await Promise.all([
            ProductModel.find(query)
                .populate('category')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            ProductModel.countDocuments(query)
        ]);

        return res.json({
            message: 'Danh sách sản phẩm',
            data: data,
            totalCount: totalCount,
            totalNoPage: Math.ceil(totalCount / limit),
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || 'Lỗi server',
            error: true,
            success: false
        });
    }
}

export const getProductByCategoryHome = async (request, response) => {
    try {
        let { id } = request.body;

        // Nếu id không tồn tại hoặc rỗng → trả về mảng trống
        if (!id || (Array.isArray(id) && id.length === 0)) {
            return response.json({
                message: "Danh sách sản phẩm",
                data: [],
                error: false,
                success: true
            });
        }

        // Đảm bảo id luôn là mảng
        if (!Array.isArray(id)) {
            id = [id];
        }

        const product = await ProductModel.find({
            category: { $in: id }
        })
            .populate('category')
            .limit(15);

        return response.json({
            message: "Danh sách sản phẩm",
            data: product,
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

export const getProductByCategoryList = async (request, response) => {
    try {
        let { categoryId, page, limit, sort, minPrice, maxPrice } = request.body;

        if (!categoryId) {
            return response.status(400).json({
                message: "Vui lòng chọn danh mục sản phẩm",
                error: true,
                success: false
            });
        }

        // Set default values
        page = page || 1;
        limit = limit || 10;

        // Build query
        const query = {
            category: { $in: Array.isArray(categoryId) ? categoryId : [categoryId] }
        };

        // Add price range filter if provided
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) {
                query.price.$gte = Number(minPrice);
            }
            if (maxPrice !== undefined) {
                query.price.$lte = Number(maxPrice);
            }
        }

        // Build sort options
        let sortOptions = {};

        // Apply sorting based on the sort parameter
        switch (sort) {
            case 'price_asc':
                sortOptions = { price: 1 };
                break;
            case 'price_desc':
                sortOptions = { price: -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            default: // 'newest' or any other value
                sortOptions = { createdAt: -1 };
        }

        const skip = (page - 1) * limit;

        const [data, totalCount] = await Promise.all([
            ProductModel.find(query)
                .populate('category')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            ProductModel.countDocuments(query)
        ]);

        return response.json({
            message: "Danh sách sản phẩm",
            data: data,
            totalCount: totalCount,
            page: page,
            limit: limit,
            success: true,
            error: false
        });

    } catch (error) {
        return response.status(500).json({
            message: "Đã xảy ra lỗi khi tải danh sách sản phẩm",
            error: true,
            success: false
        });
    }
};

export const getProductDetails = async (request, response) => {
    try {
        const { productId } = request.body

        const product = await ProductModel.findOne({ _id: productId })
            .populate('category')

        return response.json({
            message: "Chi tiết sản phẩm",
            data: product,
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

// Update Product
export const updateProductDetails = async (request, response) => {
    try {
        const { _id } = request.body

        if (!_id) {
            return response.status(400).json({
                message: "Provide product _id",
                error: true,
                success: false
            })
        }

        const updateProduct = await ProductModel.updateOne({ _id: _id }, {
            ...request.body
        })

        return response.json({
            message: "Cập nhật sản phẩm thành công",
            data: updateProduct,
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

// Delete Product
export const deleteProductDetails = async (request, response) => {
    try {
        const { _id } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "Provide _id ",
                error: true,
                success: false
            });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Xóa sản phẩm
            const deleteProduct = await ProductModel.deleteOne({ _id: _id }).session(session);

            // Xóa các mục trong cartProduct liên quan
            await CartModel.deleteMany({ productId: _id }).session(session);

            await session.commitTransaction();
            session.endSession();

            return response.json({
                message: "Xóa sản phẩm thành công",
                error: false,
                success: true,
                data: deleteProduct
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Search Product
export const searchProduct = async (request, response) => {
    try {
        const { search, page = 1, limit = 12, minPrice, maxPrice, sort = 'newest', category } = request.body;
        const skip = (page - 1) * limit;

        if (!search || search.trim() === '') {
            return response.status(400).json({
                message: 'Vui lòng nhập từ khóa tìm kiếm',
                error: true,
                success: false,
            });
        }

        // Build the query
        const query = {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ],
        };

        // Add price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Add category filter
        if (category) {
            query.category = new mongoose.Types.ObjectId(category);
        }

        // Build sort options
        let sortOptions = {};
        switch (sort) {
            case 'price_asc':
                sortOptions = { price: 1 };
                break;
            case 'price_desc':
                sortOptions = { price: -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        const [products, total] = await Promise.all([
            ProductModel.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('category', 'name'),
            ProductModel.countDocuments(query),
        ]);

        const totalPage = Math.ceil(total / limit);

        return response.json({
            message: 'Kết quả tìm kiếm',
            data: products,
            totalCount: total,
            totalNoPage: totalPage,
            currentPage: page,
            success: true,
            error: false,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || 'Lỗi server',
            error: true,
            success: false,
        });
    }
};

// Get initial products for homepage
export const getInitialProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, minPrice, maxPrice, sort = 'newest', category } = req.body;
        const skip = (page - 1) * limit;

        // Build the query
        const query = { publish: true }; // Only get published products

        // Add category filter if provided
        if (category) {
            query['category'] = new mongoose.Types.ObjectId(category);
        }

        // Add price range filter if provided
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Build sort object based on sort parameter
        let sortOptions = {};

        // Apply sorting based on the sort parameter
        switch (sort) {
            case 'price_asc':
                sortOptions = { price: 1 };
                break;
            case 'price_desc':
                sortOptions = { price: -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            case 'newest':
            default:
                sortOptions = { createdAt: -1 };
                break;
        }

        const [products, total] = await Promise.all([
            ProductModel.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('category', 'name'),
            ProductModel.countDocuments(query),
        ]);

        const totalPage = Math.ceil(total / limit);

        return res.json({
            message: 'Lấy sản phẩm thành công',
            data: products,
            totalPage,
            totalCount: total,
            success: true,
            error: false,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || 'Lỗi server',
            error: true,
            success: false,
        });
    }
};