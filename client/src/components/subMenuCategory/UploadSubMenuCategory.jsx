import React, { useState } from 'react';
import { IoAddSharp, IoClose } from 'react-icons/io5';
import uploadImage from '@/utils/UploadImage.js';
import Axios from '@/utils/Axios.js';
import SummaryApi from '@/common/SummaryApi.js';
import AxiosToastError from '@/utils/AxiosToastError.js';
import { useSelector } from 'react-redux';
import successAlert from '@/utils/successAlert';
import Loading from '../Loading';
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
import Divider from '../Divider';
import GlareHover from '../animation/GlareHover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';

const UploadSubMenuCategoryModel = ({ close, fetchData }) => {
    const [subMenuCategoryData, setSubMenuCategoryData] = useState({
        name: '',
        image: '',
        description: '',
        parentCategory: '',
    });

    const [loading, setLoading] = useState(false);
    const [selectCategoryValue, setSelectCategoryValue] = useState('');

    const allCategory = useSelector((state) => state.product.allCategory);

    const handleOnChange = (e) => {
        const { name, value } = e.target;

        setSubMenuCategoryData((prev) => {
            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const handleUploadSubCategoryImage = async (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        setLoading(true);

        const response = await uploadImage(file);
        const { data: ImageResponse } = response;
        setLoading(false);

        setSubMenuCategoryData((prev) => {
            return {
                ...prev,
                image: ImageResponse.data.url,
            };
        });
    };

    const handleRemoveCategorySelected = () => {
        setSubMenuCategoryData((prev) => ({
            ...prev,
            parentCategory: '',
        }));
        setSelectCategoryValue('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.add_sub_menu_category,
                data: subMenuCategoryData,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                successAlert(responseData.message);
                close();
                fetchData();
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section
            className="backdrop-blur z-50 fixed top-0 left-0 right-0 bottom-0 overflow-auto
            flex items-center justify-center px-2 transition-transform duration-500 ease-in hover:scale-[1.01]"
        >
            <Card className="w-full max-w-lg overflow-hidden border-foreground">
                {/* Header */}
                <CardHeader className="pt-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-highlight font-bold uppercase">
                            Thêm danh mục phụ
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
                    <CardContent className="py-4 space-y-5 text-sm capitalize">
                        {/* Sub Category Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Tên danh mục phụ{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                autoFocus
                                value={subMenuCategoryData.name}
                                onChange={handleOnChange}
                                className="text-sm h-12 capitalize"
                                placeholder="Nhập tên danh mục phụ"
                                required
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="uploadSubCategoryImage">
                                Hình ảnh <span className="text-red-500">*</span>
                            </Label>
                            <Label
                                htmlFor="uploadSubCategoryImage"
                                className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                                transition-all duration-200 group ${
                                    subMenuCategoryData.image
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-gray-300 hover:border-red-500'
                                }`}
                            >
                                {subMenuCategoryData.image ? (
                                    <div className="relative">
                                        <img
                                            src={subMenuCategoryData.image}
                                            alt="subMenuCategory"
                                            className="sm:h-40 h-32 mx-auto object-contain rounded-lg"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                                            <span className="text-white bg-black/70 text-xs px-2 py-1 rounded">
                                                Thay đổi ảnh
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div
                                            className="mx-auto w-12 h-12 bg-gray-100 text-gray-400 group-hover:text-red-400 group-hover:bg-red-50 rounded-full
                                        flex items-center justify-center"
                                        >
                                            <IoAddSharp size={24} />
                                        </div>
                                        <div className="sm:text-sm text-xs text-red-500">
                                            <p className="font-medium">
                                                Tải ảnh lên
                                            </p>
                                            <p className="sm:text-xs text-[10px] text-red-300">
                                                PNG, JPG, JPEG (tối đa 10MB)
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="uploadSubCategoryImage"
                                    className="hidden"
                                    onChange={handleUploadSubCategoryImage}
                                    accept="image/*"
                                />
                            </Label>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <Textarea
                                id="description"
                                name="description"
                                autoFocus
                                value={subMenuCategoryData.description}
                                onChange={handleOnChange}
                                className="text-sm h-12 capitalize"
                                placeholder="Nhập mô tả"
                            />
                        </div>

                        {/* Select Category */}
                        <div className="space-y-2">
                            <Label htmlFor="parentCategory">
                                Danh Mục <span className="text-red-500">*</span>
                            </Label>

                            {/* Display Value */}
                            {subMenuCategoryData.parentCategory && (
                                <Card className="w-fit px-2 py-1.5 flex-row items-center gap-2 border-muted-foreground/50">
                                    {
                                        allCategory.find(
                                            (cat) =>
                                                cat._id ===
                                                subMenuCategoryData.parentCategory
                                        )?.name
                                    }
                                    <Button
                                        onClick={handleRemoveCategorySelected}
                                        className="cursor-pointer hover:text-red-600 w-0 h-0 text-foreground"
                                    >
                                        <IoClose />
                                    </Button>
                                </Card>
                            )}

                            {/* Select Category */}
                            <Select
                                value={selectCategoryValue}
                                onValueChange={(value) => {
                                    if (!value) return;
                                    setSubMenuCategoryData((prev) => ({
                                        ...prev,
                                        parentCategory: value,
                                    }));
                                    setSelectCategoryValue('');
                                }}
                                disabled={!!subMenuCategoryData.parentCategory}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn Danh Mục" />
                                </SelectTrigger>

                                <SelectContent>
                                    {allCategory.map((parentCategory) => (
                                        <SelectItem
                                            key={parentCategory._id}
                                            value={parentCategory._id}
                                            disabled={
                                                parentCategory._id ===
                                                subMenuCategoryData.parentCategory
                                            }
                                        >
                                            {parentCategory.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Divider />
                        {/* Actions */}
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
                                        !subMenuCategoryData.name ||
                                        !subMenuCategoryData.image ||
                                        !subMenuCategoryData.parentCategory ||
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
        </section>
    );
};

export default UploadSubMenuCategoryModel;
