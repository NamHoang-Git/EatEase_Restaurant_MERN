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
        isFreeShipping: false,
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
        } else if (formData.discountType === 'fixed') {
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
        <section className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="border-b border-gray-200 py-3 mb-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-secondary-200">
                                Thêm voucher
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-secondary-200 hover:text-secondary-100 transition-colors"
                            >
                                <IoClose size={22} />
                            </button>
                        </div>
                    </div>
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4 font-semibold text-sm"
                    >
                        <div className="col-span-2">
                            <label className="block font-medium text-gray-700 mb-1">
                                Mã voucher{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleOnChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-200 text-secondary-200
                                    font-semibold"
                                required
                                spellCheck={false}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block font-medium text-gray-700 mb-1">
                                Tên voucher{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleOnChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-200 text-secondary-200
                                    font-semibold"
                                required
                                spellCheck={false}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block font-medium text-gray-700 mb-1">
                                Mô tả
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleOnChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-200 text-secondary-200
                                    font-semibold"
                                spellCheck={false}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">
                                    Trạng thái
                                </label>
                                <label className="relative inline-flex items-center gap-2 cursor-pointer">
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
                                    <span
                                        className={`px-2 mt-[1.5px] inline-flex leading-5 font-semibold rounded-full ${
                                            formData.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {formData.isActive
                                            ? 'Đang hoạt động'
                                            : 'Đã tắt'}
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1">
                                    Loại giảm giá{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="discountType"
                                    value={formData.discountType}
                                    onChange={handleOnChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-200 text-secondary-200
                                    font-semibold"
                                    required
                                >
                                    <option value="percentage">
                                        Phần trăm (%)
                                    </option>
                                    <option value="fixed">
                                        Số tiền cố định (VND)
                                    </option>
                                    <option value="free_shipping">
                                        Miễn phí vận chuyển
                                    </option>
                                </select>
                            </div>

                            {formData.discountType !== 'free_shipping' && (
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">
                                        {formData.discountType === 'percentage'
                                            ? 'Phần trăm giảm giá'
                                            : 'Số tiền giảm giá'}{' '}
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
                                            className="no-spinner w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-200 text-secondary-200
                                            font-semibold"
                                            required
                                            placeholder={
                                                formData.discountType ===
                                                'percentage'
                                                    ? '0-100%'
                                                    : 'Enter amount'
                                            }
                                        />
                                        <span className="absolute right-3 top-2 text-gray-500">
                                            {formData.discountType ===
                                            'percentage'
                                                ? '%'
                                                : '₫'}
                                        </span>
                                    </div>
                                    {formData.discountType === 'percentage' && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Nhập giá trị từ 0,01% đến 100%
                                        </p>
                                    )}
                                    {formData.discountType === 'fixed' && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Nhập giá trị lớn hơn 0
                                        </p>
                                    )}
                                </div>
                            )}

                            {formData.discountType === 'percentage' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Giảm giá tối đa (VND)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="maxDiscount"
                                            value={formData.maxDiscount || ''}
                                            onChange={handleOnChange}
                                            placeholder="VND "
                                            min="0"
                                            step="1"
                                            className="no-spinner w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-200 text-secondary-200
                                            font-semibold"
                                        />
                                        <span className="absolute right-3 top-2 text-gray-500">
                                            ₫
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Giá trị đơn hàng tối thiểu
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="minOrderValue"
                                        value={formData.minOrderValue}
                                        onChange={handleOnChange}
                                        min="0"
                                        step="0.01"
                                        placeholder="VND"
                                        className="no-spinner w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-200 text-secondary-200
                                        font-semibold"
                                    />
                                    <span className="absolute right-3 top-2 text-gray-500">
                                        ₫
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Giá trị đơn hàng tối thiểu để áp dụng mã
                                    giảm giá (0 cho không có giá trị tối thiểu)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số lượng sử dụng
                                </label>
                                <input
                                    type="number"
                                    name="usageLimit"
                                    value={formData.usageLimit || ''}
                                    onChange={handleOnChange}
                                    min="1"
                                    step="1"
                                    placeholder="Không giới hạn nếu để trống"
                                    className="no-spinner w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-200 text-secondary-200
                                    font-semibold"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Số lần mã giảm giá có thể được sử dụng (0
                                    cho không giới hạn)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ngày bắt đầu{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleOnChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-200 text-secondary-200
                                        font-semibold"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ngày kết thúc{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleOnChange}
                                        min={formData.startDate}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-secondary-200 text-secondary-200
                                        font-semibold"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="applyForAllProducts"
                                name="applyForAllProducts"
                                checked={formData.applyForAllProducts}
                                onChange={handleOnChange}
                                className="h-4 w-4 focus:ring-secondary-200 text-secondary-200
                                    font-semibold border-gray-300 rounded mb-[3px]"
                            />
                            <label
                                htmlFor="applyForAllProducts"
                                className="ml-2 block text-sm text-gray-700"
                            >
                                Áp dụng cho tất cả sản phẩm
                            </label>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t mt-6 font-semibold sm:text-sm text-xs">
                            <button
                                type="button"
                                onClick={() => onClose()}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border-[2px] border-secondary-200 rounded-md shadow-sm text-secondary-200 bg-primary-100 hover:opacity-80
                            focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-secondary-200"
                            >
                                {loading ? <Loading /> : 'Tạo voucher'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default AddVoucher;
