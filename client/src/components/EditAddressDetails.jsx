import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useGlobalContext } from '../provider/GlobalProvider';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import { IoClose } from 'react-icons/io5';
import vietnamProvinces from '../data/vietnam-provinces.json';
import Select from 'react-select';
import AxiosToastError from '../utils/AxiosToastError';

const EditAddressDetails = ({ close, data }) => {
    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            _id: data._id,
            userId: data.userId,
            address_line: data.address_line,
            city: data.city,
            district: data.district,
            ward: data.ward,
            country: 'Việt Nam',
            mobile: data.mobile,
            isDefault: data.isDefault || false,
        },
    });
    const { fetchAddress } = useGlobalContext();
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    // const selectedWard = watch('ward');

    // Hàm bỏ dấu tiếng Việt
    const removeAccents = (str) => {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    };

    // Hàm loại bỏ tiền tố
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

    // Tùy chỉnh hàm lọc cho React Select
    const customFilter = (option, searchText) => {
        if (!searchText) return true;
        const searchTerm = removeAccents(searchText.toLowerCase());
        const cleanedLabel = removeAccents(
            removePrefix(option.label).toLowerCase()
        );
        return cleanedLabel.startsWith(searchTerm);
    };

    // Cập nhật lại useEffect khởi tạo dữ liệu tỉnh/thành phố
    useEffect(() => {
        const provincesWithCode = vietnamProvinces.map((province, index) => ({
            ...province,
            code: index.toString(),
            value: index.toString(),
            label: province.name,
        }));
        setProvinces(provincesWithCode);

        // Tự động chọn tỉnh/thành phố nếu có trong dữ liệu
        if (data.city) {
            const province = provincesWithCode.find(
                (p) => p.name === data.city
            );
            if (province) {
                setSelectedProvince(province);
                setValue('city', province.name);
            }
        }
    }, [data.city, setValue]);

    // Update districts when selectedProvince changes
    useEffect(() => {
        if (selectedProvince) {
            const provinceIndex = parseInt(selectedProvince.value);
            const province = vietnamProvinces[provinceIndex];

            if (province?.districts) {
                const districtsWithCode = province.districts.map(
                    (district, index) => ({
                        ...district,
                        code: index.toString(),
                        value: index.toString(),
                        label: district.name,
                    })
                );
                setDistricts(districtsWithCode);

                // Tự động chọn quận/huyện nếu có trong dữ liệu
                if (data.district) {
                    const district = districtsWithCode.find(
                        (d) => d.name === data.district
                    );
                    if (district) {
                        setSelectedDistrict(district);
                        setValue('district', district.name);
                    }
                }
            }
        } else {
            setDistricts([]);
            setWards([]);
            setSelectedDistrict(null);
            setValue('district', '');
            setValue('ward', '');
        }
    }, [selectedProvince, data.district, setValue]);

    // Update wards when selectedDistrict changes
    useEffect(() => {
        if (selectedProvince && selectedDistrict) {
            const provinceIndex = parseInt(selectedProvince.value);
            const districtIndex = parseInt(selectedDistrict.value);
            const province = vietnamProvinces[provinceIndex];

            if (province?.districts?.[districtIndex]?.wards) {
                const wardsWithCode = province.districts[
                    districtIndex
                ].wards.map((ward, index) => ({
                    ...ward,
                    code: index.toString(),
                    value: index.toString(),
                    label: ward.name,
                }));
                setWards(wardsWithCode);

                // If we have a ward in data, try to find and select it
                if (data.ward) {
                    const ward = wardsWithCode.find(
                        (w) => w.name === data.ward
                    );
                    if (ward) {
                        // Small timeout to ensure state is updated before setting the value
                        setTimeout(() => {
                            setValue('ward', ward.code);
                        }, 0);
                    }
                }
            } else {
                setWards([]);
                setValue('ward', '');
            }
        } else {
            setWards([]);
            setValue('ward', '');
        }
    }, [selectedDistrict, selectedProvince, data.ward, setValue]);

    // Handle initial ward selection when wards are loaded
    useEffect(() => {
        if (wards.length > 0 && data.ward) {
            const ward = wards.find((w) => w.name === data.ward);
            if (ward) {
                setValue('ward', ward.code);
            }
        }
    }, [wards, data.ward, setValue]);

    const onSubmit = async (formData) => {
        try {
            const provinceName = selectedProvince ? selectedProvince.label : '';
            const districtName = selectedDistrict ? selectedDistrict.label : '';
            const wardName =
                formData.ward !== ''
                    ? wards[parseInt(formData.ward)]?.name || ''
                    : '';

            const response = await Axios({
                ...SummaryApi.update_address,
                data: {
                    _id: formData._id,
                    userId: formData.userId,
                    address_line: formData.address_line,
                    city: provinceName,
                    district: districtName,
                    ward: wardName,
                    country: formData.country,
                    mobile: formData.mobile,
                    isDefault: !!formData.isDefault,
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
            onClick={close}
            className="bg-neutral-800 z-50 bg-opacity-60 fixed top-0 left-0 right-0 bottom-0 overflow-auto
        flex items-center justify-center px-2"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white px-4 py-6 w-full max-w-xl mx-auto rounded-md shadow-md
            flex flex-col gap-4"
            >
                <div className="flex justify-between items-center gap-4">
                    <h2 className="font-semibold text-lg text-secondary-200">
                        Chỉnh Sửa Địa Chỉ
                    </h2>
                    <button
                        onClick={close}
                        className="hover:text-secondary-200"
                    >
                        <IoClose size={25} />
                    </button>
                </div>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid gap-4 text-base font-medium"
                >
                    <div className="grid gap-1">
                        <label htmlFor="addressline">Địa chỉ chi tiết:</label>
                        <input
                            type="text"
                            id="addressline"
                            className="border-2 bg-base-100 p-2 rounded outline-none
                        focus-within:border-secondary-100"
                            {...register('address_line', { required: true })}
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
                                    selected ? selected.label : ''
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
                                    selected ? selected.label : ''
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
                            options={wards}
                            value={wards.find((w) => w.code === watch('ward'))}
                            onChange={(selected) => {
                                setValue('ward', selected ? selected.code : '');
                            }}
                            getOptionLabel={(option) => option.name}
                            getOptionValue={(option) => option.code}
                            placeholder="Chọn Phường/Xã"
                            isSearchable
                            isClearable
                            isDisabled={!selectedDistrict}
                            noOptionsMessage={() => 'Không có dữ liệu'}
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
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            className="h-4 w-4"
                            disabled={data.isDefault}
                            checked={watch('isDefault')}
                            onChange={(e) =>
                                setValue('isDefault', e.target.checked)
                            }
                        />
                        <label
                            htmlFor="isDefault"
                            className={`font-normal ${
                                data.isDefault
                                    ? 'text-gray-400'
                                    : 'text-slate-600'
                            }`}
                        >
                            {data.isDefault
                                ? 'Địa chỉ mặc định'
                                : 'Đặt làm địa chỉ mặc định'}
                        </label>
                        {data.isDefault && (
                            <span className="text-base text-primary-200 ml-2">
                                (Đang là mặc định)
                            </span>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="py-2 px-4 mt-2 bg-primary-2 hover:opacity-80 rounded shadow-md
                    cursor-pointer text-secondary-200 font-semibold"
                    >
                        Cập nhật
                    </button>
                </form>
            </div>
        </section>
    );
};

export default EditAddressDetails;
