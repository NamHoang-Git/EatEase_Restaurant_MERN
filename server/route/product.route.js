import { Router } from "express";
import auth from './../middleware/auth.js';
import { admin } from '../middleware/Admin.js'
import {
    addProductController,
    deleteProductDetails,
    getProductByCategoryHome,
    getProductByCategoryList,
    getProductController,
    getProductDetails,
    searchProduct,
    updateProductDetails
} from "../controllers/product.controller.js";

const productRouter = Router()

productRouter.post('/add-product', auth, admin, addProductController)
productRouter.post('/get-product', getProductController)
productRouter.post('/get-product-by-category-home', getProductByCategoryHome)
productRouter.post('/get-product-by-category-list', getProductByCategoryList)
productRouter.post('/get-product-details', getProductDetails)

//update product
productRouter.put('/update-product-details', auth, admin, updateProductDetails)

//delete product
productRouter.delete('/delete-product', auth, admin, deleteProductDetails)

//search product
productRouter.post('/search-product', searchProduct)

export default productRouter