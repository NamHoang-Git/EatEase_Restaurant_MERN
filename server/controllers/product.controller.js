import ProductModel from "../models/product.model.js"
import CartProductModel from './../models/cartProduct.model.js';
import mongoose from "mongoose";

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
        let { page, limit, search } = req.body

        if (!page) {
            page = 2
        }

        if (!limit) {
            limit = 10
        }

        const query = search ? {
            $text: {
                $search: search
            }
        } : {}

        const skip = (page - 1) * limit

        const [data, totalCount] = await Promise.all([
            ProductModel.find(query)
                .populate('category')
                .sort({ createdAt: -1 })
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
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
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
            .populate('category')   // chỉ lấy category thôi
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
        let sortOptions = { createdAt: -1 }; // Default sort
        if (sort) {
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
            }
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
        console.error('Lỗi khi lấy danh sách sản phẩm:', error);
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
            await CartProductModel.deleteMany({ productId: _id }).session(session);

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
        let { search, page, limit } = request.body

        if (!page) {
            page = 1
        }
        if (!limit) {
            limit = 15
        }

        const query = search ? {
            $text: {
                $search: search
            }
        } : {}

        const skip = (page - 1) * limit

        const [data, dataCount] = await Promise.all([
            ProductModel.find(query).sort({ createdAt: -1 }).skip(skip)
                .limit(limit).populate('category'),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message: "Danh sách sản phẩm",
            error: false,
            success: true,
            data: data,
            totalCount: dataCount,
            totalPage: Math.ceil(dataCount / limit),
            page: page,
            limit: limit
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}