import React, { useState } from 'react';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import successAlert from '../utils/successAlert';
import AxiosToastError from '../utils/AxiosToastError';
import Loading from './Loading';
import { IoAdd, IoPencil, IoTrash, IoCalendar, IoClose } from 'react-icons/io5';

// Function to format date to YYYY-MM-DDThh:mm format for datetime-local input
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const pad = (num) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const EditVoucher = ({ voucher: voucherData, onClose, onSuccess }) => {
    const [editFormData, setEditFormData] = useState({
        _id: voucherData?._id || '',
        code: voucherData?.code || '',
        name: voucherData?.name || '',
        description: voucherData?.description || '',
        discountType: voucherData?.discountType || 'percentage',
        discountValue: voucherData?.discountValue || 0,
        minOrderValue: voucherData?.minOrderValue || 0,
        maxDiscount: voucherData?.maxDiscount || null,
        startDate: formatDateForInput(voucherData?.startDate) || '',
        endDate: formatDateForInput(voucherData?.endDate) || '',
        usageLimit: voucherData?.usageLimit || null,
        isActive: voucherData?.isActive ?? true,
        applyForAllProducts: voucherData?.applyForAllProducts ?? true,
        products: voucherData?.products ? [...voucherData.products] : [],
        categories: voucherData?.categories ? [...voucherData.categories] : [],
    });

    const [loading, setLoading] = useState(false);

    const handleOnChange = (e) => {
        const { name, value } = e.target;

        setEditFormData((prev) => {
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Common required fields validation
        if (
            !editFormData.code ||
            !editFormData.name ||
            !editFormData.startDate ||
            !editFormData.endDate
        ) {
            AxiosToastError({
                response: {
                    data: {
                        message: 'Vui lòng điền đầy đủ các trường bắt buộc',
                    },
                },
            });
            return;
        }

        // Validate based on discount type
        if (editFormData.discountType === 'percentage') {
            if (
                !editFormData.discountValue ||
                editFormData.discountValue <= 0 ||
                editFormData.discountValue > 100
            ) {
                AxiosToastError({
                    response: {
                        data: {
                            message: 'Phần trăm giảm giá phải từ 0.01 đến 100%',
                        },
                    },
                });
                return;
            }
            if (!editFormData.maxDiscount || editFormData.maxDiscount <= 0) {
                AxiosToastError({
                    response: {
                        data: {
                            message: 'Vui lòng nhập số tiền giảm giá tối đa',
                        },
                    },
                });
                return;
            }
        } else {
            // fixed amount
            if (
                !editFormData.discountValue ||
                editFormData.discountValue <= 0
            ) {
                AxiosToastError({
                    response: {
                        data: { message: 'Số tiền giảm giá phải lớn hơn 0' },
                    },
                });
                return;
            }
        }

        // Prepare data for submission
        const submissionData = {
            ...editFormData,
            // Convert string numbers to proper numbers
            discountValue: Number(editFormData.discountValue),
            minOrderValue: Number(editFormData.minOrderValue) || 0,
            // Only include maxDiscount for percentage type
            maxDiscount:
                editFormData.discountType === 'percentage'
                    ? Number(editFormData.maxDiscount) || null
                    : null,
            // Convert usageLimit to number or null
            usageLimit: editFormData.usageLimit
                ? Number(editFormData.usageLimit)
                : null,
        };

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.update_voucher,
                data: submissionData,
            });

            successAlert(response.data.message || 'Cập nhật mã giảm giá thành công');
            onSuccess();
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                <div className="p-6">
                    {/* <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">
                            {currentVoucher
                                ? 'Edit Voucher'
                                : 'Add New Voucher'}
                        </h3>
                        <button
                            onClick={() => setOpenAddEditModal(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <IoClose size={24} />
                        </button>
                    </div> */}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Voucher Code{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    value={editFormData.code}
                                    onChange={handleOnChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    // disabled={!!currentVoucher}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Voucher Name{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleOnChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={editFormData.description}
                                    onChange={handleOnChange}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        name="isActive"
                                        checked={editFormData.isActive}
                                        onChange={(e) =>
                                            setEditFormData((prev) => ({
                                                ...prev,
                                                isActive: e.target.checked,
                                            }))
                                        }
                                    />
                                    <div
                                        className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                            editFormData.isActive
                                                ? 'bg-green-300'
                                                : 'bg-gray-300'
                                        }`}
                                    ></div>
                                    <span className="ml-2 text-sm font-medium text-gray-900">
                                        {editFormData.isActive
                                            ? 'Active'
                                            : 'Inactive'}
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount Type{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="discountType"
                                    value={editFormData.discountType}
                                    onChange={handleOnChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="percentage">
                                        Percentage (%)
                                    </option>
                                    <option value="fixed">
                                        Fixed Amount ($)
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editFormData.discountType === 'percentage'
                                        ? 'Discount Percentage'
                                        : 'Fixed Amount'}{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="discountValue"
                                        value={editFormData.discountValue}
                                        onChange={handleOnChange}
                                        min="0"
                                        step={
                                            editFormData.discountType ===
                                            'percentage'
                                                ? '0.01'
                                                : '1'
                                        }
                                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <span className="absolute right-3 top-2 text-gray-500">
                                        {editFormData.discountType ===
                                        'percentage'
                                            ? '%'
                                            : '$'}
                                    </span>
                                </div>
                            </div>

                            {editFormData.discountType === 'percentage' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Maximum Discount ($)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="maxDiscount"
                                            value={
                                                editFormData.maxDiscount || ''
                                            }
                                            onChange={handleOnChange}
                                            min="0"
                                            step="1"
                                            className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="absolute right-3 top-2 text-gray-500">
                                            $
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Minimum Order Value
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="minOrderValue"
                                        value={editFormData.minOrderValue}
                                        onChange={handleOnChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="absolute right-3 top-2 text-gray-500">
                                        $
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Usage Limit
                                </label>
                                <input
                                    type="number"
                                    name="usageLimit"
                                    value={editFormData.usageLimit || ''}
                                    onChange={handleOnChange}
                                    min="1"
                                    step="1"
                                    placeholder="Unlimited if empty"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        name="startDate"
                                        value={editFormData.startDate}
                                        onChange={handleOnChange}
                                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <IoCalendar className="absolute right-3 top-2.5 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={editFormData.endDate}
                                        onChange={handleOnChange}
                                        min={editFormData.startDate}
                                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <IoCalendar className="absolute right-3 top-2.5 text-gray-400" />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="applyForAllProducts"
                                    name="applyForAllProducts"
                                    checked={editFormData.applyForAllProducts}
                                    onChange={handleOnChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="applyForAllProducts"
                                    className="ml-2 block text-sm text-gray-700"
                                >
                                    Apply to all products
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {loading ? <Loading /> : 'Update Voucher'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default EditVoucher;
