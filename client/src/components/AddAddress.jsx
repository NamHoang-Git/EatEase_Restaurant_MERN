import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useGlobalContext } from '../provider/GlobalProvider';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';
import { IoClose } from 'react-icons/io5';
import vietnamProvinces from '../data/vietnam-provinces.json';
import Select from 'react-select';

const AddAddress = ({ close }) => {
    const { register, handleSubmit, reset, setValue } = useForm();
    const { fetchAddress } = useGlobalContext();
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);

    const removeAccents = (str) => {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    };

    const removePrefix = (name) => {
        const prefixes = [
            'Thành phố ',
            'Tỉnh ',
            'Quận ',
            'Huyện ',
            'Phường ',
            'Xã ',
        ];
        let cleanedName = name;
        for (const prefix of prefixes) {
            if (cleanedName.startsWith(prefix)) {
                cleanedName = cleanedName.replace(prefix, '');
                break;
            }
        }
        return cleanedName;
    };

    const customFilter = (option, searchText) => {
        if (!searchText) return true;
        const searchTerm = removeAccents(searchText.toLowerCase());
        const cleanedLabel = removeAccents(
            removePrefix(option.label).toLowerCase()
        );
        return cleanedLabel.startsWith(searchTerm);
    };

    // Lay danh sach tinh/thanh pho
    useEffect(() => {
        const provincesWithCode = vietnamProvinces.map((province, index) => ({
            ...province,
            code: index.toString(),
        }));
        setProvinces(provincesWithCode);
    }, []);

    // Lay danh sach quan/huyen khi chon tinh/thanh pho
    useEffect(() => {
        if (selectedProvince) {
            const provinceIndex = parseInt(selectedProvince.value);
            const province = vietnamProvinces[provinceIndex];
            if (province && province.districts) {
                const districtsWithCode = province.districts.map(
                    (district, index) => ({
                        ...district,
                        code: index.toString(),
                    })
                );
                setDistricts(districtsWithCode);
                setWards([]);
                setSelectedDistrict(null);
                setValue('district', '');
                setValue('ward', '');
            } else {
                setDistricts([]);
                setWards([]);
                setSelectedDistrict(null);
                setValue('district', '');
                setValue('ward', '');
            }
        } else {
            setDistricts([]);
            setWards([]);
            setSelectedDistrict(null);
            setValue('district', '');
            setValue('ward', '');
        }
    }, [selectedProvince, setValue]);

    // Lay danh sach phuong/xa khi chon quan/huyen
    useEffect(() => {
        if (selectedDistrict && selectedProvince) {
            const provinceIndex = parseInt(selectedProvince.value);
            const districtIndex = parseInt(selectedDistrict.value);
            const province = vietnamProvinces[provinceIndex];
            if (
                province &&
                province.districts &&
                province.districts[districtIndex]
            ) {
                const district = province.districts[districtIndex];
                const wardsWithCode = (district.wards || []).map(
                    (ward, index) => ({
                        ...ward,
                        code: index.toString(),
                    })
                );
                setWards(wardsWithCode);
            } else {
                setWards([]);
            }
        } else {
            setWards([]);
        }
    }, [selectedDistrict, selectedProvince]);

    const onSubmit = async (data) => {
        try {
            const provinceName = selectedProvince ? selectedProvince.label : '';
            const districtName = selectedDistrict ? selectedDistrict.label : '';
            const wardName =
                data.ward !== '' ? wards[parseInt(data.ward)]?.name || '' : '';

            const response = await Axios({
                ...SummaryApi.add_address,
                data: {
                    address_line: data.addressline,
                    city: provinceName,
                    district: districtName,
                    ward: wardName,
                    country: 'Việt Nam',
                    mobile: data.mobile,
                    isDefault: !!data.isDefault,
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
        <section
            className="bg-neutral-800 z-50 bg-opacity-60 fixed top-0 left-0 right-0 bottom-0 overflow-auto
        flex items-center justify-center px-3"
        >
            <div
                className="bg-white px-4 py-6 w-full max-w-xl mx-auto rounded-md shadow-md
                flex flex-col gap-4"
            >
                <div className="flex justify-between items-center gap-4">
                    <h2 className="font-semibold text-lg text-secondary-200">
                        Thêm Địa Chỉ
                    </h2>
                    <button
                        onClick={close}
                        className="hover:text-secondary-100 text-secondary-200"
                    >
                        <IoClose size={25} />
                    </button>
                </div>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid gap-4 sm:text-base text-sm font-medium"
                >
                    <div className="grid gap-1">
                        <label htmlFor="addressline">Địa chỉ:</label>
                        <input
                            type="text"
                            id="addressline"
                            autoFocus
                            className="border-2 bg-base-100 p-2 rounded outline-none
                        focus-within:border-secondary-100"
                            {...register('addressline', { required: true })}
                            spellCheck={false}
                        />
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="city">Tỉnh/Thành phố:</label>
                        <Select
                            options={provinces.map((province) => ({
                                value: province.code,
                                label: province.name,
                            }))}
                            value={selectedProvince}
                            onChange={(selected) => {
                                setSelectedProvince(selected);
                                setValue(
                                    'city',
                                    selected ? selected.value : ''
                                );
                            }}
                            filterOption={customFilter}
                            placeholder="Nhập Tỉnh/Thành phố"
                            isSearchable
                            isClearable
                        />
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="district">Quận/Huyện:</label>
                        <Select
                            options={districts.map((district) => ({
                                value: district.code,
                                label: district.name,
                            }))}
                            value={selectedDistrict}
                            onChange={(selected) => {
                                setSelectedDistrict(selected);
                                setValue(
                                    'district',
                                    selected ? selected.value : ''
                                );
                            }}
                            filterOption={customFilter}
                            placeholder="Nhập Quận/Huyện"
                            isSearchable
                            isClearable
                            isDisabled={!selectedProvince}
                        />
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="ward">Phường/Xã:</label>
                        <Select
                            options={wards.map((ward) => ({
                                value: ward.code,
                                label: ward.name,
                            }))}
                            onChange={(selected) =>
                                setValue('ward', selected ? selected.value : '')
                            }
                            filterOption={customFilter}
                            placeholder="Nhập Phường/Xã"
                            isSearchable
                            isClearable
                            isDisabled={!selectedDistrict}
                        />
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="mobile">Số điện thoại:</label>
                        <input
                            type="text"
                            id="mobile"
                            className="border-2 bg-base-100 p-2 rounded outline-none
                        focus-within:border-secondary-100"
                            {...register('mobile', {
                                required: true,
                                pattern: {
                                    value: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
                                    message: 'Số điện thoại không hợp lệ',
                                },
                            })}
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            className="h-4 w-4 mb-[3px]"
                            checked={true}
                            {...register('isDefault')}
                        />
                        <label
                            htmlFor="isDefault"
                            className="font-normal text-slate-600"
                        >
                            Đặt làm địa chỉ mặc định
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="py-2 px-4 mt-2 bg-primary-2 hover:opacity-80 rounded shadow-md
                    cursor-pointer text-secondary-200 font-semibold"
                    >
                        Thêm
                    </button>
                </form>
            </div>
        </section>
    );
};

export default AddAddress;
