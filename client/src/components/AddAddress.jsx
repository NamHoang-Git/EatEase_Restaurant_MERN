import React from 'react';
import { useForm } from 'react-hook-form';
import { useGlobalContext } from '../provider/GlobalProvider';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';
import { IoClose } from 'react-icons/io5';

const AddAddress = ({ close }) => {
    const { register, handleSubmit, reset } = useForm();
    const { fetchAddress } = useGlobalContext();

    // Dữ liệu mẫu cho select (thay thế bằng nguồn dữ liệu thực tế nếu cần)
    const cities = [
        'Hà Nội',
        'TP Hồ Chí Minh',
        'Đà Nẵng',
        'Hải Phòng',
        'Cần Thơ',
    ];
    const states = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];
    const countries = ['Việt Nam', 'Thái Lan', 'Singapore', 'Malaysia'];

    const onSubmit = async (data) => {
        try {
            const response = await Axios({
                ...SummaryApi.add_address,
                data: {
                    address_line: data.addressline,
                    city: data.city,
                    state: data.state,
                    country: data.country,
                    mobile: data.mobile,
                    isDefault: !!data.isDefault, // Chỉ gửi true nếu checkbox được chọn
                },
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message);
                if (close) {
                    close();
                    reset();
                    fetchAddress();
                }
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    return (
        <section className="bg-black fixed top-0 left-0 right-0 bottom-0 z-50 bg-opacity-70 h-screen overflow-auto">
            <div className="bg-white p-4 w-full max-w-xl mt-12 mx-auto rounded">
                <div className="flex justify-between items-center gap-4">
                    <h2 className="font-semibold">Thêm Địa Chỉ</h2>
                    <button onClick={close} className="hover:text-red-500">
                        <IoClose size={25} />
                    </button>
                </div>
                <div className="mt-4 grid gap-4">
                    <div className="grid gap-1">
                        <label htmlFor="addressline">Địa chỉ chi tiết:</label>
                        <input
                            type="text"
                            id="addressline"
                            className="border bg-blue-50 p-2 rounded"
                            {...register('addressline', { required: true })}
                        />
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="city">Thành phố:</label>
                        <select
                            id="city"
                            className="border bg-blue-50 p-2 rounded"
                            {...register('city', { required: true })}
                        >
                            <option value="">Chọn Thành phố</option>
                            {cities.map((city) => (
                                <option key={city} value={city}>
                                    {city}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="state">Khu vực:</label>
                        <select
                            id="state"
                            className="border bg-blue-50 p-2 rounded"
                            {...register('state', { required: true })}
                        >
                            <option value="">Chọn Khu vực</option>
                            {states.map((state) => (
                                <option key={state} value={state}>
                                    {state}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="country">Quốc gia:</label>
                        <select
                            id="country"
                            className="border bg-blue-50 p-2 rounded"
                            {...register('country', { required: true })}
                        >
                            <option value="">Chọn Quốc gia</option>
                            {countries.map((country) => (
                                <option key={country} value={country}>
                                    {country}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="mobile">Số điện thoại:</label>
                        <input
                            type="text"
                            id="mobile"
                            className="border bg-blue-50 p-2 rounded"
                            {...register('mobile', { required: true })}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            className="h-4 w-4"
                            {...register('isDefault')}
                        />
                        <label htmlFor="isDefault">
                            Đặt làm địa chỉ mặc định
                        </label>
                    </div>
                    <button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        className="bg-primary-200 w-full py-2 font-semibold mt-4 rounded hover:bg-primary-100"
                    >
                        Gửi
                    </button>
                </div>
            </div>
        </section>
    );
};

export default AddAddress;
