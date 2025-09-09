import React, { useState } from 'react';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import successAlert from '../utils/successAlert';
import AxiosToastError from '../utils/AxiosToastError';
import Loading from './Loading';
import { IoAdd, IoPencil, IoTrash, IoCalendar, IoClose } from 'react-icons/io5';

const AddVoucher = ({ onClose, fetchVoucher }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderValue: 0,
        maxDiscount: null,
        startDate: '',
        endDate: '',
        usageLimit: null,
        isActive: true,
        applyForAllProducts: true,
        products: [],
        categories: [],
    });

    const [loading, setLoading] = useState(false);

    const handleOnChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => {
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
            !formData.code ||
            !formData.name ||
            !formData.startDate ||
            !formData.endDate
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
        if (formData.discountType === 'percentage') {
            if (
                !formData.discountValue ||
                formData.discountValue <= 0 ||
                formData.discountValue > 100
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
            if (!formData.maxDiscount || formData.maxDiscount <= 0) {
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
            if (!formData.discountValue || formData.discountValue <= 0) {
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
            ...formData,
            // Convert string numbers to proper numbers
            discountValue: Number(formData.discountValue),
            minOrderValue: Number(formData.minOrderValue) || 0,
            // Only include maxDiscount for percentage type
            maxDiscount:
                formData.discountType === 'percentage'
                    ? Number(formData.maxDiscount) || null
                    : null,
            // Convert usageLimit to number or null
            usageLimit: formData.usageLimit
                ? Number(formData.usageLimit)
                : null,
        };

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.add_voucher,
                data: submissionData,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                successAlert(responseData.message);
                onClose();
                fetchVoucher();
            }
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
                                    value={formData.code}
                                    onChange={handleOnChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
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
                                    value={formData.name}
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
                                    value={formData.description}
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
                                        checked={formData.isActive}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                isActive: e.target.checked,
                                            }))
                                        }
                                    />
                                    <div
                                        className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                            formData.isActive
                                                ? 'bg-green-300'
                                                : 'bg-gray-300'
                                        }`}
                                    ></div>
                                    <span className="ml-2 text-sm font-medium text-gray-900">
                                        {formData.isActive
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
                                    value={formData.discountType}
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
                                    {formData.discountType === 'percentage'
                                        ? 'Discount Percentage'
                                        : 'Fixed Amount'}{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="discountValue"
                                        value={formData.discountValue}
                                        onChange={handleOnChange}
                                        min={
                                            formData.discountType ===
                                            'percentage'
                                                ? '0.01'
                                                : '1'
                                        }
                                        max={
                                            formData.discountType ===
                                            'percentage'
                                                ? '100'
                                                : ''
                                        }
                                        step={
                                            formData.discountType ===
                                            'percentage'
                                                ? '0.01'
                                                : '1'
                                        }
                                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        placeholder={
                                            formData.discountType ===
                                            'percentage'
                                                ? '0-100%'
                                                : 'Enter amount'
                                        }
                                    />
                                    <span className="absolute right-3 top-2 text-gray-500">
                                        {formData.discountType === 'percentage'
                                            ? '%'
                                            : '$'}
                                    </span>
                                </div>
                                {formData.discountType === 'percentage' && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Enter a value between 0.01% and 100%
                                    </p>
                                )}
                            </div>

                            {formData.discountType === 'percentage' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Maximum Discount ($)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="maxDiscount"
                                            value={formData.maxDiscount || ''}
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
                                        value={formData.minOrderValue}
                                        onChange={handleOnChange}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="absolute right-3 top-2 text-gray-500">
                                        $
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Minimum order amount to apply this voucher
                                    (0 for no minimum)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Usage Limit
                                </label>
                                <input
                                    type="number"
                                    name="usageLimit"
                                    value={formData.usageLimit || ''}
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
                                        value={formData.startDate}
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
                                        value={formData.endDate}
                                        onChange={handleOnChange}
                                        min={formData.startDate}
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
                                    checked={formData.applyForAllProducts}
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
                                onClick={() => onClose()}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {loading ? <Loading /> : 'Create Voucher'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default AddVoucher;
