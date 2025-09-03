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
} from 'react-icons/fa';
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
                const yesterday = subDays(today, 1);
                startDate = format(yesterday, 'yyyy-MM-dd');
                endDate = format(yesterday, 'yyyy-MM-dd');
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
                if (filters.startDate && filters.endDate) {
                    startDate = filters.startDate;
                    endDate = filters.endDate;
                } else {
                    startDate = '';
                    endDate = '';
                }
                break;
            default:
                startDate = '';
                endDate = '';
        }

        setFilters((prev) => ({
            ...prev,
            startDate,
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
            result = result.filter((order) => order.payment_status === filters.status);
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

    const { totalRevenue, orderCount, averageOrderValue } =
        React.useMemo(() => {
            return filteredAndSortedOrders.reduce(
                (acc, order) => ({
                    totalRevenue: acc.totalRevenue + (order.totalAmt || 0),
                    orderCount: acc.orderCount + 1,
                }),
                { totalRevenue: 0, orderCount: 0, averageOrderValue: 0 }
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
                labels: Object.values(ordersByDate).map(item => item.date),
                datasets: [
                    {
                        label: 'Doanh thu',
                        data: Object.values(ordersByDate).map(item => item.total),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        yAxisID: 'y',
                    },
                    {
                        label: 'Số đơn hàng',
                        data: Object.values(ordersByDate).map(item => item.count),
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
                labels: topProducts.map(item => item.name),
                datasets: [
                    {
                        label: 'Doanh thu',
                        data: topProducts.map(item => item.total),
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
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.dataset.yAxisID === 'y1' 
                                ? context.parsed.y + ' đơn' 
                                : DisplayPriceInVND(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Doanh thu (VND)'
                }
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
                    text: 'Số đơn hàng'
                }
            }
        }
    };

    const renderChart = () => {
        switch (chartType) {
            case 'bar':
                return (
                    <Bar 
                        data={chartData.salesData} 
                        options={chartOptions} 
                    />
                );
            case 'line':
                return (
                    <Line 
                        data={chartData.salesData} 
                        options={chartOptions} 
                    />
                );
            case 'pie':
                return (
                    <div className="max-w-md mx-auto">
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
                                            label: function(context) {
                                                const label = context.label || '';
                                                const value = context.raw || 0;
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = Math.round((value / total) * 100);
                                                return `${label}: ${value} đơn (${percentage}%)`;
                                            }
                                        }
                                    }
                                }
                            }} 
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Báo cáo đơn hàng</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">
                        Tổng doanh thu
                    </h3>
                    <p className="text-2xl font-bold">
                        {DisplayPriceInVND(totalRevenue)}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">
                        Tổng số đơn hàng
                    </h3>
                    <p className="text-2xl font-bold">{orderCount}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">
                        Giá trị đơn hàng trung bình
                    </h3>
                    <p className="text-2xl font-bold">
                        {orderCount > 0
                            ? DisplayPriceInVND(totalRevenue / orderCount)
                            : '0'}
                    </p>
                </div>
            </div>

            {/* Chart Type Selector */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Biểu đồ thống kê</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setChartType('line')}
                            className={`p-2 rounded-md ${chartType === 'line' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                            title="Đường kẻ"
                        >
                            <FaChartLine className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`p-2 rounded-md ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                            title="Cột"
                        >
                            <FaChartBar className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setChartType('pie')}
                            className={`p-2 rounded-md ${chartType === 'pie' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                            title="Tròn"
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
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-lg font-semibold mb-4">Top sản phẩm bán chạy</h2>
                    <div className="h-80">
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
                                            label: function(context) {
                                                return `Doanh thu: ${DisplayPriceInVND(context.parsed.y)}`;
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: function(value) {
                                                return DisplayPriceInVND(value);
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="search"
                            placeholder="Tìm kiếm..."
                            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <select
                        name="status"
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

                    <div className="flex gap-2">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <FaFileExcel className="mr-2" />
                            Xuất Excel
                        </button>
                    </div>
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
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('orderId')}
                                >
                                    <div className="flex items-center">
                                        Mã đơn hàng
                                        {renderSortIcon('orderId')}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div className="flex items-center">
                                        Ngày tạo
                                        {renderSortIcon('createdAt')}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Khách hàng
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Sản phẩm
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Số lượng
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('totalAmt')}
                                >
                                    <div className="flex items-center">
                                        Tổng tiền
                                        {renderSortIcon('totalAmt')}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('payment_status')}
                                >
                                    <div className="flex items-center">
                                        Trạng thái thanh toán
                                        {renderSortIcon('payment_status')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="px-6 py-4 text-center"
                                    >
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredAndSortedOrders.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="px-6 py-4 text-center text-gray-500"
                                    >
                                        Không có dữ liệu đơn hàng
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedOrders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {order.orderId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(
                                                new Date(order.createdAt),
                                                'dd/MM/yyyy HH:mm',
                                                {
                                                    locale: vi,
                                                }
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.userId?.name ||
                                                'Khách vãng lai'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.product_details?.name || ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {DisplayPriceInVND(order.totalAmt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge
                                                status={order.payment_status}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportPage;
