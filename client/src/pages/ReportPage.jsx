import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    FaSearch,
    FaFilePdf,
    FaFileExcel,
    FaFilter,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaChartBar,
    FaChartPie,
    FaChartLine,
    FaCalendarAlt,
    FaUndo,
    FaFileInvoice,
    FaCoins,
} from 'react-icons/fa';
import { BsCoin } from 'react-icons/bs';
import { DisplayPriceInVND } from '../utils/DisplayPriceInVND';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { fetchAllOrders } from '../store/orderSlice';
import StatusBadge from '../components/StatusBadge';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import ViewImage from '../components/ViewImage';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'Thanh toán khi giao hàng', label: 'Thanh toán khi giao hàng' },
    { value: 'Đang chờ thanh toán', label: 'Đang chờ thanh toán' },
    { value: 'Đã thanh toán', label: 'Đã thanh toán' },
];

const ReportPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { allOrders: orders = [], loading } = useSelector(
        (state) => state.orders
    );
    const user = useSelector((state) => state.user);
    const isAdmin = user?.role === 'ADMIN';
    const [imageURL, setImageURL] = useState('');
    const [dateRange, setDateRange] = useState('7days');
    const [chartType, setChartType] = useState('bar');

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

    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
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
                    toast.error(
                        error || 'Có lỗi xảy ra khi tải báo cáo đơn hàng'
                    );
                }
            }
        };

        loadOrders();
    }, [dispatch, isAdmin, navigate, filters]);

    useEffect(() => {
        let startDate, endDate;
        const today = new Date();

        switch (dateRange) {
            case 'today':
                startDate = format(today, 'yyyy-MM-dd');
                endDate = format(today, 'yyyy-MM-dd');
                break;
            case 'yesterday':
                startDate = format(subDays(today, 1), 'yyyy-MM-dd');
                endDate = format(subDays(today, 1), 'yyyy-MM-dd');
                break;
            case '7days':
                startDate = format(subDays(today, 7), 'yyyy-MM-dd');
                endDate = format(today, 'yyyy-MM-dd');
                break;
            case '30days':
                startDate = format(subDays(today, 30), 'yyyy-MM-dd');
                endDate = format(today, 'yyyy-MM-dd');
                break;
            case 'thismonth':
                startDate = format(startOfMonth(today), 'yyyy-MM-dd');
                endDate = format(endOfMonth(today), 'yyyy-MM-dd');
                break;
            case 'custom':
                // Don't modify dates in custom mode
                if (filters.startDate && filters.endDate) {
                    startDate = filters.startDate.split('T')[0];
                    endDate = filters.endDate.split('T')[0];
                    return;
                }
                break;
            default:
                startDate = '';
                endDate = '';
        }

        setFilters((prev) => ({
            ...prev,
            startDate: startDate ? `${startDate}T00:00:00` : '',
            endDate: endDate ? `${endDate}T23:59:59` : '',
        }));
    }, [dateRange]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === 'dateRange') {
            setDateRange(value);
        } else {
            setFilters((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
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
                    order.orderId,
                    order.userId?.name,
                    order.userId?.email,
                    order.userId?.mobile,
                    order.product_details?.name,
                    order.payment_status,
                    order.delivery_address?.city,
                    order.delivery_address?.district,
                    order.delivery_address?.ward,
                    order.delivery_address?.address,
                ]
                    .filter(Boolean)
                    .map((field) => field?.toLowerCase() || '');

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

    const indexOfLastOrder = pagination.currentPage * pagination.pageSize;
    const indexOfFirstOrder = indexOfLastOrder - pagination.pageSize;
    const currentOrders = filteredAndSortedOrders.slice(
        indexOfFirstOrder,
        indexOfLastOrder
    );
    const totalPages = Math.ceil(
        filteredAndSortedOrders.length / pagination.pageSize
    );

    const paginate = (pageNumber) =>
        setPagination((prev) => ({
            ...prev,
            currentPage: pageNumber,
        }));

    const handlePageSizeChange = (e) => {
        setPagination({
            currentPage: 1, // Reset to first page when changing page size
            pageSize: Number(e.target.value),
        });
    };

    const PaginationControls = () => (
        <div className="flex items-center sm:flex-row flex-col justify-between mt-4 gap-3">
            <div className="flex items-center sm:flex-row flex-col space-x-2 gap-2">
                <span className="text-sm text-gray-700 text-center">
                    Hiển thị{' '}
                    <span className="font-semibold text-secondary-200">
                        {indexOfFirstOrder + 1}
                    </span>{' '}
                    đến{' '}
                    <span className="font-semibold text-secondary-200">
                        {Math.min(
                            indexOfLastOrder,
                            filteredAndSortedOrders.length
                        )}
                    </span>{' '}
                    trong tổng số{' '}
                    <span className="font-semibold text-secondary-200">
                        {filteredAndSortedOrders.length}
                    </span>{' '}
                    đơn hàng
                </span>

                <select
                    value={pagination.pageSize}
                    onChange={handlePageSizeChange}
                    className="text-sm h-8 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1
                focus:ring-secondary-200 px-2"
                >
                    {[5, 10, 25, 50].map((size) => (
                        <option key={size} value={size}>
                            {size} dòng/trang
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex space-x-1">
                <button
                    onClick={() => paginate(1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                ></button>
                <button
                    onClick={() => paginate(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                ></button>

                {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const showFirstPage = pageNum === 1;
                    const showLastPage = pageNum === totalPages;
                    const showCurrentPage = pageNum === pagination.currentPage;
                    const showDotsLeft =
                        pageNum === 2 && pagination.currentPage > 3;
                    const showDotsRight =
                        pageNum === totalPages - 1 &&
                        pagination.currentPage < totalPages - 2;

                    if (
                        showFirstPage ||
                        showLastPage ||
                        showCurrentPage ||
                        showDotsLeft ||
                        showDotsRight
                    ) {
                        if (showDotsLeft || showDotsRight) {
                            return (
                                <span
                                    key={pageNum}
                                    className="px-3 py-1 text-gray-500"
                                >
                                    ...
                                </span>
                            );
                        }
                        return (
                            <button
                                key={pageNum}
                                onClick={() => paginate(pageNum)}
                                className={`px-3 py-1 rounded-md border text-sm font-medium ${
                                    pagination.currentPage === pageNum
                                        ? 'bg-secondary-200 text-white border-secondary-200'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    }
                    return null;
                })}

                <button
                    onClick={() => paginate(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === totalPages}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ›
                </button>
                <button
                    onClick={() => paginate(totalPages)}
                    disabled={pagination.currentPage === totalPages}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    »
                </button>
            </div>
        </div>
    );

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
            'Mã đơn hàng': order.orderId,
            'Ngày tạo': format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', {
                locale: vi,
            }),
            'Khách hàng': order.userId?.name || 'Khách vãng lai',
            'Sản phẩm': order.product_details?.name || '',
            'Số lượng': order.quantity,
            'Tổng tiền': order.totalAmt,
            'Trạng thái thanh toán': order.payment_status || 'Chưa xác định',
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo đơn hàng');
        XLSX.writeFile(
            wb,
            `bao-cao-don-hang-${new Date().toISOString().split('T')[0]}.xlsx`
        );
    };

    const handleResetFilters = () => {
        setFilters({
            search: '',
            status: '',
            startDate: '',
            endDate: '',
        });
        setDateRange('');
        setPagination({
            currentPage: 1,
            pageSize: 10,
        });
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="ml-1" />;
        return sortConfig.direction === 'asc' ? (
            <FaSortUp className="ml-1" />
        ) : (
            <FaSortDown className="ml-1" />
        );
    };

    // Chart data preparation
    const prepareChartData = () => {
        // Group orders by date for line chart
        const ordersByDate = filteredAndSortedOrders.reduce((acc, order) => {
            const date = format(new Date(order.createdAt), 'dd/MM/yyyy');
            if (!acc[date]) {
                acc[date] = { date, total: 0, count: 0 };
            }
            acc[date].total += order.totalAmt || 0;
            acc[date].count += 1;
            return acc;
        }, {});

        // Prepare data for status distribution pie chart
        const statusCounts = filteredAndSortedOrders.reduce((acc, order) => {
            const status = order.payment_status || 'Chưa xác định';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        // Prepare data for top products bar chart
        const productSales = filteredAndSortedOrders.reduce((acc, order) => {
            const productName = order.product_details?.name || 'Không xác định';
            if (!acc[productName]) {
                acc[productName] = { name: productName, total: 0, count: 0 };
            }
            acc[productName].total += order.totalAmt || 0;
            acc[productName].count += order.quantity || 0;
            return acc;
        }, {});

        // Sort products by total sales
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        return {
            salesData: {
                labels: Object.values(ordersByDate).map((item) => item.date),
                datasets: [
                    {
                        label: 'Doanh thu',
                        data: Object.values(ordersByDate).map(
                            (item) => item.total
                        ),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        yAxisID: 'y',
                    },
                    {
                        label: 'Số đơn hàng',
                        data: Object.values(ordersByDate).map(
                            (item) => item.count
                        ),
                        borderColor: 'rgb(53, 162, 235)',
                        backgroundColor: 'rgba(53, 162, 235, 0.2)',
                        yAxisID: 'y1',
                    },
                ],
            },
            statusData: {
                labels: Object.keys(statusCounts),
                datasets: [
                    {
                        data: Object.values(statusCounts),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                        ],
                        borderWidth: 1,
                    },
                ],
            },
            productsData: {
                labels: topProducts.map((item) => item.name),
                datasets: [
                    {
                        label: 'Doanh thu',
                        data: topProducts.map((item) => item.total),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                    },
                ],
            },
        };
    };

    const chartData = prepareChartData();

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label +=
                                context.dataset.yAxisID === 'y1'
                                    ? context.parsed.y + ' đơn'
                                    : DisplayPriceInVND(context.parsed.y);
                        }
                        return label;
                    },
                },
            },
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Doanh thu (VND)',
                },
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false,
                },
                title: {
                    display: true,
                    text: 'Số đơn hàng',
                },
            },
        },
    };

    const renderChart = () => {
        switch (chartType) {
            case 'bar':
                return (
                    <Bar data={chartData.salesData} options={chartOptions} />
                );
            case 'line':
                return (
                    <Line data={chartData.salesData} options={chartOptions} />
                );
            case 'pie':
                return (
                    <div className="max-w-xs mx-auto">
                        <Pie
                            data={chartData.statusData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) {
                                                const label =
                                                    context.label || '';
                                                const value = context.raw || 0;
                                                const total =
                                                    context.dataset.data.reduce(
                                                        (a, b) => a + b,
                                                        0
                                                    );
                                                const percentage = Math.round(
                                                    (value / total) * 100
                                                );
                                                return `${label}: ${value} đơn (${percentage}%)`;
                                            },
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto lg:p-4 py-2 px-1 flex flex-col gap-4">
            <div className="p-4 mb-2 bg-primary-4 rounded-md shadow-md shadow-secondary-100 font-bold text-secondary-200 sm:text-lg text-sm uppercase flex justify-between items-center gap-2">
                <h2 className="text-ellipsis line-clamp-1">Báo cáo thống kê</h2>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                <div
                    className="bg-primary-5 rounded-lg shadow-md shadow-secondary-100 p-3
                flex items-center gap-4"
                >
                    <div className="p-3 rounded-full border-[3px] border-secondary-200 bg-rose-100 text-secondary-200">
                        <BsCoin className="h-6 w-6" />
                    </div>
                    <div className="mt-1">
                        <p className="lg:text-[15px] text-xs text-secondary-200 font-bold">
                            Tổng doanh thu
                        </p>
                        <p className="lg:text-xl text-base font-bold text-secondary-200">
                            {DisplayPriceInVND(totalRevenue)}
                        </p>
                    </div>
                </div>
                <div
                    className="bg-primary-5 rounded-lg shadow-md shadow-secondary-100 p-3
                flex items-center gap-4"
                >
                    <div className="p-3 rounded-full border-[3px] border-blue-600 bg-blue-100 text-blue-600">
                        <FaCoins className="h-6 w-6" />
                    </div>
                    <div className="mt-1">
                        <p className="lg:text-[15px] text-xs text-secondary-200 font-bold">
                            Giá trị đơn hàng trung bình
                        </p>
                        <p className="lg:text-xl text-base font-bold text-secondary-200">
                            {orderCount > 0
                                ? DisplayPriceInVND(totalRevenue / orderCount)
                                : '0'}
                        </p>
                    </div>
                </div>
                <div
                    className="bg-primary-5 rounded-lg shadow-md shadow-secondary-100 p-3
                flex items-center gap-4"
                >
                    <div className="p-3 rounded-full border-[3px] border-white bg-secondary-200 text-white">
                        <FaFileInvoice className="h-6 w-6" />
                    </div>
                    <div className="mt-1">
                        <p className="lg:text-[15px] text-xs text-secondary-200 font-bold">
                            Tổng số đơn hàng
                        </p>
                        <p className="lg:text-xl text-base font-bold text-secondary-200">
                            {orderCount}
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
                        <p className="lg:text-[15px] text-xs text-secondary-200 font-bold">
                            Đang hiển thị
                        </p>
                        <p className="lg:text-xl text-base font-bold text-secondary-200">
                            {Math.min(
                                indexOfFirstOrder + 1,
                                filteredAndSortedOrders.length
                            )}{' '}
                            -{' '}
                            {Math.min(
                                indexOfLastOrder,
                                filteredAndSortedOrders.length
                            )}{' '}
                            / {orders.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Chart Type Selector */}
            <div className="bg-white p-4 rounded-lg border-2 border-secondary-200 shadow mb-3">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base sm:text-lg font-bold text-secondary-200">
                        Biểu đồ thống kê
                    </h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setChartType('line')}
                            className={`p-2 rounded-md ${
                                chartType === 'line'
                                    ? 'bg-gray-200 text-secondary-200'
                                    : 'bg-gray-100'
                            }`}
                            title="Biểu đồ đường"
                        >
                            <FaChartLine className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`p-2 rounded-md ${
                                chartType === 'bar'
                                    ? 'bg-gray-200 text-secondary-200'
                                    : 'bg-gray-100'
                            }`}
                            title="Biểu đồ cột"
                        >
                            <FaChartBar className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setChartType('pie')}
                            className={`p-2 rounded-md ${
                                chartType === 'pie'
                                    ? 'bg-gray-200 text-secondary-200'
                                    : 'bg-gray-100'
                            }`}
                            title="Biểu đồ trạng thái đơn hàng"
                        >
                            <FaChartPie className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="h-80">
                    {filteredAndSortedOrders.length > 0 ? (
                        renderChart()
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Không có dữ liệu để hiển thị biểu đồ
                        </div>
                    )}
                </div>
            </div>

            {/* Top Products Chart */}
            {filteredAndSortedOrders.length > 0 && (
                <div className="bg-white p-4 rounded-lg border-2 border-secondary-200 shadow mb-3">
                    <h2 className="text-base sm:text-lg font-bold mb-4 text-secondary-200">
                        Top sản phẩm bán chạy
                    </h2>
                    <div className="">
                        <Bar
                            data={chartData.productsData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) {
                                                return `Doanh thu: ${DisplayPriceInVND(
                                                    context.parsed.y
                                                )}`;
                                            },
                                        },
                                    },
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: function (value) {
                                                return DisplayPriceInVND(value);
                                            },
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Filters */}
            <div
                className="bg-white p-4 rounded-lg border-2 border-secondary-200 shadow mb-3
            flex flex-col gap-3 items-end text-sm text-secondary-200"
            >
                <div className="flex gap-2">
                    <button
                        onClick={handleResetFilters}
                        className="px-4 py-[6px] font-medium text-secondary-200 bg-white border-2 border-secondary-200 rounded-lg
                        hover:bg-secondary-200 hover:text-white flex gap-2 items-center"
                    >
                        <FaUndo size={12} className="mb-[2px]" />
                        <p>Đặt lại</p>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    <div className="relative">
                        <input
                            type="text"
                            name="search"
                            placeholder="Tìm kiếm..."
                            className="w-full pl-10 h-11 font-medium py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-1
                        focus:ring-secondary-200"
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <select
                        name="status"
                        className="w-full p-2 h-11 font-medium border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary-200 cursor-pointer"
                        value={filters.status}
                        onChange={handleFilterChange}
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        name="dateRange"
                        className="w-full p-2 h-11 font-medium border border-gray-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-secondary-200 cursor-pointer"
                        value={dateRange}
                        onChange={handleFilterChange}
                    >
                        <option value="today">Hôm nay</option>
                        <option value="yesterday">Hôm qua</option>
                        <option value="7days">7 ngày qua</option>
                        <option value="30days">30 ngày qua</option>
                        <option value="thismonth">Tháng này</option>
                        <option value="custom">Tùy chỉnh</option>
                    </select>

                    <button
                        onClick={exportToExcel}
                        className="flex items-center justify-center h-11 px-4 py-2 border border-transparent rounded-md shadow-sm sm:text-sm text-xs font-medium
                    text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <FaFileExcel className="mr-2 mb-[3px]" />
                        <p>Xuất Excel</p>
                    </button>
                </div>

                {dateRange === 'custom' && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Từ ngày
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 w-full"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Đến ngày
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 w-full"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto scrollbarCustom">
                    <div className="min-w-full" style={{ minWidth: '1024px' }}>
                        <table className="w-full divide-y-4 divide-secondary-200">
                            <thead className="bg-gray-50 text-xs">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-secondary-200 uppercase tracking-wider">
                                        <div className="flex items-center justify-center">
                                            Mã Đơn Hàng
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
                                    <th className="px-4 py-3 text-left font-bold text-secondary-200 uppercase tracking-wider">
                                        <div className="flex items-center justify-center">
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
                                    <th className="px-4 py-3 text-left font-bold text-secondary-200 uppercase tracking-wider">
                                        Khách hàng
                                    </th>
                                    <th className="px-4 py-3 text-left font-bold text-secondary-200 uppercase tracking-wider max-w-[180px]">
                                        Sản phẩm
                                    </th>
                                    <th className="px-4 py-3 text-nowrap text-left font-bold text-secondary-200 uppercase tracking-wider max-w-[180px]">
                                        Số lượng
                                    </th>
                                    <th className="px-4 py-3 text-left font-bold text-secondary-200 uppercase tracking-wider">
                                        <div className="flex items-center justify-center">
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
                                    <th className="px-4 py-3 text-left font-bold text-secondary-200 uppercase tracking-wider">
                                        <div className="flex items-center justify-center">
                                            <p className="text-nowrap">
                                                Trạng thái
                                            </p>
                                            <button
                                                onClick={() =>
                                                    handleSort('payment_status')
                                                }
                                                className="mb-1 focus:outline-none"
                                            >
                                                {renderSortIcon(
                                                    'payment_status'
                                                )}
                                            </button>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="px-6 py-4 text-center text-gray-500"
                                        >
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                ) : currentOrders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="px-6 py-4 text-center text-gray-500"
                                        >
                                            Không có dữ liệu hoá đơn
                                        </td>
                                    </tr>
                                ) : (
                                    currentOrders.map((order) => (
                                        <tr
                                            key={order._id}
                                            className="hover:bg-gray-50 sm:text-sm text-xs"
                                        >
                                            <td
                                                className="px-4 py-4 font-medium text-gray-900"
                                                title={order.orderId}
                                            >
                                                {order.orderId}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap font-medium text-secondary-200">
                                                {format(
                                                    new Date(order.createdAt),
                                                    'dd/MM/yyyy HH:mm',
                                                    {
                                                        locale: vi,
                                                    }
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {order.userId?.name ||
                                                            'Khách vãng lai'}
                                                    </div>
                                                    <p>{order.userId?.email}</p>
                                                    <p>
                                                        {
                                                            order
                                                                .delivery_address
                                                                ?.mobile
                                                        }
                                                    </p>
                                                    <p>
                                                        {
                                                            order
                                                                .delivery_address
                                                                ?.city
                                                        }
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-500 flex items-center sm:grid gap-3 max-w-[250px]">
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
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-secondary-200">
                                                {order.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-secondary-200">
                                                {DisplayPriceInVND(
                                                    order.totalAmt
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge
                                                    status={
                                                        order.payment_status
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Controls */}
                {filteredAndSortedOrders.length > 0 && (
                    <div className="px-6 py-4 border-t-4 border-secondary-200 mt-4">
                        <PaginationControls />
                    </div>
                )}

                {imageURL && (
                    <ViewImage url={imageURL} close={() => setImageURL('')} />
                )}
            </div>
        </div>
    );
};

export default ReportPage;
