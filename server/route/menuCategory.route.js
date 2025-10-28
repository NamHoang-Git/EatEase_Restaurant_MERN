import { Router } from "express";
import auth from "../middleware/auth.js";
import {
    addCategoryController, deleteCategoryController, getMenuCategoryController,
    updateCategoryController
} from "../controllers/menuCategory.controller.js";

const menuCategoryRouter = Router()

menuCategoryRouter.post('/add-category', auth, addCategoryController)
menuCategoryRouter.get('/get-menu-category', getMenuCategoryController)
menuCategoryRouter.put('/update-category', auth, updateCategoryController)
menuCategoryRouter.delete('/delete-category', auth, deleteCategoryController)

export default menuCategoryRouter