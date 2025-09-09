import React, { useEffect, useState, useCallback } from 'react';
import {
    IoArrowBack,
    IoArrowForward,
    IoSearch,
    IoAdd,
    IoPencil,
    IoTrash,
    IoCalendar,
    IoClose,
} from 'react-icons/io5';
import { debounce } from 'lodash';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import NoData from './../components/NoData';
import Loading from './../components/Loading';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const VoucherPage = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [openAddEditModal, setOpenAddEditModal] = useState(false);
    const [currentVoucher, setCurrentVoucher] = useState(null);
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

    // State for voucher application
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

    // Handle voucher application
    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) {
            toast.error('Please enter a voucher code');
            return;
        }

        setIsValidating(true);
        try {
            const result = await validateVoucher(voucherCode);
            if (result.success) {
                setAppliedVoucher(result.data);
                toast.success('Voucher applied successfully!');
            }
        } catch (error) {
            setAppliedVoucher(null);
            toast.error(
                error.response?.data?.message || 'Invalid or expired voucher'
            );
        } finally {
            setIsValidating(false);
        }
    };

    // Remove applied voucher
    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherCode('');
    };

    // Fetch vouchers
    const fetchVouchers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await Axios({
                ...SummaryApi.get_vouchers,
                params: { search },
                method: 'get',
            });
            if (response.data.success) {
                setVouchers(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
            toast.error('Failed to fetch vouchers');
        } finally {
            setLoading(false);
        }
    }, [search]);

    // Handle search with debounce
    const debouncedSearch = useCallback(
        debounce((value) => {
            setSearch(value);
        }, 500),
        []
    );

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;

            if (currentVoucher) {
                // Update existing voucher
                response = await Axios({
                    ...SummaryApi.update_voucher,
                    url: `${SummaryApi.update_voucher.url}/${currentVoucher._id}`,
                    data: formData,
                });
            } else {
                // Create new voucher
                response = await Axios({
                    ...SummaryApi.create_voucher,
                    data: formData,
                });
            }

            if (response.data.success) {
                toast.success(
                    `Voucher ${currentVoucher ? 'updated' : 'created'
                    } successfully`
                );
                setOpenAddEditModal(false);
                fetchVouchers();
                resetForm();
            }
        } catch (error) {
            console.error('Error saving voucher:', error);
            toast.error(
                error.response?.data?.message || 'Failed to save voucher'
            );
        }
    };

    // Handle delete voucher
    const handleDeleteVoucher = async (voucherId) => {
        if (window.confirm('Are you sure you want to delete this voucher?')) {
            try {
                const response = await Axios({
                    ...SummaryApi.delete_voucher,
                    url: `${SummaryApi.delete_voucher.url}/${voucherId}`,
                    method: 'delete',
                });

                if (response.data.success) {
                    toast.success('Voucher deleted successfully');
                    fetchVouchers();
                }
            } catch (error) {
                console.error('Error deleting voucher:', error);
                toast.error('Failed to delete voucher');
            }
        }
    };

    // Validate voucher
    const validateVoucher = async (code) => {
        try {
            const response = await Axios({
                ...SummaryApi.validate_voucher,
                url: `${SummaryApi.validate_voucher.url}/${code}`,
            });
            return response.data;
        } catch (error) {
            console.error('Error validating voucher:', error);
            throw error;
        }
    };

    // Apply voucher to order
    const applyVoucherToOrder = async (code, orderId) => {
        try {
            const response = await Axios({
                ...SummaryApi.apply_voucher,
                data: {
                    code,
                    orderId,
                    // Add any other necessary order details
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error applying voucher:', error);
            throw error;
        }
    };

    // Open edit modal
    const handleEditVoucher = (voucher) => {
        setCurrentVoucher(voucher);
        setFormData({
            code: voucher.code,
            name: voucher.name,
            description: voucher.description,
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            minOrderValue: voucher.minOrderValue,
            maxDiscount: voucher.maxDiscount,
            startDate: format(
                new Date(voucher.startDate),
                "yyyy-MM-dd'T'HH:mm"
            ),
            endDate: format(new Date(voucher.endDate), "yyyy-MM-dd'T'HH:mm"),
            usageLimit: voucher.usageLimit || '',
            isActive: voucher.isActive,
            applyForAllProducts: voucher.applyForAllProducts,
            products: voucher.products || [],
            categories: voucher.categories || [],
        });
        setOpenAddEditModal(true);
    };

    // Reset form
    const resetForm = () => {
        setCurrentVoucher(null);
        setFormData({
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
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text('Voucher List', 20, 10);
        autoTable(doc, {
            head: [['Code', 'Name', 'Discount', 'Start Date', 'End Date', 'Status']],
            body: vouchers.map((voucher) => {
                const isActive =
                    voucher.isActive &&
                    new Date(voucher.startDate) <= new Date() &&
                    new Date(voucher.endDate) >= new Date();
                return [
                    voucher.code,
                    voucher.name,
                    voucher.discountType === 'percentage'
                        ? `${voucher.discountValue}%`
                        : `$${voucher.discountValue}`,
                    format(new Date(voucher.startDate), 'MMM dd, yyyy'),
                    format(new Date(voucher.endDate), 'MMM dd, yyyy'),
                    isActive ? 'Active' : 'Inactive',
                ];
            }),
        });
        doc.save('vouchers.pdf');
    };

    // Fetch vouchers on component mount and when search changes
    useEffect(() => {
        fetchVouchers();
    }, [fetchVouchers]);

    return (
        <div className="bg-white p-4 rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Voucher Management</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                    >
                        Export PDF
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setOpenAddEditModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <IoAdd size={20} />
                        Add Voucher
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search vouchers..."
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => debouncedSearch(e.target.value)}
                    />
                    <IoSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
            </div>

            {/* Vouchers Table */}
            {loading ? (
                <Loading />
            ) : vouchers.length === 0 ? (
                <NoData text="No vouchers found" />
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Discount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Validity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {vouchers.map((voucher) => {
                                const isActive =
                                    voucher.isActive &&
                                    new Date(voucher.startDate) <= new Date() &&
                                    new Date(voucher.endDate) >= new Date();

                                return (
                                    <tr
                                        key={voucher._id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                                            <div className="flex items-center">
                                                {voucher.code}
                                                {!isActive && (
                                                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                                        {!voucher.isActive
                                                            ? 'Inactive'
                                                            : new Date(
                                                                voucher.startDate
                                                            ) > new Date()
                                                                ? 'Upcoming'
                                                                : 'Expired'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {voucher.name}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">
                                                {voucher.description}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {voucher.discountType ===
                                                    'percentage'
                                                    ? `${voucher.discountValue}%`
                                                    : `$${voucher.discountValue}`}
                                                {voucher.maxDiscount &&
                                                    voucher.discountType ===
                                                    'percentage' && (
                                                        <span className="text-xs text-gray-500 ml-1">
                                                            (max $
                                                            {
                                                                voucher.maxDiscount
                                                            }
                                                            )
                                                        </span>
                                                    )}
                                            </div>
                                            {voucher.minOrderValue > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    Min. order: $
                                                    {voucher.minOrderValue}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {format(
                                                    new Date(voucher.startDate),
                                                    'MMM dd, yyyy'
                                                )}
                                                {' - '}
                                                {format(
                                                    new Date(voucher.endDate),
                                                    'MMM dd, yyyy'
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {voucher.usageLimit
                                                    ? `${voucher.usageCount ||
                                                    0
                                                    }/${voucher.usageLimit
                                                    } uses`
                                                    : 'Unlimited uses'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {isActive
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() =>
                                                    handleEditVoucher(voucher)
                                                }
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                <IoPencil />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteVoucher(
                                                        voucher._id
                                                    )
                                                }
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <IoTrash />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Voucher Modal */}
            {openAddEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
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
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Voucher Code{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            disabled={!!currentVoucher}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Voucher Name{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
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
                                            onChange={handleInputChange}
                                            rows="2"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Discount Type{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            name="discountType"
                                            value={formData.discountType}
                                            onChange={handleInputChange}
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
                                            {formData.discountType ===
                                                'percentage'
                                                ? 'Discount Percentage'
                                                : 'Fixed Amount'}{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="discountValue"
                                                value={formData.discountValue}
                                                onChange={handleInputChange}
                                                min="0"
                                                step={
                                                    formData.discountType ===
                                                        'percentage'
                                                        ? '0.01'
                                                        : '1'
                                                }
                                                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <span className="absolute right-3 top-2 text-gray-500">
                                                {formData.discountType ===
                                                    'percentage'
                                                    ? '%'
                                                    : '$'}
                                            </span>
                                        </div>
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
                                                    value={
                                                        formData.maxDiscount ||
                                                        ''
                                                    }
                                                    onChange={handleInputChange}
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
                                                onChange={handleInputChange}
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
                                            value={formData.usageLimit || ''}
                                            onChange={handleInputChange}
                                            min="1"
                                            step="1"
                                            placeholder="Unlimited if empty"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Date{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <IoCalendar className="absolute right-3 top-2.5 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Date{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
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
                                            id="isActive"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label
                                            htmlFor="isActive"
                                            className="ml-2 block text-sm text-gray-700"
                                        >
                                            Active
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="applyForAllProducts"
                                            name="applyForAllProducts"
                                            checked={
                                                formData.applyForAllProducts
                                            }
                                            onChange={handleInputChange}
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
                                        onClick={() =>
                                            setOpenAddEditModal(false)
                                        }
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        {currentVoucher
                                            ? 'Update Voucher'
                                            : 'Create Voucher'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoucherPage;
