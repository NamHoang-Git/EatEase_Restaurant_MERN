import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { IoAddCircleOutline, IoAddSharp, IoClose } from 'react-icons/io5';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import uploadImage from '@/utils/UploadImage';
import SummaryApi from '@/common/SummaryApi';
import AxiosToastError from '@/utils/AxiosToastError';
import Axios from '@/utils/Axios';
import ViewImage from '@/components/ViewImage';
import AddField from '@/components/product/AddField';
import successAlert from '@/utils/successAlert';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '@radix-ui/react-label';
import { Input } from '../ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import Loading from '../Loading';
import { Textarea } from '../ui/textarea';
import GlareHover from '../animation/GlareHover';
import Divider from '../Divider';

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
            className="backdrop-blur z-50 fixed top-0 left-0 right-0 bottom-0 overflow-auto
            flex items-center justify-center px-2 transition-transform duration-500 ease-in hover:scale-[1.01]"
        >
            <Card
                className="max-w-3xl w-full border-foreground overflow-y-auto max-h-[calc(100vh-150px)]
            scrollbarCustom scrollbar-hide"
            >
                <CardHeader className="pt-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-highlight font-bold uppercase">
                            Thêm sản phẩm
                        </CardTitle>
                        <Button
                            onClick={close}
                            className="bg-transparent hover:bg-transparent text-foreground
                        hover:text-highlight h-12"
                        >
                            <IoClose />
                        </Button>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="py-4 space-y-5 text-sm">
                        {/* Product Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Tên sản phẩm{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                autoFocus
                                value={data.name}
                                onChange={handleOnChange}
                                className="text-sm h-12"
                                placeholder="Nhập tên sản phẩm"
                                spellCheck={false}
                                required
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="image">
                                Hình ảnh sản phẩm{' '}
                                <span className="text-red-500">*</span>
                            </Label>

                            {/* Upload Area */}
                            <div className="space-y-2">
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
                                <Label
                                    htmlFor="uploadProductImage"
                                    className={`block border-2 border-dashed rounded-xl p-6 text-center
                                transition-all duration-200 group ${
                                    data.image.length
                                        ? 'border-green-300 bg-green-50/90'
                                        : 'border-gray-300 hover:border-red-500'
                                } ${
                                        !data.name || loading
                                            ? 'opacity-70 cursor-not-allowed'
                                            : 'cursor-pointer'
                                    }`}
                                    title={
                                        !data.name
                                            ? 'Vui lòng nhập tên sản phẩm trước'
                                            : ''
                                    }
                                >
                                    <div className="space-y-2">
                                        <div
                                            className="mx-auto w-12 h-12 bg-gray-100 text-gray-400 group-hover:text-red-400 group-hover:bg-red-50 rounded-full
                                        flex items-center justify-center"
                                        >
                                            {loading ? (
                                                <Loading />
                                            ) : (
                                                <IoAddSharp size={24} />
                                            )}
                                        </div>
                                        <div className="sm:text-sm text-xs text-red-500">
                                            <p className="font-medium">
                                                Nhấn để chọn ảnh
                                            </p>
                                            <p className="sm:text-xs text-[10px] text-red-300">
                                                PNG, JPG (tối đa 10 ảnh, mỗi ảnh
                                                tối đa 10MB)
                                            </p>
                                        </div>
                                    </div>
                                </Label>
                            </div>

                            {/* Image Preview */}
                            {data.image.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm">
                                        Đã chọn {data.image.length} ảnh
                                    </Label>
                                    <div className="flex flex-wrap gap-3">
                                        {data.image.map((img, index) => (
                                            <div
                                                key={img + index}
                                                className="relative group sm:h-24 sm:w-24 h-16 w-16 rounded-lg overflow-hidden border border-secondary-100"
                                            >
                                                <img
                                                    src={img}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-all duration-200"
                                                    onClick={() =>
                                                        setImageURL(img)
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveImage(
                                                            index
                                                        );
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
                            <Label htmlFor="parentCategory">
                                Danh Mục <span className="text-red-500">*</span>
                            </Label>

                            {/* Selected Categories */}
                            {data.category.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {data.category.map((cate) => (
                                        <span
                                            key={cate._id}
                                            className="inline-flex items-center gap-2 bg-rose-600/90 text-white sm:text-sm text-xs px-3 py-1 rounded-full"
                                        >
                                            {cate.name}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveCategorySelected(
                                                        cate._id
                                                    )
                                                }
                                                className="hover:opacity-80 mb-[1.5px]"
                                            >
                                                <IoClose size={16} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Category Selector */}
                            <Select
                                value={selectCategoryValue}
                                onValueChange={(value) => {
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
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn danh mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {allCategory
                                            .filter(
                                                (cat) =>
                                                    !data.category.some(
                                                        (selected) =>
                                                            selected._id ===
                                                            cat._id
                                                    )
                                            )
                                            .map((category) => (
                                                <SelectItem
                                                    key={category._id}
                                                    value={category._id}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Unit */}
                        <div className="space-y-2">
                            <Label htmlFor="unit">
                                Đơn vị tính{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                id="unit"
                                name="unit"
                                autoFocus
                                value={data.unit}
                                onChange={handleOnChange}
                                className="text-sm h-12 capitalize"
                                placeholder="Nhập đơn vị tính"
                                required
                            />
                        </div>
                        {/* Stock */}
                        <div className="space-y-2">
                            <Label htmlFor="stock">
                                Số lượng tồn kho{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="number"
                                id="stock"
                                name="stock"
                                min="0"
                                value={data.stock || ''}
                                onChange={handleOnChange}
                                className="text-sm h-12 capitalize no-spinner"
                                placeholder="Nhập số lượng tồn kho"
                                required
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        {/* Price */}
                        <div className="space-y-2">
                            <Label htmlFor="price">
                                Giá bán <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-200 font-sem">
                                    VND
                                </span>
                                <Input
                                    type="number"
                                    id="price"
                                    name="price"
                                    min="0"
                                    value={data.price || ''}
                                    onChange={handleOnChange}
                                    className="text-sm h-12 capitalize no-spinner pl-12"
                                    placeholder="Nhập giá bán"
                                    required
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="discount">Giảm giá</Label>
                            <Input
                                type="number"
                                className="text-sm h-12 capitalize no-spinner"
                                id="discount"
                                placeholder="Nhập % giảm giá (nếu có)"
                                value={data.discount}
                                name="discount"
                                onChange={handleOnChange}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả sản phẩm</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={data.description}
                                onChange={handleOnChange}
                                rows={4}
                                className="text-sm h-12 capitalize"
                                placeholder="Nhập mô tả"
                                spellCheck={false}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* Additional Fields */}
                        {Object.keys(data.more_details).length > 0 && (
                            <div className="space-y-4 pt-2 border-t border-gray-200">
                                <h4 className="font-semibold text-secondary-200">
                                    Thông tin bổ sung
                                </h4>
                                {Object.keys(data.more_details).map((field) => (
                                    <div key={field} className="space-y-2">
                                        <label
                                            htmlFor={`field-${field}`}
                                            className="block font-semibold text-gray-700 capitalize"
                                        >
                                            {field.replace(/_/g, ' ')}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                id={`field-${field}`}
                                                value={
                                                    data.more_details[field] ||
                                                    ''
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;
                                                    setData((prev) => ({
                                                        ...prev,
                                                        more_details: {
                                                            ...prev.more_details,
                                                            [field]: value,
                                                        },
                                                    }));
                                                }}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secondary-100
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
                                                        more_details:
                                                            newDetails,
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
                        <GlareHover
                            background="transparent"
                            glareOpacity={0.3}
                            glareAngle={-30}
                            glareSize={300}
                            transitionDuration={800}
                            playOnce={false}
                        >
                            <Button
                                type="button"
                                onClick={() => setOpenAddField(true)}
                                className="flex items-center gap-2 font-semibold text-primary-600
                        hover:text-primary-700 transition-colors w-full
                        px-3 py-2 rounded-lg border shadow-md hover:bg-transparent"
                            >
                                <IoAddCircleOutline />
                                Thêm trường tùy chỉnh
                            </Button>
                        </GlareHover>

                        <Divider />
                        {/* Submit Button */}
                        <CardFooter className="px-0 text-sm flex justify-end">
                            <GlareHover
                                background="transparent"
                                glareOpacity={0.3}
                                glareAngle={-30}
                                glareSize={300}
                                transitionDuration={800}
                                playOnce={false}
                            >
                                <Button
                                    disabled={
                                        !data.name ||
                                        !data.image[0] ||
                                        !data.category[0] ||
                                        !data.unit ||
                                        !data.stock ||
                                        !data.price ||
                                        loading
                                    }
                                    type="submit"
                                    className="bg-foreground"
                                >
                                    {loading ? <Loading /> : 'Thêm Mới'}
                                </Button>
                            </GlareHover>
                        </CardFooter>
                    </CardContent>
                </form>
            </Card>

            {/* Image Preview Modal */}
            {imageURL && (
                <ViewImage url={imageURL} close={() => setImageURL('')} />
            )}

            {/* Add Custom Field Modal */}
            {openAddField && (
                <AddField
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
