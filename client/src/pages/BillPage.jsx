import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import StatusBadge from '../components/StatusBadge';
import { fetchAllOrders } from '../store/orderSlice';
import ViewImage from '../components/ViewImage';

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
    const { allOrders: orders = [], loading } = useSelector(
        (state) => state.orders
    );
    const user = useSelector((state) => state.user);
    const isAdmin = user?.role === 'ADMIN';
    const [imageURL, setImageURL] = useState('');

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

    useEffect(() => {
        const loadOrders = async () => {
            const accessToken = localStorage.getItem('accesstoken');
            if (!accessToken || !isAdmin) {
                navigate('/dashboard/my-orders');
                return;
            }

            try {
                await dispatch(fetchAllOrders(filters)).unwrap();
            } catch (error) {
                if (error?.response?.status !== 401) {
                    toast.error(error || 'Có lỗi xảy ra khi tải đơn hàng');
                }
            }
        };

        loadOrders();
    }, [dispatch, isAdmin, navigate, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction:
                prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const filteredAndSortedOrders = React.useMemo(() => {
        let result = [...orders];

        if (filters.search) {
            const searchLower = filters.search.trim().toLowerCase();

            result = result.filter((order) => {
                // Get all searchable fields
                const searchFields = [
                    order.orderId?.toLowerCase(),
                    order.userId?.name?.toLowerCase(),
                    order.userId?.email?.toLowerCase(),
                    order.userId?.mobile?.toLowerCase(),
                    order.product_details?.name?.toLowerCase(),
                    order.payment_status?.toLowerCase(),
                    order.delivery_address?.city?.toLowerCase(),
                    order.delivery_address?.district?.toLowerCase(),
                    order.delivery_address?.ward?.toLowerCase(),
                    order.delivery_address?.address?.toLowerCase(),
                ].filter(Boolean);

                // Check if any field includes the search term
                return searchFields.some(
                    (field) => field && field.includes(searchLower)
                );
            });
        }

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

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

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

    const { totalRevenue, orderCount } = React.useMemo(() => {
        return filteredAndSortedOrders.reduce(
            (acc, order) => ({
                totalRevenue: acc.totalRevenue + (order.totalAmt || 0),
                orderCount: acc.orderCount + 1,
            }),
            { totalRevenue: 0, orderCount: 0 }
        );
    }, [filteredAndSortedOrders]);

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

    const exportToPDF = async () => {
        try {
            // Check if jsPDF is available
            if (!window.jsPDF) {
                throw new Error(
                    'Thư viện tạo PDF chưa được tải. Vui lòng thử lại sau.'
                );
            }

            // Create a new PDF document
            const doc = new window.jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
                compress: true,
            });

            // Add title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text('DANH SÁCH HÓA ĐƠN', 105, 15, { align: 'center' });

            // Add export date
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(
                `Ngày xuất: ${format(new Date(), 'dd/MM/yyyy HH:mm', {
                    locale: vi,
                })}`,
                14,
                25
            );

            // Define table headers
            const headers = [
                'Mã HĐ',
                'Ngày tạo',
                'Khách hàng',
                'Sản phẩm',
                'SL',
                'Tổng tiền',
                'Trạng thái thanh toán',
            ];

            // Prepare data
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

            // Add table with error handling
            try {
                doc.autoTable({
                    head: [headers],
                    body: data,
                    startY: 30,
                    styles: {
                        fontSize: 8,
                        cellPadding: 2,
                        overflow: 'linebreak',
                        lineWidth: 0.1,
                        lineColor: [0, 0, 0],
                        font: 'helvetica',
                    },
                    headStyles: {
                        fillColor: [41, 128, 185],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                    },
                    columnStyles: {
                        0: { cellWidth: 20 },
                        1: { cellWidth: 25 },
                        2: { cellWidth: 30 },
                        3: { cellWidth: 40 },
                        4: { cellWidth: 10, halign: 'center' },
                        5: { cellWidth: 25, halign: 'right' },
                        6: { cellWidth: 30 },
                    },
                    margin: { top: 30 },
                    didDrawPage: function (data) {
                        // Footer
                        const pageSize = doc.internal.pageSize;
                        const pageHeight =
                            pageSize.height || pageSize.getHeight();
                        doc.setFontSize(10);
                        doc.text(
                            `Trang ${doc.internal.getNumberOfPages()}`,
                            pageSize.width / 2,
                            pageHeight - 10,
                            { align: 'center' }
                        );
                    },
                });
            } catch (tableError) {
                console.error('Lỗi khi tạo bảng:', tableError);
                throw new Error('Không thể tạo bảng dữ liệu trong file PDF');
            }

            // Add summary
            const finalY = doc.lastAutoTable?.finalY || 30;
            doc.setFontSize(10);
            doc.text(`Tổng số hóa đơn: ${orderCount}`, 14, finalY + 10);
            doc.text(
                `Tổng doanh thu: ${DisplayPriceInVND(totalRevenue)}`,
                14,
                finalY + 20
            );

            // Save the PDF
            doc.save(
                `danh-sach-hoa-don-${format(
                    new Date(),
                    'yyyy-MM-dd-HH-mm-ss'
                )}.pdf`
            );

            toast.success('Xuất file PDF thành công!');
        } catch (error) {
            console.error('Lỗi khi xuất PDF:', error);
            toast.error(
                `Có lỗi xảy ra: ${error.message || 'Không thể xuất file PDF'}`
            );
        }
    };

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

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <FaSort className="ml-1 text-secondary-200" />;
        }
        return sortConfig.direction === 'asc' ? (
            <FaSortUp className="ml-1 text-secondary-200" />
        ) : (
            <FaSortDown className="ml-1 text-secondary-200" />
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

    const handleSearchChange = debounce((value) => {
        setFilters((prev) => ({
            ...prev,
            search: value,
        }));
    }, 300);

    return (
        <div className="w-full grid gap-5">
            <div className="p-4 mb-2 bg-primary-4 rounded-md shadow-md shadow-secondary-100 font-bold text-secondary-200 sm:text-lg text-sm uppercase flex justify-between items-center gap-2">
                <h2 className="text-ellipsis line-clamp-1">Quản lý Hóa đơn</h2>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                    className="bg-primary-5 rounded-lg shadow-md shadow-secondary-100 p-3
                flex items-center gap-4"
                >
                    <div className="p-3 rounded-full border-[3px] border-blue-600 bg-blue-100 text-blue-600">
                        <FaFileInvoice className="h-6 w-6" />
                    </div>
                    <div className="mt-1">
                        <p className="text-[15px] text-secondary-200 font-bold">
                            Tổng số hóa đơn
                        </p>
                        <p className="lg:text-xl text-2xl font-bold text-secondary-200">
                            {orderCount}
                        </p>
                    </div>
                </div>

                <div
                    className="bg-primary-5 rounded-lg shadow-md shadow-secondary-100 p-3
                flex items-center gap-4"
                >
                    <div className="p-3 rounded-full border-[3px] border-green-600 bg-green-100 text-green-600">
                        <FaFileInvoice className="h-6 w-6" />
                    </div>
                    <div className="mt-1">
                        <p className="text-[15px] text-secondary-200 font-bold">
                            Tổng doanh thu
                        </p>
                        <p className="lg:text-xl text-2xl font-bold text-secondary-200">
                            {DisplayPriceInVND(totalRevenue)}
                        </p>
                    </div>
                </div>

                <div
                    className="bg-primary-5 rounded-lg shadow-md shadow-secondary-100 p-3
                flex items-center gap-4"
                >
                    <div className="p-3 rounded-full border-[3px] border-yellow-600 bg-yellow-100 text-yellow-600">
                        <FaFilter className="h-6 w-6" />
                    </div>
                    <div className="mt-1">
                        <p className="text-[15px] text-secondary-200 font-bold">
                            Đang hiển thị
                        </p>
                        <p className="lg:text-xl text-2xl font-bold text-secondary-200">
                            {filteredAndSortedOrders.length} / {orders.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow-md shadow-secondary-100 px-4 py-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-[15px] font-medium text-secondary-200 mb-1">
                            Tìm kiếm
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="search"
                                placeholder="Tìm kiếm..."
                                className="w-full pl-10 h-11 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                                focus:ring-secondary-200"
                                value={filters.search}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[15px] font-medium text-secondary-200 mb-1">
                            Trạng thái
                        </label>
                        <select
                            name="status"
                            className="w-full p-2 h-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-200"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="">Tất cả</option>
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[15px] font-medium text-secondary-200 mb-1">
                            Từ ngày
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            className="w-full p-2 h-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-200 cursor-pointer"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div>
                        <label className="block text-[15px] font-medium text-secondary-200 mb-1">
                            Đến ngày
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            className="w-full p-2 h-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-200 cursor-pointer"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap justify-end mt-4 gap-2">
                    <button
                        onClick={() =>
                            setFilters({
                                search: '',
                                status: '',
                                startDate: '',
                                endDate: '',
                            })
                        }
                        className="px-4 py-2 text-sm font-medium text-secondary-200 bg-white border-2 border-secondary-200 rounded-lg
                        hover:bg-secondary-200 hover:text-white border-inset"
                    >
                        Đặt lại
                    </button>

                    <button
                        onClick={exportToExcel}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                        <FaFileExcel className="mr-2 mb-[2px]" />
                        Xuất Excel
                    </button>

                    <button
                        onClick={exportToPDF}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                    >
                        <FaFilePdf className="mr-2 mb-[2px]" />
                        Xuất PDF
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-full" style={{ minWidth: '1024px' }}>
                        <table className="w-full divide-y-[3px] divide-secondary-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-secondary-200 uppercase tracking-wider">
                                        <div className="flex items-center gap-1">
                                            Mã HĐ
                                            <button
                                                onClick={() =>
                                                    handleSort('orderId')
                                                }
                                                className="mb-1 focus:outline-none"
                                            >
                                                {renderSortIcon('orderId')}
                                            </button>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-secondary-200 uppercase tracking-wider">
                                        Khách hàng
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-secondary-200 uppercase tracking-wider max-w-[180px]">
                                        Sản phẩm
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-secondary-200 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <p className="text-nowrap">
                                                Tổng tiền
                                            </p>
                                            <button
                                                onClick={() =>
                                                    handleSort('totalAmt')
                                                }
                                                className="mb-1 focus:outline-none"
                                            >
                                                {renderSortIcon('totalAmt')}
                                            </button>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-secondary-200 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-secondary-200 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <p className="text-nowrap">
                                                Ngày tạo
                                            </p>
                                            <button
                                                onClick={() =>
                                                    handleSort('createdAt')
                                                }
                                                className="mb-1 focus:outline-none"
                                            >
                                                {renderSortIcon('createdAt')}
                                            </button>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-center text-nowrap text-sm font-bold text-secondary-200 uppercase tracking-wider">
                                        Thao tác
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
                                            Đang tải...
                                        </td>
                                    </tr>
                                ) : filteredAndSortedOrders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-4 text-center text-gray-500"
                                        >
                                            Không tìm thấy hóa đơn nào phù hợp
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAndSortedOrders.map((order) => (
                                        <tr
                                            key={order._id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td
                                                className="px-4 py-4 text-sm font-medium text-gray-900"
                                                title={order.orderId}
                                            >
                                                {order.orderId}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <p className="text-black font-semibold">
                                                    {order.userId?.name ||
                                                        'Khách vãng lai'}
                                                </p>
                                                <p>{order.userId?.email}</p>
                                                <p>
                                                    {
                                                        order.delivery_address
                                                            ?.mobile
                                                    }
                                                </p>
                                                <p>
                                                    {
                                                        order.delivery_address
                                                            ?.city
                                                    }
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500 flex items-center sm:grid  gap-3 max-w-[250px]">
                                                <img
                                                    src={
                                                        order.product_details
                                                            ?.image?.[0] ||
                                                        '/placeholder.jpg'
                                                    }
                                                    alt={
                                                        order.product_details
                                                            ?.name ||
                                                        'Product Image'
                                                    }
                                                    className="w-12 h-12 object-cover flex-shrink-0 rounded shadow-md shadow-secondary-100 cursor-pointer"
                                                    onError={(e) => {
                                                        e.target.src =
                                                            '/placeholder.jpg';
                                                    }}
                                                    onClick={() =>
                                                        setImageURL(
                                                            order
                                                                .product_details
                                                                ?.image?.[0]
                                                        )
                                                    }
                                                />
                                                <div>
                                                    <p
                                                        className="line-clamp-2 text-sm"
                                                        title={
                                                            order
                                                                .product_details
                                                                ?.name
                                                        }
                                                    >
                                                        {order.product_details
                                                            ?.name || 'N/A'}
                                                    </p>
                                                    <p className="text-secondary-200 font-bold text-sm">
                                                        x{order.quantity}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-secondary-200">
                                                {DisplayPriceInVND(
                                                    order.totalAmt
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <StatusBadge
                                                    status={
                                                        order.payment_status
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-secondary-200">
                                                {format(
                                                    new Date(order.createdAt),
                                                    'dd/MM/yyyy HH:mm',
                                                    {
                                                        locale: vi,
                                                    }
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <button
                                                    onClick={() =>
                                                        printBill(order)
                                                    }
                                                    className="text-blue-600 hover:opacity-80"
                                                >
                                                    <FaPrint className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {imageURL && (
                <ViewImage url={imageURL} close={() => setImageURL('')} />
            )}
        </div>
    );
};

export default BillPage;
