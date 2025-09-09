import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
    addVoucerController, deleteVoucherController,
    getAllVoucherController, updateVoucherController
} from '../controllers/voucher.controller.js';

const voucherRouter = Router()

voucherRouter.post('/add-voucher', auth, addVoucerController)
voucherRouter.get('/get-all-voucher', getAllVoucherController)
voucherRouter.put('/update-voucher', auth, updateVoucherController)
voucherRouter.delete('/delete-voucher', auth, deleteVoucherController)

export default voucherRouter
