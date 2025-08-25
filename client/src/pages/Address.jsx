import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGlobalContext } from '../provider/GlobalProvider';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';
import { MdDelete, MdEdit, MdRestore } from 'react-icons/md';
import AddAddress from '../components/AddAddress';
import EditAddressDetails from '../components/EditAddressDetails';

const Address = () => {
    const addressList = useSelector((state) => state.addresses.addressList);
    const [openAddress, setOpenAddress] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editData, setEditData] = useState({});
    const { fetchAddress } = useGlobalContext();

    // Sắp xếp địa chỉ hiện hoạt (status: true) với isDefault: true lên đầu
    const activeAddresses = addressList
        .filter((address) => address.status === true)
        .sort((a, b) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

    // Lấy danh sách địa chỉ đã ẩn (status: false)
    const deletedAddresses = addressList.filter(
        (address) => address.status === false
    );

    const handleDisableAddress = async (id) => {
        try {
            const response = await Axios({
                ...SummaryApi.delete_address,
                data: {
                    _id: id,
                },
            });
            if (response.data.success) {
                toast.success('Address Removed');
                if (fetchAddress) {
                    fetchAddress();
                }
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const handleRestoreAddress = async (id) => {
        try {
            const response = await Axios({
                ...SummaryApi.restore_address,
                data: {
                    _id: id,
                },
            });
            if (response.data.success) {
                toast.success('Address Restored');
                if (fetchAddress) {
                    fetchAddress();
                }
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    return (
        <div className="">
            <div className="bg-white shadow-lg px-2 py-2 flex justify-between gap-4 items-center">
                <h2 className="font-semibold text-ellipsis line-clamp-1">
                    Địa chỉ
                </h2>
                <button
                    onClick={() => setOpenAddress(true)}
                    className="border border-primary-200 text-primary-200 px-3 hover:bg-primary-200 hover:text-black py-1 rounded-full"
                >
                    Thêm Địa chỉ
                </button>
            </div>

            {/* Danh sách địa chỉ hiện hoạt */}
            <div className="bg-blue-50 p-2 grid gap-4">
                <h3 className="font-semibold">Địa chỉ hiện hoạt</h3>
                {activeAddresses.length === 0 ? (
                    <p className="text-gray-500">Không có địa chỉ hiện hoạt</p>
                ) : (
                    activeAddresses.map((address, index) => (
                        <div
                            key={index}
                            className="border rounded p-3 flex gap-3 bg-white"
                        >
                            <div className="w-full">
                                <p>{address.address_line}</p>
                                <p>{address.city}</p>
                                <p>{address.state}</p>
                                <p>{address.country}</p>
                                <p>{address.mobile}</p>
                                {address.isDefault && (
                                    <span className="text-green-600 text-sm font-semibold">
                                        (Mặc định)
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <button
                                    onClick={() => {
                                        setOpenEdit(true);
                                        setEditData(address);
                                    }}
                                    className="bg-green-200 p-2 rounded hover:text-white hover:bg-green-600"
                                >
                                    <MdEdit size={18} />
                                </button>
                                <button
                                    onClick={() =>
                                        handleDisableAddress(address._id)
                                    }
                                    className="bg-red-200 p-2 rounded hover:text-white hover:bg-red-600"
                                >
                                    <MdDelete size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
                <div
                    onClick={() => setOpenAddress(true)}
                    className="h-16 bg-blue-50 border-2 border-dashed flex justify-center items-center cursor-pointer"
                >
                    Thêm địa chỉ
                </div>
            </div>

            {/* Danh sách địa chỉ đã xóa */}
            {deletedAddresses.length > 0 && (
                <div className="bg-blue-50 p-2 grid gap-4 mt-4">
                    <h3 className="font-semibold">Địa chỉ đã xóa</h3>
                    {deletedAddresses.map((address, index) => (
                        <div
                            key={index}
                            className="border rounded p-3 flex gap-3 bg-gray-100 opacity-75"
                        >
                            <div className="w-full">
                                <p>{address.address_line}</p>
                                <p>{address.city}</p>
                                <p>{address.state}</p>
                                <p>{address.country}</p>
                                <p>{address.mobile}</p>
                                {address.isDefault && (
                                    <span className="text-green-600 text-sm font-semibold">
                                        (Mặc định)
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <button
                                    onClick={() =>
                                        handleRestoreAddress(address._id)
                                    }
                                    className="bg-blue-200 p-2 rounded hover:text-white hover:bg-blue-600"
                                >
                                    <MdRestore size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {openAddress && <AddAddress close={() => setOpenAddress(false)} />}

            {openEdit && (
                <EditAddressDetails
                    data={editData}
                    close={() => setOpenEdit(false)}
                />
            )}
        </div>
    );
};

export default Address;
