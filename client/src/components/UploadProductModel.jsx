import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { IoAddCircleOutline, IoClose } from 'react-icons/io5';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import uploadImage from '../utils/UploadImage';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import Axios from '../utils/Axios';
import ViewImage from '../components/ViewImage';
import AddFieldComponent from '../components/AddFieldComponent';
import successAlert from './../utils/successAlert';

const UploadProductModel = ({ close, fetchData }) => {
    const [data, setData] = useState({
        name: '',
        image: [],
        category: [],
        unit: '',
        stock: 0,
        price: 0,
        discount: 0,
        description: '',
        more_details: {},
    });

    const [loading, setLoading] = useState(false);
    const [imageURL, setImageURL] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // lấy tất cả input hợp lệ trong form
            const form = e.target.form;
            const focusable = Array.from(form.elements).filter(
                (el) =>
                    el.tagName === 'INPUT' ||
                    el.tagName === 'SELECT' ||
                    el.tagName === 'TEXTAREA'
            );

            // tìm vị trí hiện tại
            const index = focusable.indexOf(e.target);

            // focus phần tử tiếp theo nếu có
            if (index > -1 && index < focusable.length - 1) {
                focusable[index + 1].focus();
            }
        }
    };

    const handleOnChange = (e) => {
        const { name, value } = e.target;

        setData((prev) => {
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const handleUploadProductImage = async (e) => {
        const files = Array.from(e.target.files);

        if (files.length === 0) {
            return;
        }

        // Check total images won't exceed limit (e.g., 10 images)
        const maxImages = 10;
        if (data.image.length + files.length > maxImages) {
            alert(`Bạn chỉ có thể tải lên tối đa ${maxImages} ảnh`);
            return;
        }

        setLoading(true);

        try {
            const uploadPromises = files.map((file) => uploadImage(file));
            const responses = await Promise.all(uploadPromises);

            const newImageUrls = responses.map(
                (response) => response.data.data.url
            );

            setData((prev) => ({
                ...prev,
                image: [...prev.image, ...newImageUrls],
            }));
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveImage = async (index) => {
        data.image.splice(index, 1);
        setData((prev) => {
            return {
                ...prev,
            };
        });
    };

    // Category
    const [selectCategoryValue, setSelectCategoryValue] = useState('');
    const allCategory = useSelector((state) => state.product.allCategory);

    const handleRemoveCategorySelected = (categoryId) => {
        const updated = data.category.filter((el) => el._id !== categoryId);

        setData((prev) => ({
            ...prev,
            category: updated,
        }));
    };

    // Add More Field
    const [openAddField, setOpenAddField] = useState(false);
    const [fieldName, setFieldName] = useState('');

    const handleAddField = () => {
        setData((prev) => {
            return {
                ...prev,
                more_details: {
                    ...prev.more_details,
                    [fieldName]: '',
                },
            };
        });

        setFieldName('');
        setOpenAddField(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await Axios({
                ...SummaryApi.add_product,
                data: data,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                successAlert(responseData.message);
                if (close) {
                    close();
                }
                fetchData();
                setData({
                    name: '',
                    image: [],
                    category: [],
                    unit: '',
                    stock: '',
                    price: '',
                    discount: '',
                    description: '',
                    more_details: {},
                });
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    return (
        <section
            onClick={close}
            className="fixed top-0 bottom-0 left-0 right-0 bg-neutral-800 z-50 bg-opacity-60 p-4 flex items-center justify-center"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white max-w-4xl w-full rounded-xl shadow-sm border border-gray-200 overflow-y-auto
            max-h-[calc(100vh-200px)] scrollbarCustom scrollbar-hide"
            >
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-secondary-200">
                            Thêm sản phẩm
                        </h2>
                        <button
                            onClick={close}
                            className="text-gray-400 hover:text-secondary-200 transition-colors"
                        >
                            <IoClose size={24} />
                        </button>
                    </div>
                </div>
                <form
                    className="px-4 py-6 sm:p-6 space-y-6"
                    onSubmit={handleSubmit}
                >
                    {/* Product Name */}
                    <div className="space-y-2">
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Tên sản phẩm <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            autoFocus
                            value={data.name}
                            onChange={handleOnChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2
                            focus:ring-secondary-100 focus:border-secondary-100 focus:outline-none transition-all"
                            placeholder="Nhập tên sản phẩm"
                            required
                        />
                    </div>
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Hình ảnh sản phẩm{' '}
                            <span className="text-red-500">*</span>
                        </label>

                        {/* Upload Area */}
                        <div className="space-y-3">
                            <input
                                type="file"
                                id="uploadProductImage"
                                accept="image/*"
                                onChange={handleUploadProductImage}
                                className="hidden"
                                multiple
                                disabled={!data.name || loading}
                                required={!data.image.length}
                            />
                            <label
                                htmlFor="uploadProductImage"
                                className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                                transition-all duration-200 ${
                                    data.image.length
                                        ? 'border-blue-200 bg-blue-50'
                                        : 'border-gray-300 hover:border-primary-200'
                                } ${
                                    !data.name || loading
                                        ? 'opacity-70 cursor-not-allowed'
                                        : ''
                                }`}
                                title={
                                    !data.name
                                        ? 'Vui lòng nhập tên sản phẩm trước'
                                        : ''
                                }
                            >
                                <div className="space-y-2">
                                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <FaCloudUploadAlt
                                                className="text-gray-400"
                                                size={24}
                                            />
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <p className="font-medium">
                                            Nhấn để chọn ảnh
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            PNG, JPG (tối đa 10 ảnh, mỗi ảnh tối
                                            đa 5MB)
                                        </p>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Image Preview */}
                        {data.image.length > 0 && (
                            <div className="mt-3">
                                <p className="text-sm text-gray-500 mb-2">
                                    Đã chọn {data.image.length} ảnh
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {data.image.map((img, index) => (
                                        <div
                                            key={img + index}
                                            className="relative group sm:h-24 sm:w-24 h-16 w-16 rounded-lg overflow-hidden border border-gray-200"
                                        >
                                            <img
                                                src={img}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-all duration-200"
                                                onClick={() => setImageURL(img)}
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveImage(index);
                                                }}
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-md sm:p-1 p-[2px] opacity-0 group-hover:opacity-100
                                                transition-opacity"
                                                title="Xóa ảnh"
                                            >
                                                <IoClose size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Category Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Danh mục <span className="text-red-500">*</span>
                        </label>

                        {/* Selected Categories */}
                        {data.category.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {data.category.map((cate) => (
                                    <span
                                        key={cate._id}
                                        className="inline-flex items-center bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full"
                                    >
                                        {cate.name}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveCategorySelected(
                                                    cate._id
                                                )
                                            }
                                            className="ml-2 text-gray-500 hover:text-red-500"
                                        >
                                            <IoClose size={16} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Category Selector */}
                        <div className="relative">
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-100
                                focus:border-secondary-100 focus:outline-none appearance-none bg-white"
                                value={selectCategoryValue}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (!value) return;

                                    const categoryDetails = allCategory.find(
                                        (el) => el._id === value
                                    );

                                    // Check for duplicates
                                    const alreadySelected = data.category.some(
                                        (cate) => cate._id === value
                                    );

                                    if (!alreadySelected && categoryDetails) {
                                        setData((prev) => ({
                                            ...prev,
                                            category: [
                                                ...prev.category,
                                                categoryDetails,
                                            ],
                                        }));
                                        setSelectCategoryValue('');
                                    }
                                }}
                            >
                                <option value="">Chọn danh mục</option>
                                {allCategory
                                    .filter(
                                        (cat) =>
                                            !data.category.some(
                                                (selected) =>
                                                    selected._id === cat._id
                                            )
                                    )
                                    .map((category) => (
                                        <option
                                            key={category._id}
                                            value={category._id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg
                                    className="fill-current h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    {/* Unit */}
                    <div className="space-y-2">
                        <label
                            htmlFor="unit"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Đơn vị tính <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="unit"
                            name="unit"
                            value={data.unit}
                            onChange={handleOnChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2
                            focus:ring-secondary-100 focus:border-secondary-100 focus:outline-none transition-all"
                            placeholder="Ví dụ: cái, thiết bị, bộ..."
                            required
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    {/* Stock */}
                    <div className="space-y-2">
                        <label
                            htmlFor="stock"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Số lượng tồn kho{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="stock"
                            name="stock"
                            min="0"
                            value={data.stock || ''}
                            onChange={handleOnChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-100
                            focus:border-secondary-100 focus:outline-none"
                            placeholder="Nhập số lượng tồn kho"
                            required
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    {/* Price */}
                    <div className="space-y-2">
                        <label
                            htmlFor="price"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Giá bán <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                đ
                            </span>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                min="0"
                                value={data.price || ''}
                                onChange={handleOnChange}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-100
                                focus:border-secondary-100 focus:outline-none"
                                placeholder="Nhập giá bán"
                                required
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label
                            id="discount"
                            htmlFor="discount"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Giảm giá
                        </label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-100
                            focus:border-secondary-100 focus:outline-none"
                            id="discount"
                            placeholder="Enter product discount!"
                            value={data.discount}
                            name="discount"
                            onChange={handleOnChange}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    {/* Description */}
                    <div className="space-y-2">
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Mô tả sản phẩm
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={data.description}
                            onChange={handleOnChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-100
                            focus:border-secondary-100 focus:outline-none resize-none"
                            placeholder="Nhập mô tả chi tiết về sản phẩm..."
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    {/* Additional Fields */}
                    {Object.keys(data.more_details).length > 0 && (
                        <div className="space-y-4 pt-2 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700">
                                Thông tin bổ sung
                            </h4>
                            {Object.keys(data.more_details).map((field) => (
                                <div key={field} className="space-y-2">
                                    <label
                                        htmlFor={`field-${field}`}
                                        className="block text-sm font-medium text-gray-700 capitalize"
                                    >
                                        {field.replace(/_/g, ' ')}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            id={`field-${field}`}
                                            value={
                                                data.more_details[field] || ''
                                            }
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setData((prev) => ({
                                                    ...prev,
                                                    more_details: {
                                                        ...prev.more_details,
                                                        [field]: value,
                                                    },
                                                }));
                                            }}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-100
                                            focus:border-secondary-100 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newDetails = {
                                                    ...data.more_details,
                                                };
                                                delete newDetails[field];
                                                setData((prev) => ({
                                                    ...prev,
                                                    more_details: newDetails,
                                                }));
                                            }}
                                            className="px-3 text-red-500 hover:text-red-700"
                                            title="Xóa trường"
                                        >
                                            <IoClose size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Field Button */}
                    <button
                        type="button"
                        onClick={() => setOpenAddField(true)}
                        className="flex items-center gap-2 text-sm font-medium text-primary-600
                        hover:text-primary-700 transition-colors bg-white w-full
                        px-3 py-2 rounded-lg border shadow-md"
                    >
                        <IoAddCircleOutline size={20} />
                        <p className="mt-[3px]">Thêm trường tùy chỉnh</p>
                    </button>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={
                                !data.name ||
                                !data.image[0] ||
                                !data.category[0] ||
                                !data.unit ||
                                !data.stock ||
                                !data.price ||
                                loading
                            }
                            className={`w-full py-2 px-4 rounded-lg sm:text-base text-sm font-semibold transition-colors ${
                                data.name &&
                                data.image[0] &&
                                data.category[0] &&
                                data.unit &&
                                data.stock &&
                                data.price &&
                                !loading
                                    ? 'bg-primary-4 text-secondary-200 hover:opacity-80 shadow-lg'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Đang xử lý...
                                </div>
                            ) : (
                                'Lưu sản phẩm'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Image Preview Modal */}
            {imageURL && (
                <ViewImage url={imageURL} close={() => setImageURL('')} />
            )}

            {/* Add Custom Field Modal */}
            {openAddField && (
                <AddFieldComponent
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    onSubmit={() => {
                        if (fieldName.trim()) {
                            handleAddField();
                            setFieldName('');
                            setOpenAddField(false);
                        }
                    }}
                    close={() => {
                        setFieldName('');
                        setOpenAddField(false);
                    }}
                />
            )}
        </section>
    );
};

export default UploadProductModel;
