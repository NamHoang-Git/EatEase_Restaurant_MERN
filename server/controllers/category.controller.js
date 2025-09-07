import ProductModel from '../models/product.model.js';
import CategoryModel from './../models/category.model.js';

export const addCategoryController = async (req, res) => {
    try {
        const { name, image } = req.body

        if (!name || !image) {
            return res.status(400).json({
                message: "Vui lòng điền đầy đủ các trường bắt buộc.",
                error: true,
                success: false
            })
        }

        // Check if category with the same name already exists (case insensitive)
        const existingCategory = await CategoryModel.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingCategory) {
            return res.status(400).json({
                message: `Danh mục "${name}" đã tồn tại. Vui lòng chọn tên khác.`,
                error: true,
                success: false
            });
        }

        const addCategory = new CategoryModel({
            name,
            image
        })

        const saveCategory = await addCategory.save()

        if (!saveCategory) {
            return res.status(500).json({
                message: "Không tạo được danh mục",
                error: true,
                success: false
            })
        }

        return res.json({
            message: "Thêm danh mục thành công",
            data: saveCategory,
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

export const getCategoryController = async (req, res) => {
    try {
        const data = await CategoryModel.find().sort({ createdAt: -1 })

        return res.json({
            message: 'Danh mục Data',
            data: data,
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

export const updateCategoryController = async (req, res) => {
    try {
        const { _id, name, image } = req.body

        const check = await CategoryModel.findById(_id)

        if (!check) {
            return res.status(400).json({
                message: 'Không tìm thấy _id',
                error: true,
                success: false
            })
        }

        const update = await CategoryModel.findByIdAndUpdate(
            _id,
            { name, image },
            { new: true }
        )

        return res.json({
            message: 'Cập nhật danh mục thành công',
            error: false,
            success: true,
            data: update
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const deleteCategoryController = async (req, res) => {
    try {
        const { _id } = req.body

        const checkProduct = await ProductModel.find({
            category: {
                '$in': [_id]
            }
        }).countDocuments()

        if (checkProduct > 0) {
            return res.status(400).json({
                message: "Danh mục đã được sử dụng, không thể xóa",
                error: true,
                success: false
            })
        }

        const deleteCategory = await CategoryModel.findByIdAndDelete(_id)

        return res.json({
            message: 'Xóa danh mục thành công',
            data: deleteCategory,
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