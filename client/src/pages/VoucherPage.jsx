import React, { useEffect, useState } from 'react';
import { IoAdd, IoPencil, IoTrash, IoCalendar, IoClose } from 'react-icons/io5';
import { format } from 'date-fns';
import NoData from './../components/NoData';
import Loading from './../components/Loading';
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
    const [openUploadVoucher, setOpenUploadVoucher] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [openEditVoucher, setOpenEditVoucher] = useState(false);
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
    const [deleteVoucher, setDeleteVoucher] = useState({
        _id: '',
    });

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
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVoucher();
    }, []);

    const handleToggleStatus = async (voucher) => {
        try {
            const response = await Axios({
                ...SummaryApi.update_voucher,
                data: {
                    ...voucher,
                    isActive: !voucher.isActive,
                },
            });

            const { data: responseData } = response;

            if (responseData.success) {
                successAlert(responseData.message);
                fetchVoucher();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const handleDeleteVoucher = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.delete_voucher,
                data: deleteVoucher,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                successAlert(responseData.message);
                fetchVoucher();
                setOpenConfirmBoxDelete(false);
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text('Voucher List', 20, 10);
        autoTable(doc, {
            head: [
                [
                    'Code',
                    'Name',
                    'Discount',
                    'Start Date',
                    'End Date',
                    'Status',
                ],
            ],
            body: data.map((voucher) => {
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

    return (
        <section className="bg-white p-4 rounded-lg">
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
                            setOpenUploadVoucher(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <IoAdd size={20} />
                        Add Voucher
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            {/* <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search vouchers..."
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <IoSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
            </div> */}

            {/* Vouchers Table */}
            {loading ? (
                <Loading />
            ) : data.length === 0 ? (
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
                            {data.map((voucher) => {
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
                                                    <span className="ml-2 px-2 py-1 text-xs rounded-full shadow-lg bg-gray-100">
                                                        {!voucher.isActive ? (
                                                            <p className="text-gray-600">
                                                                Inactive
                                                            </p>
                                                        ) : new Date(
                                                              voucher.startDate
                                                          ) > new Date() ? (
                                                            <p className="text-yellow-600">
                                                                Upcoming
                                                            </p>
                                                        ) : (
                                                            <p className="text-secondary-200">
                                                                Expired
                                                            </p>
                                                        )}
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
                                                    ? `${
                                                          voucher.usageCount ||
                                                          0
                                                      }/${
                                                          voucher.usageLimit
                                                      } uses`
                                                    : 'Unlimited uses'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={voucher.isActive}
                                                    onChange={() =>
                                                        handleToggleStatus(
                                                            voucher
                                                        )
                                                    }
                                                />
                                                <div
                                                    className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full
                                                peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                                    voucher.isActive
                                                        ? 'bg-green-300'
                                                        : 'bg-gray-300'
                                                }`}
                                                ></div>
                                                <span className="ml-2 text-sm font-medium text-gray-900">
                                                    {voucher.isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </label>
                                            {!isActive && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(
                                                        voucher.startDate
                                                    ) > new Date()
                                                        ? 'Chưa đến ngày bắt đầu'
                                                        : new Date(
                                                              voucher.endDate
                                                          ) < new Date()
                                                        ? 'Đã hết hạn'
                                                        : 'Đã tắt'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenEditVoucher(true);
                                                    setEditFormData(voucher);
                                                }}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                <IoPencil />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenConfirmBoxDelete(
                                                        true
                                                    );
                                                    setDeleteVoucher(voucher);
                                                }}
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

            {openUploadVoucher && (
                <AddVoucher
                    fetchVoucher={fetchVoucher}
                    close={() => setOpenUploadVoucher(false)}
                />
            )}

            {openEditVoucher && (
                <EditVoucher
                    fetchData={fetchVoucher}
                    data={editFormData}
                    close={() => setOpenEditVoucher(false)}
                />
            )}

            {openConfirmBoxDelete && (
                <ConfirmBox
                    confirm={handleDeleteVoucher}
                    cancel={() => setOpenConfirmBoxDelete(false)}
                    close={() => setOpenConfirmBoxDelete(false)}
                    title="Xóa voucher"
                    message="Bạn có chắc chắn muốn xóa voucher này?"
                    confirmText="Xóa"
                    cancelText="Hủy"
                />
            )}
        </section>
    );
};

export default VoucherPage;
