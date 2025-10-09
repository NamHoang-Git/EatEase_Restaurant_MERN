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
    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            isDefault: true, // Set default value to true
        },
    });
    const { fetchAddress } = useGlobalContext();
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [formErrors, setFormErrors] = useState({
        addressline: '',
        city: '',
        district: '',
        ward: '',
        mobile: '',
    });

    const validateField = (name, value) => {
        const newErrors = { ...formErrors };
        let isValid = true;
        let mobileRegex;

        switch (name) {
            case 'mobile':
                mobileRegex = /^(0[1-9]|0[1-9][0-9]{8})$/;
                if (!value) {
                    newErrors.mobile = 'Vui lòng nhập số điện thoại';
                    isValid = false;
                } else if (!mobileRegex.test(value)) {
                    newErrors.mobile = 'Số điện thoại không hợp lệ';
                    isValid = false;
                } else {
                    newErrors.mobile = '';
                }
                break;
            case 'addressline':
                if (!value) {
                    newErrors.addressline = 'Vui lòng nhập địa chỉ';
                    isValid = false;
                } else {
                    newErrors.addressline = '';
                }
                break;
            case 'city':
                if (!value) {
                    newErrors.city = 'Vui lòng chọn Tỉnh/Thành phố';
                    isValid = false;
                } else {
                    newErrors.city = '';
                }
                break;
            case 'district':
                if (!value) {
                    newErrors.district = 'Vui lòng chọn Quận/Huyện';
                    isValid = false;
                } else {
                    newErrors.district = '';
                }
                break;
            case 'ward':
                if (!value) {
                    newErrors.ward = 'Vui lòng chọn Phường/Xã';
                    isValid = false;
                } else {
                    newErrors.ward = '';
                }
                break;
            default:
                break;
        }

        setFormErrors(newErrors);
        return isValid;
    };

    const validateForm = (formData) => {
        const fieldsToValidate = [
            'addressline',
            'city',
            'district',
            'ward',
            'mobile',
        ];
        let isFormValid = true;

        fieldsToValidate.forEach((field) => {
            const isValid = validateField(field, formData[field]);
            if (!isValid) {
                isFormValid = false;
            }
        });

        return isFormValid;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setValue(name, value);
        if (formErrors[name]) {
            validateField(name, value);
        }
    };

    const handleSelectChange = (field, selected) => {
        setValue(field, selected ? selected.value : '');
        if (field === 'city') {
            setSelectedProvince(selected);
            setDistricts([]);
            setWards([]);
            setSelectedDistrict(null);
            setValue('district', '');
            setValue('ward', '');
        } else if (field === 'district') {
            setSelectedDistrict(selected);
            setWards([]);
            setValue('ward', '');
        }
        if (formErrors[field]) {
            validateField(field, selected ? selected.value : '');
        }
    };

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
        // Validate all fields before submission
        if (!validateForm(data)) {
            return;
        }

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
                        <label htmlFor="addressline">
                            Địa chỉ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="addressline"
                            autoFocus
                            className={`w-full p-2 border-2 rounded outline-none ${
                                formErrors.addressline
                                    ? 'border-red-500'
                                    : 'focus-within:border-secondary-100'
                            }`}
                            {...register('addressline', {
                                required: true,
                                onChange: handleInputChange,
                                onBlur: (e) =>
                                    validateField(
                                        'addressline',
                                        e.target.value
                                    ),
                            })}
                            spellCheck={false}
                        />
                        {formErrors.addressline && (
                            <p className="mt-1 text-sm text-red-600">
                                {formErrors.addressline}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="city">
                            Tỉnh/Thành phố{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={provinces.map((province) => ({
                                value: province.code,
                                label: province.name,
                            }))}
                            value={selectedProvince}
                            onChange={(selected) =>
                                handleSelectChange('city', selected)
                            }
                            onBlur={() =>
                                validateField(
                                    'city',
                                    selectedProvince?.value || ''
                                )
                            }
                            filterOption={customFilter}
                            placeholder="Nhập Tỉnh/Thành phố"
                            isSearchable
                            isClearable
                            className={`${
                                formErrors.city ? 'border-red-500' : ''
                            } w-full`}
                            classNamePrefix="select"
                            styles={{
                                control: (provided, state) => ({
                                    ...provided,
                                    borderColor: formErrors.city
                                        ? '#ef4444'
                                        : state.isFocused
                                        ? '#9ca3af'
                                        : '#e5e7eb',
                                    '&:hover': {
                                        borderColor: formErrors.city
                                            ? '#ef4444'
                                            : state.isFocused
                                            ? '#9ca3af'
                                            : '#e5e7eb',
                                    },
                                    boxShadow: 'none',
                                    minHeight: '40px',
                                }),
                            }}
                        />
                        {formErrors.city && (
                            <p className="mt-1 text-sm text-red-600">
                                {formErrors.city}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="district">
                            Quận/Huyện <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={districts.map((district) => ({
                                value: district.code,
                                label: district.name,
                            }))}
                            value={selectedDistrict}
                            onChange={(selected) =>
                                handleSelectChange('district', selected)
                            }
                            onBlur={() =>
                                validateField(
                                    'district',
                                    selectedDistrict?.value || ''
                                )
                            }
                            filterOption={customFilter}
                            placeholder="Nhập Quận/Huyện"
                            isSearchable
                            isClearable
                            isDisabled={!selectedProvince}
                            className={`${
                                formErrors.district ? 'border-red-500' : ''
                            } w-full`}
                            classNamePrefix="select"
                            styles={{
                                control: (provided, state) => ({
                                    ...provided,
                                    borderColor: formErrors.district
                                        ? '#ef4444'
                                        : state.isFocused
                                        ? '#9ca3af'
                                        : '#e5e7eb',
                                    '&:hover': {
                                        borderColor: formErrors.district
                                            ? '#ef4444'
                                            : state.isFocused
                                            ? '#9ca3af'
                                            : '#e5e7eb',
                                    },
                                    boxShadow: 'none',
                                    minHeight: '40px',
                                }),
                            }}
                        />
                        {formErrors.district && (
                            <p className="mt-1 text-sm text-red-600">
                                {formErrors.district}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="ward">
                            Phường/Xã <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={wards.map((ward) => ({
                                value: ward.code,
                                label: ward.name,
                            }))}
                            onChange={(selected) => {
                                setValue(
                                    'ward',
                                    selected ? selected.value : ''
                                );
                                if (formErrors.ward) {
                                    validateField(
                                        'ward',
                                        selected ? selected.value : ''
                                    );
                                }
                            }}
                            onBlur={() =>
                                validateField('ward', watch('ward') || '')
                            }
                            filterOption={customFilter}
                            placeholder="Nhập Phường/Xã"
                            isSearchable
                            isClearable
                            isDisabled={!selectedDistrict}
                            className={`${
                                formErrors.ward ? 'border-red-500' : ''
                            } w-full`}
                            classNamePrefix="select"
                            styles={{
                                control: (provided, state) => ({
                                    ...provided,
                                    borderColor: formErrors.ward
                                        ? '#ef4444'
                                        : state.isFocused
                                        ? '#9ca3af'
                                        : '#e5e7eb',
                                    '&:hover': {
                                        borderColor: formErrors.ward
                                            ? '#ef4444'
                                            : state.isFocused
                                            ? '#9ca3af'
                                            : '#e5e7eb',
                                    },
                                    boxShadow: 'none',
                                    minHeight: '40px',
                                }),
                            }}
                        />
                        {formErrors.ward && (
                            <p className="mt-1 text-sm text-red-600">
                                {formErrors.ward}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-1">
                        <label htmlFor="mobile">
                            Số điện thoại{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="tel"
                                id="mobile"
                                placeholder="Nhập số điện thoại"
                                className={`w-full p-2 border-2 rounded outline-none ${
                                    formErrors.mobile
                                        ? 'border-red-500'
                                        : 'focus-within:border-secondary-100'
                                }`}
                                {...register('mobile', {
                                    required: 'Vui lòng nhập số điện thoại',
                                    pattern: {
                                        value: /^(0[1-9]|0[1-9][0-9]{8})$/,
                                        message: 'Số điện thoại không hợp lệ',
                                    },
                                    onChange: (e) => {
                                        const value = e.target.value;
                                        setValue('mobile', value);
                                        if (formErrors.mobile) {
                                            validateField('mobile', value);
                                        }
                                    },
                                    onBlur: (e) =>
                                        validateField('mobile', e.target.value),
                                })}
                                spellCheck={false}
                            />
                            {formErrors.mobile && (
                                <p className="mt-1 text-sm text-red-600">
                                    {formErrors.mobile}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            className="h-4 w-4 mb-[3px] cursor-pointer"
                            {...register('isDefault')}
                        />
                        <label
                            htmlFor="isDefault"
                            className="font-normal text-slate-600 cursor-pointer"
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
