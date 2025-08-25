import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
    addAddressController,
    getAddressController,
    updateAddressController,
    deleteAddresscontroller,
    restoreAddressController,
} from '../controllers/address.controller.js'

const addressRouter = Router()

addressRouter.post('/add-address', auth, addAddressController)
addressRouter.get('/get-address', auth, getAddressController)
addressRouter.put('/update-address', auth, updateAddressController)
addressRouter.delete('/delete-address', auth, deleteAddresscontroller)
addressRouter.post('/restore-address', auth, restoreAddressController)

export default addressRouter