import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { IoAddCircleOutline, IoClose } from 'react-icons/io5';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import uploadImage from '../utils/UploadImage';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import Axios from '../utils/Axios';
import Loading from '../components/Loading';
import ViewImage from '../components/ViewImage';
import AddFieldComponent from '../components/AddFieldComponent';
import successAlert from './../utils/successAlert';

const UploadProduct = () => {
    const [data, setData] = useState({
        name: '',
        image: [],
        category: [],
        unit: '',
        stock: null,
        price: null,
        discount: null,
        description: '',
        more_details: {},
    });

    const [loading, setLoading] = useState(false);
    const [imageURL, setImageURL] = useState('');

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
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        setLoading(true);

        const response = await uploadImage(file);
        const { data: ImageResponse } = response;
        const imageUrl = ImageResponse.data.url;

        setLoading(false);

        setData((prev) => {
            return {
                ...prev,
                image: [...prev.image, imageUrl],
            };
        });
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
        <section className="">
            <div
                className="p-2 mb-3 bg-slate-50 rounded shadow-md flex items-center
            justify-between gap-4"
            >
                <h2 className="font-bold">Upload Product</h2>
            </div>
            <div className="grid gap-2">
                <form
                    action=""
                    className="my-4 grid gap-6"
                    onSubmit={handleSubmit}
                >
                    <div className="grid gap-2">
                        <label
                            id="name"
                            htmlFor="name"
                            className="font-semibold"
                        >
                            Name (<span className="text-red-500">*</span>)
                        </label>
                        <input
                            type="text"
                            className="bg-blue-50 p-2 border rounded outline-none
                            focus-within:border-primary-200"
                            id="name"
                            placeholder="Enter product name!"
                            value={data.name}
                            name="name"
                            onChange={handleOnChange}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <p className="font-semibold">
                            Image (<span className="text-red-500">*</span>)
                        </p>
                        <div className="flex flex-col">
                            <div
                                className="bg-blue-50 p-2 h-28 w-full border rounded
                            flex items-center justify-center"
                            >
                                <div>
                                    <label htmlFor="uploadProductImage">
                                        <div
                                            className={`${
                                                !data.name
                                                    ? ' text-blue-300 cursor-no-drop'
                                                    : ' text-blue-600 hover:bg-blue-200 cursor-pointer'
                                            } px-3 py-1 text-sm rounded-md`}
                                        >
                                            {loading ? (
                                                <Loading />
                                            ) : (
                                                <FaCloudUploadAlt size={45} />
                                            )}
                                        </div>
                                        <input
                                            disabled={!data.name}
                                            onChange={handleUploadProductImage}
                                            type="file"
                                            accept="image/*"
                                            id="uploadProductImage"
                                            multiple
                                            className="hidden"
                                            required
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Display Upload Image */}
                            <div
                                className={`${
                                    data.image[0] ? 'mt-2' : 'mt-0'
                                } flex flex-wrap gap-2`}
                            >
                                {data.image.map((img, index) => {
                                    return (
                                        <div
                                            key={img + index}
                                            className="h-20 w-20 min-w-20
                                                  bg-blue-100 border relative group hover:opacity-90"
                                        >
                                            <img
                                                src={img}
                                                alt={img}
                                                title={img}
                                                className="w-full h-full object-scale-down cursor-pointer"
                                                onClick={() => {
                                                    setImageURL(img);
                                                }}
                                            />
                                            <div
                                                onClick={() =>
                                                    handleRemoveImage(index)
                                                }
                                                className="absolute bottom-0 right-0 hidden cursor-pointer p-1
                                            bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-tl-xl
                                            group-hover:block transition-all duration-200"
                                            >
                                                <MdDelete />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label className="font-semibold">
                            Category (<span className="text-red-500">*</span>)
                        </label>

                        {/* Display Value */}
                        <div
                            className={`${
                                data.category[0] ? 'flex' : 'hidden'
                            } gap-4 flex-wrap`}
                        >
                            {data.category.map((cate) => {
                                return (
                                    <span
                                        key={cate._id + 'category'}
                                        className="bg-slate-200 shadow-md px-2 mx-1 flex items-center gap-2"
                                    >
                                        {cate.name}
                                        <div
                                            onClick={() =>
                                                handleRemoveCategorySelected(
                                                    cate._id
                                                )
                                            }
                                            className="cursor-pointer hover:text-red-600"
                                        >
                                            <IoClose size={18} />
                                        </div>
                                    </span>
                                );
                            })}
                        </div>

                        {/* Select Category */}
                        <select
                            className={`${
                                data.category[0] ? 'mt-1' : 'mt-0'
                            } bg-blue-50 p-2 border rounded outline-none focus-within:border-primary-200`}
                            value={selectCategoryValue}
                            onChange={(e) => {
                                const value = e.target.value;

                                if (!value) return;
                                const categoryDetails = allCategory.find(
                                    (el) => el._id == value
                                );

                                // Kiểm tra trùng lặp
                                const alreadySelected = data.category.some(
                                    (cate) => cate._id === value
                                );

                                if (alreadySelected) {
                                    return;
                                }

                                setData((prev) => {
                                    return {
                                        ...prev,
                                        category: [
                                            ...prev.category,
                                            categoryDetails,
                                        ],
                                    };
                                });

                                setSelectCategoryValue('');
                            }}
                        >
                            <option value={''}>Select Category</option>
                            {allCategory.map((category) => {
                                return (
                                    <option
                                        value={category?._id}
                                        key={category._id + 'product'}
                                    >
                                        {category?.name}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <label
                            id="unit"
                            htmlFor="unit"
                            className="font-semibold"
                        >
                            Units (<span className="text-red-500">*</span>)
                        </label>
                        <input
                            type="text"
                            className="bg-blue-50 p-2 border rounded outline-none
                            focus-within:border-primary-200"
                            id="unit"
                            placeholder="Enter product unit!"
                            value={data.unit}
                            name="unit"
                            onChange={handleOnChange}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <label
                            id="stock"
                            htmlFor="stock"
                            className="font-semibold"
                        >
                            Number of Stocks (
                            <span className="text-red-500">*</span>)
                        </label>
                        <input
                            type="number"
                            className="bg-blue-50 p-2 border rounded outline-none
                            focus-within:border-primary-200"
                            id="stock"
                            placeholder="Enter product stock!"
                            value={data.stock}
                            name="stock"
                            onChange={handleOnChange}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <label
                            id="price"
                            htmlFor="price"
                            className="font-semibold"
                        >
                            Price (<span className="text-red-500">*</span>)
                        </label>
                        <input
                            type="number"
                            className="bg-blue-50 p-2 border rounded outline-none
                            focus-within:border-primary-200"
                            id="price"
                            placeholder="Enter product price!"
                            value={data.price}
                            name="price"
                            onChange={handleOnChange}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <label
                            id="discount"
                            htmlFor="discount"
                            className="font-semibold"
                        >
                            Discount
                        </label>
                        <input
                            type="number"
                            className="bg-blue-50 p-2 border rounded outline-none
                            focus-within:border-primary-200"
                            id="discount"
                            placeholder="Enter product discount!"
                            value={data.discount}
                            name="discount"
                            onChange={handleOnChange}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label id="description" htmlFor="description">
                            Description
                        </label>
                        <textarea
                            type="text"
                            className="bg-blue-50 p-2 border rounded outline-none
                            focus-within:border-primary-200 resize-none"
                            id="description"
                            placeholder="Enter description!"
                            value={data.description}
                            name="description"
                            onChange={handleOnChange}
                            aria-multiline
                            rows={4}
                        />
                    </div>

                    {/* Add More Field */}
                    <div
                        className={`${
                            Object.keys(data.more_details).length > 0
                                ? 'block'
                                : 'hidden'
                        } grid gap-6`}
                    >
                        {Object?.keys(data?.more_details)?.map((field) => {
                            return (
                                <div className="grid gap-2">
                                    <label
                                        htmlFor={field}
                                        className="font-semibold"
                                    >
                                        {field}
                                    </label>
                                    <input
                                        type="text"
                                        className="bg-blue-50 p-2 border rounded outline-none
                                        focus-within:border-primary-200"
                                        id={field}
                                        value={data?.more_details[field]}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setData((prev) => {
                                                return {
                                                    ...prev,
                                                    more_details: {
                                                        ...prev.more_details,
                                                        [field]: value,
                                                    },
                                                };
                                            });
                                        }}
                                        required
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Field Button */}
                    <div
                        onClick={() => setOpenAddField(true)}
                        className="bg-white border border-slate-700 text-center text-slate-600 font-semibold
                    hover:bg-green-100 hover:text-green-600 hover:border-green-600 w-fit px-6 py-1
                    flex items-center justify-center gap-1 rounded cursor-pointer"
                    >
                        <IoAddCircleOutline size={30} />
                        Add Field
                    </div>

                    <button
                        disabled={
                            !data.name ||
                            !data.image[0] ||
                            !data.category[0] ||
                            !data.unit ||
                            !data.stock ||
                            !data.price
                        }
                        className={`${
                            data.name &&
                            data.image[0] &&
                            data.category[0] &&
                            data.unit &&
                            data.stock &&
                            data.price
                                ? 'bg-green-700 text-white font-semibold hover:bg-green-600 cursor-pointer'
                                : 'bg-gray-300 text-gray-700 font-medium cursor-no-drop'
                        } py-2 rounded-md`}
                    >
                        Submit
                    </button>
                </form>
            </div>

            {imageURL && (
                <ViewImage url={imageURL} close={() => setImageURL('')} />
            )}

            {openAddField && (
                <AddFieldComponent
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    onSubmit={handleAddField}
                    close={() => setOpenAddField(false)}
                />
            )}
        </section>
    );
};

export default UploadProduct;
