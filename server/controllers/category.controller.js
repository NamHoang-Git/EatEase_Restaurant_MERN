import ProductModel from '../models/product.model.js';
import CategoryModel from './../models/category.model.js';

export const addCategoryController = async (req, res) => {
    try {
        const { name, image } = req.body

        if (!name || !image) {
            return res.status(400).json({
                message: "Enter required fields",
                error: true,
                success: false
            })
        }

        const addCategory = new CategoryModel({
            name,
            image
        })

        const saveCategory = await addCategory.save()

        if (!saveCategory) {
            return res.status(500).json({
                message: "Not created",
                error: true,
                success: false
            })
        }

        return res.json({
            message: "Add category successfully",
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
            message: 'Category Data',
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
                message: 'Check your _id',
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
            message: 'Update Category Successfully',
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
                message: "Category is already use can't delete",
                error: true,
                success: false
            })
        }

        const deleteCategory = await CategoryModel.findByIdAndDelete(_id)

        return res.json({
            message: 'Delete category successfully',
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