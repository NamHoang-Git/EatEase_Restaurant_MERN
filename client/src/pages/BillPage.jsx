import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGlobalContext } from '../provider/GlobalProvider';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    FaSearch,
    FaFileInvoice,
    FaPrint,
    FaFilePdf,
    FaFileExcel,
    FaFilter,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaEye,
} from 'react-icons/fa';
import { DisplayPriceInVND } from '../utils/DisplayPriceInVND';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import StatusBadge from '../components/StatusBadge';

const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

const BillPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { fetchOrder } = useGlobalContext();
    const { data: orders = [], loading } = useSelector((state) => state.orders);
    const { user } = useSelector((state) => state.auth || {});
    const isAdmin = user?.role === 'admin';

    console.log('User role:', user?.role);
    console.log('Is admin:', isAdmin);

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: '',
        endDate: '',
    });

    const [sortConfig, setSortConfig] = useState({
        key: 'createdAt',
        direction: 'desc',
    });

    // Fetch orders on component mount
    useEffect(() => {
        const loadOrders = async () => {
            const accessToken = localStorage.getItem('accesstoken');
            if (!accessToken) return;

            try {
                await dispatch(fetchOrder());
            } catch (error) {
                toast.error(
                    'Không thể tải danh sách hóa đơn: ' +
                        (error.message || 'Lỗi không xác định')
                );
            }
        };
        loadOrders();
    }, [dispatch, fetchOrder]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle sort
    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction:
                prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Enhanced filter logic
    const filteredAndSortedOrders = React.useMemo(() => {
        let result = [...orders];

        // Apply search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase().trim();
            result = result.filter((order) => {
                // Search in multiple fields
                const searchFields = [
                    order.orderId?.toLowerCase() || '',
                    order.userId?.name?.toLowerCase() || '',
                    order.userId?.mobile?.toLowerCase() || '',
                    order.product_details?.name?.toLowerCase() || '',
                    order.payment_status?.toLowerCase() || '',
                    order.delivery_address?.city?.toLowerCase() || '',
                ];

                return searchFields.some((field) =>
                    field.includes(searchLower)
                );
            });
        }

        // Apply filters
        if (filters.status) {
            result = result.filter(
                (order) => order.payment_status === filters.status
            );
        }

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            result = result.filter(
                (order) => new Date(order.createdAt) >= start
            );
        }

        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter((order) => new Date(order.createdAt) <= end);
        }

        // Apply sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle nested properties
                if (sortConfig.key.includes('.')) {
                    const keys = sortConfig.key.split('.');
                    aValue = keys.reduce((obj, key) => obj?.[key], a);
                    bValue = keys.reduce((obj, key) => obj?.[key], b);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [orders, filters, sortConfig]);

    // Calculate totals
    const { totalRevenue, orderCount } = React.useMemo(() => {
        return filteredAndSortedOrders.reduce(
            (acc, order) => ({
                totalRevenue: acc.totalRevenue + (order.totalAmt || 0),
                orderCount: acc.orderCount + 1,
            }),
            { totalRevenue: 0, orderCount: 0 }
        );
    }, [filteredAndSortedOrders]);

    // Export to Excel
    const exportToExcel = () => {
        const data = filteredAndSortedOrders.map((order) => ({
            'Mã hóa đơn': order.orderId,
            'Ngày tạo': format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', {
                locale: vi,
            }),
            'Khách hàng': order.userId?.name || 'Khách vãng lai',
            'Sản phẩm': order.product_details?.name || '',
            'Số lượng': order.quantity,
            'Tổng tiền': order.totalAmt,
            'Trạng thái thanh toán': order.payment_status || 'Chưa xác định',
            'Địa chỉ giao hàng': order.delivery_address?.address || '',
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Danh sách hóa đơn');
        XLSX.writeFile(
            wb,
            `danh-sach-hoa-don-${new Date().toISOString().split('T')[0]}.xlsx`
        );
    };

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.text('DANH SÁCH HÓA ĐƠN', 105, 15, { align: 'center' });

        // Add date
        doc.setFontSize(10);
        doc.text(
            `Ngày xuất: ${format(new Date(), 'dd/MM/yyyy HH:mm', {
                locale: vi,
            })}`,
            14,
            25
        );

        // Add table
        const headers = [
            'Mã HĐ',
            'Ngày tạo',
            'Khách hàng',
            'Sản phẩm',
            'SL',
            'Tổng tiền',
            'Trạng thái thanh toán',
        ];

        const data = filteredAndSortedOrders.map((order) => [
            order.orderId,
            format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: vi }),
            order.userId?.name || 'Khách vãng lai',
            (order.product_details?.name?.substring(0, 15) || '') +
                (order.product_details?.name?.length > 15 ? '...' : ''),
            order.quantity,
            DisplayPriceInVND(order.totalAmt || 0),
            order.payment_status || 'Chưa xác định',
        ]);

        doc.autoTable({
            head: [headers],
            body: data,
            startY: 30,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 25 },
                2: { cellWidth: 30 },
                3: { cellWidth: 40 },
                4: { cellWidth: 15 },
                5: { cellWidth: 25 },
                6: { cellWidth: 30 },
            },
        });

        // Add summary
        doc.setFontSize(10);
        doc.text(
            `Tổng số hóa đơn: ${orderCount}`,
            14,
            doc.lastAutoTable.finalY + 15
        );
        doc.text(
            `Tổng doanh thu: ${DisplayPriceInVND(totalRevenue)}`,
            14,
            doc.lastAutoTable.finalY + 25
        );

        doc.save(
            `danh-sach-hoa-don-${new Date().toISOString().split('T')[0]}.pdf`
        );
    };

    // Print bill
    const printBill = (order) => {
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hóa đơn ${order.orderId}</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
                    .subtitle { font-size: 12px; margin-bottom: 15px; }
                    .info { margin-bottom: 15px; }
                    .info-row { display: flex; margin-bottom: 5px; }
                    .info-label { font-weight: bold; width: 100px; }
                    .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    .table th, .table td { border: 1px solid #ddd; padding: 5px; }
                    .table th { background-color: #f2f2f2; text-align: left; }
                    .text-right { text-align: right; }
                    .mt-20 { margin-top: 20px; }
                    .signature { margin-top: 40px; text-align: center; }
                </style>
            </head>
            <body onload="window.print();">
                <div class="header">
                    <div class="title">HÓA ĐƠN BÁN HÀNG</div>
                    <div class="subtitle">Ngày: ${format(
                        new Date(order.createdAt),
                        'dd/MM/yyyy HH:mm',
                        { locale: vi }
                    )}</div>
                </div>

                <div class="info">
                    <div class="info-row">
                        <div class="info-label">Mã hóa đơn:</div>
                        <div>${order.orderId}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Khách hàng:</div>
                        <div>
                            <div>${order.userId?.name || 'Khách vãng lai'}</div>
                            ${
                                order.userId?.mobile
                                    ? `<div>${order.userId.mobile}</div>`
                                    : ''
                            }
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Địa chỉ:</div>
                        <div>${
                            order.delivery_address?.city || 'Chưa cập nhật'
                        }</div>
                    </div>
                </div>

                <table class="table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên sản phẩm</th>
                            <th>Đơn giá</th>
                            <th>Số lượng</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>${order.product_details?.name || ''}</td>
                            <td>${DisplayPriceInVND(
                                (order.totalAmt || 0) / (order.quantity || 1)
                            )}</td>
                            <td>${order.quantity || 1}</td>
                            <td class="text-right">${DisplayPriceInVND(
                                order.totalAmt || 0
                            )}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" class="text-right"><strong>Tổng cộng:</strong></td>
                            <td class="text-right"><strong>${DisplayPriceInVND(
                                order.totalAmt || 0
                            )}</strong></td>
                        </tr>
                    </tfoot>
                </table>

                <div class="signature">
                    <div class="mt-20">
                        <div>Người lập hóa đơn</div>
                        <div>(Ký, ghi rõ họ tên)</div>
                    </div>
                </div>

                <div class="signature" style="margin-top: 60px;">
                    <div>Khách hàng</div>
                    <div>(Ký, ghi rõ họ tên)</div>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
    };

    // Render sort icon
    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <FaSort className="ml-1 text-gray-400" />;
        }
        return sortConfig.direction === 'asc' ? (
            <FaSortUp className="ml-1 text-blue-500" />
        ) : (
            <FaSortDown className="ml-1 text-blue-500" />
        );
    };

    const statusOptions = [
        { value: '', label: 'Tất cả' },
        {
            value: 'Thanh toán khi giao hàng',
            label: 'Thanh toán khi giao hàng',
        },
        { value: 'Đang chờ thanh toán', label: 'Đang chờ thanh toán' },
        { value: 'Đã thanh toán', label: 'Đã thanh toán' },
    ];

    // Update the search filter with debouncing
    const handleSearchChange = debounce((value) => {
        setFilters((prev) => ({
            ...prev,
            search: value,
        }));
    }, 300);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Quản lý hóa đơn</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                            <FaFileInvoice className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">
                                Tổng số hóa đơn
                            </p>
                            <p className="text-2xl font-bold">{orderCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                            <FaFileInvoice className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">
                                Tổng doanh thu
                            </p>
                            <p className="text-2xl font-bold">
                                {DisplayPriceInVND(totalRevenue)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                            <FaFilter className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">
                                Đang hiển thị
                            </p>
                            <p className="text-2xl font-bold">
                                {filteredAndSortedOrders.length} /{' '}
                                {orders.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tìm kiếm
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="search"
                                placeholder="Tìm kiếm theo mã HĐ, tên KH, SĐT, sản phẩm..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                            />
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trạng thái thanh toán
                        </label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Từ ngày
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Đến ngày
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-4 space-x-2">
                    <button
                        onClick={() =>
                            setFilters({
                                search: '',
                                status: '',
                                startDate: '',
                                endDate: '',
                            })
                        }
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Đặt lại
                    </button>

                    <button
                        onClick={exportToExcel}
                        className="flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200"
                    >
                        <FaFileExcel className="mr-2" />
                        Xuất Excel
                    </button>

                    <button
                        onClick={exportToPDF}
                        className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200"
                    >
                        <FaFilePdf className="mr-2" />
                        Xuất PDF
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('orderId')}
                                >
                                    <div className="flex items-center">
                                        Mã HĐ
                                        {renderSortIcon('orderId')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Khách hàng
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sản phẩm
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('quantity')}
                                >
                                    <div className="flex items-center">
                                        Số lượng
                                        {renderSortIcon('quantity')}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('totalAmt')}
                                >
                                    <div className="flex items-center">
                                        Tổng tiền
                                        {renderSortIcon('totalAmt')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div className="flex items-center">
                                        Ngày tạo
                                        {renderSortIcon('createdAt')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-6 py-4 text-center"
                                    >
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAndSortedOrders.length > 0 ? (
                                filteredAndSortedOrders.map((order, index) => (
                                    <tr
                                        key={order._id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {order.orderId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {order.userId?.name ||
                                                    'Khách vãng lai'}
                                            </div>
                                            {order.userId?.email && (
                                                <div className="text-sm text-gray-500">
                                                    {order.userId.email}
                                                </div>
                                            )}
                                            {order.userId?.mobile && (
                                                <div className="text-sm text-gray-500">
                                                    {order.userId.mobile}
                                                </div>
                                            )}
                                            {order.delivery_address?.city && (
                                                <div className="text-sm text-gray-500">
                                                    {
                                                        order.delivery_address
                                                            .city
                                                    }
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={
                                                            order
                                                                .product_details
                                                                ?.image?.[0] ||
                                                            '/placeholder-product.png'
                                                        }
                                                        alt={
                                                            order
                                                                .product_details
                                                                ?.name
                                                        }
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {
                                                            order
                                                                .product_details
                                                                ?.name
                                                        }
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        SL: {order.quantity}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {DisplayPriceInVND(
                                                order.totalAmt || 0
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge
                                                status={order.payment_status}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(
                                                new Date(order.createdAt),
                                                'dd/MM/yyyy HH:mm',
                                                { locale: vi }
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() =>
                                                        printBill(order)
                                                    }
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="In hóa đơn"
                                                >
                                                    <FaPrint className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/order/${order._id}`
                                                        )
                                                    }
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Xem chi tiết"
                                                >
                                                    <FaEye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-6 py-4 text-center text-sm text-gray-500"
                                    >
                                        Không có hóa đơn nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BillPage;
