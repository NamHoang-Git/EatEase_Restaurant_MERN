import React, { useEffect, useState, useMemo } from 'react';
import { IoAdd, IoPencil, IoTrash, IoCalendar, IoClose } from 'react-icons/io5';
import { format } from 'date-fns';
import NoData from './../components/NoData';
import Loading from './../components/Loading';
// Import jsPDF and autoTable for PDF generation
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import AddVoucher from '../components/AddVoucher';
import EditVoucher from '../components/EditVoucher';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import AxiosToastError from '../utils/AxiosToastError';
import successAlert from '../utils/successAlert';
import ConfirmBox from '../components/ConfirmBox';

const VoucherPage = () => {
    // State declarations
    const [openUploadVoucher, setOpenUploadVoucher] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [openEditVoucher, setOpenEditVoucher] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({
        key: 'startDate',
        direction: 'desc',
    });
    const [selectedVouchers, setSelectedVouchers] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [editFormData, setEditFormData] = useState({
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
    const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false);
    const [openConfirmBulkDeleteBox, setOpenConfirmBulkDeleteBox] =
        useState(false);

    const [openConfirmBulkStatusUpdateBox, setOpenConfirmBulkStatusUpdateBox] =
        useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);

    const [deleteVoucher, setDeleteVoucher] = useState({
        _id: '',
    });

    // Apply sorting to data
    const sortedData = useMemo(() => {
        const sortableItems = [...(filteredData || [])];
        if (sortConfig !== null && sortConfig.key) {
            sortableItems.sort((a, b) => {
                // Handle date fields differently
                if (['startDate', 'endDate'].includes(sortConfig.key)) {
                    const dateA = new Date(a[sortConfig.key]);
                    const dateB = new Date(b[sortConfig.key]);
                    return sortConfig.direction === 'asc'
                        ? dateA - dateB
                        : dateB - dateA;
                }
                // Handle string comparison
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredData, sortConfig]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedData = sortedData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1; // Ensure at least 1 page

    // Reset to first page if current page exceeds total pages after filtering/sorting
    useEffect(() => {
        if (currentPage > 1 && currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Sort function
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            // If clicking the same column for the third time, remove sorting
            setSortConfig({ key: null, direction: 'asc' });
            setCurrentPage(1);
            return;
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset to first page when sorting changes
    };

    // Handle select/deselect all
    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setSelectAll(isChecked);
        if (isChecked) {
            setSelectedVouchers(filteredData.map((voucher) => voucher._id));
        } else {
            setSelectedVouchers([]);
        }
    };

    // Handle individual row selection
    const handleSelectRow = (e, id) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            setSelectedVouchers([...selectedVouchers, id]);
        } else {
            setSelectedVouchers(
                selectedVouchers.filter((voucherId) => voucherId !== id)
            );
            setSelectAll(false);
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedVouchers.length === 0) return;

        try {
            const response = await Axios({
                ...SummaryApi.bulk_delete_vouchers,
                data: { voucherIds: selectedVouchers },
            });

            if (response.data.success) {
                successAlert(
                    `Đã xóa thành công ${selectedVouchers.length} mã giảm giá`
                );
                setSelectedVouchers([]);
                setSelectAll(false);
                fetchVoucher();
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setOpenConfirmBulkDeleteBox(false);
        }
    };

    // Handle bulk status update
    const handleBulkStatusUpdate = async () => {
        if (selectedVouchers.length === 0) return;

        const statusText = pendingStatus ? 'kích hoạt' : 'vô hiệu hóa';

        try {
            const response = await Axios({
                ...SummaryApi.bulk_update_vouchers_status,
                data: {
                    voucherIds: selectedVouchers,
                    isActive: pendingStatus,
                },
            });

            if (response.data.success) {
                successAlert(
                    `Đã ${statusText} thành công ${selectedVouchers.length} mã giảm giá`
                );
                setSelectedVouchers([]);
                setSelectAll(false);
                fetchVoucher();
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setOpenConfirmBulkStatusUpdateBox(false);
            setPendingStatus(null);
        }
    };

    // Fetch vouchers from API
    const fetchVoucher = async () => {
        const accessToken = localStorage.getItem('accesstoken');
        if (!accessToken) return;

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_all_voucher,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                setData(responseData.data);
                setFilteredData(responseData.data);
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Reset selection when data changes
    useEffect(() => {
        setSelectedVouchers([]);
        setSelectAll(false);
    }, [data]);

    // Apply filters and search
    useEffect(() => {
        try {
            let result = [...data];

            // Apply status filter
            if (statusFilter === 'active') {
                result = result.filter((voucher) => voucher.isActive === true);
            } else if (statusFilter === 'inactive') {
                result = result.filter((voucher) => voucher.isActive === false);
            } else if (statusFilter === 'applying') {
                result = result.filter(
                    (voucher) =>
                        new Date(voucher.startDate) < new Date() &&
                        new Date(voucher.endDate) > new Date()
                );
            } else if (statusFilter === 'expired') {
                result = result.filter(
                    (voucher) => new Date(voucher.endDate) < new Date()
                );
            } else if (statusFilter === 'upcoming') {
                result = result.filter(
                    (voucher) => new Date(voucher.startDate) > new Date()
                );
            } else if (statusFilter === 'percentage') {
                result = result.filter(
                    (voucher) => voucher.discountType === 'percentage'
                );
            } else if (statusFilter === 'fixed') {
                result = result.filter(
                    (voucher) => voucher.discountType === 'fixed'
                );
            } else if (statusFilter === 'free_shipping') {
                result = result.filter(
                    (voucher) => voucher.discountType === 'free_shipping'
                );
            }

            // Apply search term
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                result = result.filter(
                    (voucher) =>
                        voucher.code.toLowerCase().includes(searchLower) ||
                        voucher.name.toLowerCase().includes(searchLower) ||
                        voucher.description.toLowerCase().includes(searchLower)
                );
            }
            setFilteredData(result);
        } catch (error) {
            AxiosToastError(error);
        }
    }, [data, statusFilter, searchTerm]);

    // Handle toggle status for a single voucher
    const handleToggleStatus = async (voucher) => {
        try {
            const response = await Axios({
                ...SummaryApi.update_voucher,
                data: {
                    ...voucher,
                    isActive: !voucher.isActive,
                },
            });

            if (response.data.success) {
                successAlert(response.data.message);
                fetchVoucher();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Handle delete voucher
    const handleDeleteVoucher = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.delete_voucher,
                data: { _id: deleteVoucher._id },
            });

            if (response.data.success) {
                successAlert('Xóa mã giảm giá thành công');
                setOpenConfirmBoxDelete(false);
                fetchVoucher();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Handle export to PDF
    const handleExportPDF = () => {
        try {
            // Initialize PDF document
            const doc = new jsPDF();

            // Define table columns
            const tableColumn = [
                'Mã',
                'Tên',
                'Giảm giá',
                'Đơn tối thiểu',
                'Ngày bắt đầu',
                'Ngày kết thúc',
                'Trạng thái',
            ];

            // Prepare table data
            const tableRows = [];

            filteredData.forEach((voucher) => {
                tableRows.push([
                    voucher.code,
                    voucher.name,
                    voucher.discountType === 'percentage'
                        ? `${voucher.discountValue}%`
                        : `${voucher.discountValue.toLocaleString()}đ`,
                    voucher.minOrderValue
                        ? `${voucher.minOrderValue.toLocaleString()}đ`
                        : 'Không có',
                    format(new Date(voucher.startDate), 'dd/MM/yyyy'),
                    format(new Date(voucher.endDate), 'dd/MM/yyyy'),
                    voucher.isActive ? 'Đang hoạt động' : 'Đã tắt',
                ]);
            });

            // Add title
            const date = format(new Date(), 'dd/MM/yyyy');
            doc.setFontSize(16);
            doc.text(`Danh sách mã giảm giá - ${date}`, 14, 15);

            // Add table using autoTable
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 25,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak',
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontStyle: 'bold',
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245],
                },
                margin: { top: 20 },
            });

            // Save the PDF
            doc.save(
                `danh-sach-ma-giam-gia-${format(new Date(), 'dd-MM-yyyy')}.pdf`
            );
        } catch (error) {
            console.error('Error generating PDF:', error);
            AxiosToastError('Đã xảy ra lỗi khi xuất file PDF');
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchVoucher();
    }, []);

    return (
        <section className="container mx-auto lg:py-4 py-2 px-1 flex flex-col gap-4">
            {/* Header */}
            <div
                className="px-3 py-4 bg-primary-4 rounded-md shadow-md shadow-secondary-100
            font-bold text-secondary-200 sm:text-lg text-sm flex justify-between
            items-center gap-4"
            >
                <h2 className="text-ellipsis line-clamp-1 uppercase">
                    Quản lý mã giảm giá
                </h2>
                <div className="flex items-center gap-2 md:text-base sm:text-sm text-xs">
                    <button
                        onClick={() => setOpenUploadVoucher(true)}
                        className="sm:h-10 h-8 bg-primary-2 border-[3px] border-secondary-200 text-secondary-200 px-2 hover:opacity-80
                        py-1 rounded-md text-nowrap flex gap-1 items-center"
                    >
                        <IoAdd size={20} className="mb-[2px]" />
                        Thêm Mới
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="w-full sm:w-auto grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="relative w-full text-secondary-200 font-semibold">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="sm:h-10 h-8 w-full appearance-none bg-white border border-gray-300 px-4 rounded-md focus:outline-none focus:ring-1
                    focus:ring-secondary-200 focus:border-sering-secondary-200 text-sm"
                    >
                        <option value="all">Chọn trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Đã tắt</option>
                        <option value="applying">Đang áp dụng</option>
                        <option value="expired">Đã hết hạn</option>
                        <option value="upcoming">Sắp diễn ra</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                        <svg
                            className="fill-current h-4 w-4"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                    </div>
                </div>
                <div className="relative w-full text-secondary-200 font-semibold">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="sm:h-10 h-8 w-full appearance-none bg-white border border-gray-300 px-4 rounded-md focus:outline-none focus:ring-1
                    focus:ring-secondary-200 focus:border-sering-secondary-200 text-sm"
                    >
                        <option value="all">Chọn loại giảm giá</option>
                        <option value="percentage">Phần trăm</option>
                        <option value="fixed">Giảm giá cố định</option>
                        <option value="free_shipping">
                            Miễn phí vận chuyển
                        </option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                        <svg
                            className="fill-current h-4 w-4"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setStatusFilter('all');
                        setSearchTerm('');
                    }}
                    className="sm:h-10 h-8 text-sm w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium
                rounded-md transition-colors whitespace-nowrap sm:block hidden"
                >
                    Đặt lại bộ lọc
                </button>
                <button
                    onClick={handleExportPDF}
                    className="sm:h-10 h-8 text-sm text-center bg-secondary-200 text-white
                rounded-md hover:opacity-80 transition-colors w-full sm:block hidden"
                >
                    Xuất PDF
                </button>

                <div className="sm:hidden flex gap-2 text-sm font-medium">
                    <button
                        onClick={() => {
                            setStatusFilter('all');
                            setSearchTerm('');
                        }}
                        className="sm:h-10 h-8 w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium
                rounded-md transition-colors whitespace-nowrap"
                    >
                        Đặt lại bộ lọc
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="sm:h-10 h-8 text-center bg-secondary-200 text-white
                rounded-md hover:opacity-80 transition-colors w-full"
                    >
                        Xuất PDF
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="w-full md:w-80 lg:w-96 text-secondary-200 font-medium">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm mã giảm giá..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1
                    focus:ring-secondary-200 focus:border-sering-secondary-200 text-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                            className="h-4 w-4 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Bulk actions */}
            {selectedVouchers.length > 0 && (
                <div className="flex space-x-2 font-semibold text-sm">
                    <button
                        onClick={() => {
                            setOpenConfirmBulkStatusUpdateBox(true);
                            setPendingStatus(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                    >
                        Kích hoạt ({selectedVouchers.length})
                    </button>
                    <button
                        onClick={() => {
                            setOpenConfirmBulkStatusUpdateBox(true);
                            setPendingStatus(false);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                    >
                        Vô hiệu hóa ({selectedVouchers.length})
                    </button>
                    <button
                        onClick={() => setOpenConfirmBulkDeleteBox(true)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                        Xóa ({selectedVouchers.length})
                    </button>
                </div>
            )}

            {/* Vouchers Table */}
            <div className="overflow-x-auto scrollbarCustom bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y-4 divide-secondary-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 w-8">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 mt-[3px] text-secondary-200 rounded border-gray-300 focus:ring-secondary-200 cursor-pointer"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th
                                className="px-4 py-3 text-center text-xs font-bold text-secondary-200 uppercase tracking-wider cursor-pointer"
                                onClick={() => requestSort('code')}
                            >
                                Mã giảm giá
                                {sortConfig.key === 'code' && (
                                    <span>
                                        {sortConfig.direction === 'asc'
                                            ? ' ↑'
                                            : ' ↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className="px-4 py-3 text-center text-xs font-bold text-secondary-200 uppercase tracking-wider cursor-pointer"
                                onClick={() => requestSort('name')}
                            >
                                Tên mã giảm giá
                                {sortConfig.key === 'name' && (
                                    <span>
                                        {sortConfig.direction === 'asc'
                                            ? ' ↑'
                                            : ' ↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className="px-4 py-3 text-center text-xs font-bold text-secondary-200 uppercase tracking-wider cursor-pointer"
                                onClick={() => requestSort('discountType')}
                            >
                                Loại giảm giá
                                {sortConfig.key === 'discountType' && (
                                    <span>
                                        {sortConfig.direction === 'asc'
                                            ? ' ↑'
                                            : ' ↓'}
                                    </span>
                                )}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-secondary-200 uppercase tracking-wider">
                                Giá trị
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-secondary-200 uppercase tracking-wider">
                                Đơn hàng tối thiểu
                            </th>
                            <th
                                className="px-4 py-3 text-center text-xs font-bold text-secondary-200 uppercase tracking-wider cursor-pointer"
                                onClick={() => requestSort('startDate')}
                            >
                                Ngày bắt đầu
                                {sortConfig.key === 'startDate' && (
                                    <span>
                                        {sortConfig.direction === 'asc'
                                            ? ' ↑'
                                            : ' ↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className="px-4 py-3 text-center text-xs font-bold text-secondary-200 uppercase tracking-wider cursor-pointer"
                                onClick={() => requestSort('endDate')}
                            >
                                Ngày kết thúc
                                {sortConfig.key === 'endDate' && (
                                    <span>
                                        {sortConfig.direction === 'asc'
                                            ? ' ↑'
                                            : ' ↓'}
                                    </span>
                                )}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-secondary-200 uppercase tracking-wider">
                                Số lượng đã sử dụng
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-secondary-200 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-secondary-200 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan="9"
                                    className="px-4 py-4 text-center"
                                >
                                    <Loading />
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="9"
                                    className="px-4 py-4 text-center"
                                >
                                    <NoData text="Không tìm thấy mã giảm giá nào" />
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((voucher) => (
                                <tr
                                    key={voucher._id}
                                    className={`hover:bg-gray-50 ${
                                        selectedVouchers.includes(voucher._id)
                                            ? 'bg-rose-50'
                                            : ''
                                    } sm:text-sm text-xs`}
                                >
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-secondary-200 rounded border-gray-300 focus:ring-secondary-200 cursor-pointer"
                                            checked={selectedVouchers.includes(
                                                voucher._id
                                            )}
                                            onChange={(e) =>
                                                handleSelectRow(e, voucher._id)
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                        <p>{voucher.code}</p>
                                        <span>
                                            {new Date() <
                                            new Date(voucher.startDate) ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    Sắp diễn ra
                                                </span>
                                            ) : new Date() >
                                              new Date(voucher.endDate) ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Đã hết hạn
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Đang áp dụng
                                                </span>
                                            )}
                                        </span>
                                    </td>

                                    <td className="px-4 py-4 text-sm text-center font-semibold text-gray-600">
                                        {voucher.name}
                                    </td>
                                    <td className="px-4 py-4 text-sm font-semibold text-center text-gray-600">
                                        {voucher.discountType ===
                                        'percentage' ? (
                                            <p>Percentage (%)</p>
                                        ) : voucher.discountType === 'fixed' ? (
                                            <p>Fixed (VNĐ)</p>
                                        ) : (
                                            <p>Free Shipping</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center text-gray-500">
                                        {voucher.discountType === 'percentage'
                                            ? `${voucher.discountValue}%`
                                            : voucher.discountType === 'fixed'
                                            ? `${voucher.discountValue.toLocaleString()}đ`
                                            : `Miễn phí vận chuyển`}
                                        {voucher.maxDiscount &&
                                            voucher.discountType ===
                                                'percentage' && (
                                                <span className="text-xs font-semibold text-gray-600 block">
                                                    Tối đa:{' '}
                                                    {voucher.maxDiscount.toLocaleString()}
                                                    đ
                                                </span>
                                            )}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-center font-semibold text-secondary-200">
                                        {voucher.minOrderValue
                                            ? `${voucher.minOrderValue.toLocaleString()}đ`
                                            : 'Không có'}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                        {format(
                                            new Date(voucher.startDate),
                                            'dd/MM/yyyy' + ' ' + 'HH:mm:ss'
                                        )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                        {format(
                                            new Date(voucher.endDate),
                                            'dd/MM/yyyy' + ' ' + 'HH:mm:ss'
                                        )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {voucher.usageCount}/
                                        {voucher.usageLimit}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                voucher.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {voucher.isActive
                                                ? 'Đang hoạt động'
                                                : 'Đã tắt'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    name="isActive"
                                                    checked={voucher.isActive}
                                                    onChange={() =>
                                                        handleToggleStatus(
                                                            voucher
                                                        )
                                                    }
                                                />
                                                <div
                                                    className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                                        voucher.isActive
                                                            ? 'bg-green-300'
                                                            : 'bg-gray-300'
                                                    }`}
                                                ></div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setEditFormData({
                                                        ...voucher,
                                                        startDate:
                                                            voucher.startDate.split(
                                                                'T'
                                                            )[0],
                                                        endDate:
                                                            voucher.endDate.split(
                                                                'T'
                                                            )[0],
                                                    });
                                                    setOpenEditVoucher(true);
                                                }}
                                                className="bg-orange-100 hover:bg-orange-200 text-orange-600 p-1 rounded-md"
                                            >
                                                <IoPencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeleteVoucher({
                                                        _id: voucher._id,
                                                    });
                                                    setOpenConfirmBoxDelete(
                                                        true
                                                    );
                                                }}
                                                className="bg-red-100 hover:bg-red-200 text-red-600 p-1 rounded-md"
                                            >
                                                <IoTrash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-700">
                        Hiển thị{' '}
                        <span className="font-medium">
                            {indexOfFirstItem + 1}
                        </span>{' '}
                        đến{' '}
                        <span className="font-medium">
                            {Math.min(indexOfLastItem, sortedData.length)}
                        </span>{' '}
                        trong tổng số{' '}
                        <span className="font-medium">{sortedData.length}</span>{' '}
                        kết quả
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => paginate(1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                            <span className="sr-only">First</span>
                            &laquo;
                        </button>
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                            <span className="sr-only">Previous</span>
                            &lsaquo;
                        </button>

                        {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => paginate(pageNum)}
                                        className={`relative inline-flex items-center px-4 py-2 border ${
                                            currentPage === pageNum
                                                ? 'bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            }
                        )}

                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                            <span className="sr-only">Next</span>
                            &rsaquo;
                        </button>
                        <button
                            onClick={() => paginate(totalPages)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                            <span className="sr-only">Last</span>
                            &raquo;
                        </button>
                    </div>
                </div>
            )}

            {/* Add Voucher Modal */}
            {openUploadVoucher && (
                <AddVoucher
                    onClose={() => setOpenUploadVoucher(false)}
                    fetchVoucher={fetchVoucher}
                    onSuccess={() => {
                        setOpenUploadVoucher(false);
                        fetchVoucher();
                    }}
                />
            )}

            {/* Edit Voucher Modal */}
            {openEditVoucher && (
                <EditVoucher
                    voucher={editFormData}
                    fetchVoucher={fetchVoucher}
                    onClose={() => setOpenEditVoucher(false)}
                    onSuccess={() => {
                        setOpenEditVoucher(false);
                        fetchVoucher();
                    }}
                />
            )}

            {/* Delete Confirmation */}
            {openConfirmBoxDelete && (
                <ConfirmBox
                    open={openConfirmBoxDelete}
                    close={() => setOpenConfirmBoxDelete(false)}
                    confirm={handleDeleteVoucher}
                    cancel={() => setOpenConfirmBoxDelete(false)}
                    title="Xác nhận xóa"
                    message="Bạn có chắc chắn muốn xóa mã giảm giá này?"
                    confirmText="Xóa"
                    cancelText="Hủy"
                />
            )}

            {/* Bulk Delete Confirmation */}
            {openConfirmBulkDeleteBox && (
                <ConfirmBox
                    open={openConfirmBulkDeleteBox}
                    close={() => setOpenConfirmBulkDeleteBox(false)}
                    confirm={handleBulkDelete}
                    cancel={() => setOpenConfirmBulkDeleteBox(false)}
                    title="Xác nhận xóa"
                    message={`Bạn có chắc chắn muốn xóa ${selectedVouchers.length} mã giảm giá đã chọn?`}
                    confirmText="Xóa"
                    cancelText="Hủy"
                />
            )}

            {/* Bulk Status Update Confirmation */}
            {openConfirmBulkStatusUpdateBox && (
                <ConfirmBox
                    open={openConfirmBulkStatusUpdateBox}
                    close={() => setOpenConfirmBulkStatusUpdateBox(false)}
                    confirm={handleBulkStatusUpdate}
                    cancel={() => setOpenConfirmBulkStatusUpdateBox(false)}
                    title="Xác nhận thay đổi trạng thái"
                    message={`Bạn có chắc chắn muốn ${
                        pendingStatus ? 'kích hoạt' : 'vô hiệu hóa'
                    } ${selectedVouchers.length} mã giảm giá đã chọn?`}
                    confirmText="Thay đổi"
                    cancelText="Hủy"
                />
            )}
        </section>
    );
};

export default VoucherPage;
