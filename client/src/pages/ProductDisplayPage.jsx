import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Axios from './../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from './../utils/AxiosToastError';
import { DisplayPriceInVND } from './../utils/DisplayPriceInVND';
import { pricewithDiscount } from './../utils/PriceWithDiscount';
import { FaAngleRight, FaAngleLeft } from 'react-icons/fa6';
import Divider from './../components/Divider';
import AddToCartButton from './../components/AddToCartButton';
import image1 from '../assets/minute_delivery.png';
import image2 from '../assets/Best_Prices_Offers.png';
import image3 from '../assets/Secure_Payment.jpg';
import { useDispatch, useSelector } from 'react-redux';
import { valideURLConvert } from '../utils/valideURLConvert';
import CardProduct from '../components/CardProduct';
import toast from 'react-hot-toast';
import { handleAddItemCart } from '../store/cartProduct';

const ProductDisplayPage = () => {
    const params = useParams();
    let productId = params?.product?.split('-')?.slice(-1)[0];
    const [data, setData] = useState({
        name: '',
        image: [],
        description: '',
        unit: '',
        price: 0,
        discount: 0,
        stock: 0,
    });

    const [image, setImage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState('detail');
    const imageContainer = useRef();
    const user = useSelector((state) => state.user);
    const cart = useSelector((state) => state.cartItem.cart);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const containerRef = useRef();
    const handleRedirectProductListPage = (id, cat) => {
        const url = `/${valideURLConvert(cat)}-${id}`;
        navigate(url);
    };

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_product_details,
                data: {
                    productId: productId,
                },
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
        fetchProductDetails();
    }, [params]);

    const handleScrollLeft = () => {
        imageContainer.current.scrollLeft -= 200;
    };

    const handleScrollRight = () => {
        imageContainer.current.scrollLeft += 200;
    };

    const fetchCart = async () => {
        // Không gọi API nếu user chưa đăng nhập
        if (!user?._id) return;
        
        try {
            const res = await Axios({ ...SummaryApi.get_cart_item });
            if (res.data.success) {
                dispatch(handleAddItemCart(res.data.data));
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const redirectToCartPage = async () => {
        if (!user?._id) {
            navigate('/login');
            return;
        }

        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        const isProductInCart = cart.some(
            (item) => item.productId._id === productId
        );

        if (isProductInCart) {
            // Chuyển đến CartPage và truyền productId để chọn
            navigate('/cart', { state: { selectedProductId: productId } });
        } else {
            try {
                const response = await Axios({
                    ...SummaryApi.add_to_cart,
                    data: {
                        productId: productId, // Thêm sản phẩm vào giỏ hàng
                    },
                });
                if (response.data.success) {
                    toast.success('Đã thêm sản phẩm vào giỏ hàng');
                    await fetchCart();
                    // Chuyển đến CartPage và truyền productId để chọn
                    navigate('/cart', {
                        state: { selectedProductId: productId },
                    });
                } else {
                    toast.error(response.data.message);
                }
            } catch (error) {
                AxiosToastError(error);
            }
        }
    };

    // San pham tuong tu
    const [relatedProducts, setRelatedProducts] = useState([]);
    useEffect(() => {
        const fetchRelatedProducts = async () => {
            try {
                if (!data?.category?.length) return;

                // API lấy sản phẩm tương tự là public, không cần authentication
                const promises = data.category.map((cat) =>
                    Axios({
                        ...SummaryApi.get_product_by_category_home,
                        data: { id: cat?._id },
                    })
                );

                const responses = await Promise.all(promises);

                let merged = [];
                responses.forEach((res) => {
                    if (res.data.success) {
                        merged = [...merged, ...res.data.data];
                    }
                });

                const filtered = merged.filter((p) => p._id !== data._id);
                const unique = filtered.filter(
                    (value, index, self) =>
                        index === self.findIndex((p) => p._id === value._id)
                );

                setRelatedProducts(unique.slice(0, 8));
            } catch (error) {
                console.log('Error fetching related products:', error);
            }
        };

        fetchRelatedProducts();
    }, [data]);

    return (
        <section className="container mx-auto px-4 py-8 lg:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:mt-4">
                <div>
                    <div
                        className="bg-primary-100 rounded-lg shadow-md p-2 flex justify-center items-center
                    h-[400px]"
                    >
                        <img
                            src={data.image[image]}
                            alt={data.name}
                            className="object-scale-down max-h-full rounded"
                        />
                    </div>

                    <div className="flex items-center justify-center gap-3 my-4">
                        {data.image.map((img, index) => (
                            <div
                                key={img + index + 'point'}
                                className={`bg-rose-200 w-3 h-3 rounded-full ${
                                    index === image && 'bg-rose-400'
                                }`}
                            ></div>
                        ))}
                    </div>

                    <div className="container mx-auto">
                        <div className="relative mt-4 flex items-center">
                            <div
                                ref={imageContainer}
                                className="grid grid-flow-col auto-cols-[minmax(80px,80px)]
                            gap-4 overflow-x-auto scroll-smooth scrollbar-hide"
                            >
                                {data.image.map((img, index) => (
                                    <div
                                        key={index}
                                        className={`rounded cursor-pointer flex items-center ${
                                            index === image
                                                ? 'border-secondary-200 border-4 border-inset'
                                                : 'border-secondary-100 border-inset'
                                        }`}
                                        onClick={() => setImage(index)}
                                    >
                                        <img
                                            src={img}
                                            className="object-cover h-20 w-20"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="left-0 absolute hidden lg:block cursor-pointer">
                                <button
                                    onClick={handleScrollLeft}
                                    className="z-10 bg-white hover:bg-gray-100 shadow-md shadow-secondary-200 text-lg
                                               p-2 rounded-full "
                                >
                                    <FaAngleLeft size={16} />
                                </button>
                            </div>

                            <div className="right-0 absolute hidden lg:block cursor-pointer">
                                <button
                                    onClick={handleScrollRight}
                                    className="z-10 bg-white hover:bg-gray-100 shadow-md shadow-secondary-200 text-lg
                                               p-2 rounded-full "
                                >
                                    <FaAngleRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:flex flex-col gap-6 hidden">
                        <section className="container mt-8 bg-white p-4 rounded-lg">
                            <div className="flex items-center gap-6 border-b border-gray-300">
                                <button
                                    onClick={() => setTab('detail')}
                                    className={`pb-2 font-bold text-lg px-2 ${
                                        tab === 'detail'
                                            ? 'border-b-[3px] border-secondary-200 text-secondary-200'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Chi tiết
                                </button>
                                <button
                                    onClick={() => setTab('description')}
                                    className={`pb-2 font-bold text-lg px-2 ${
                                        tab === 'description'
                                            ? 'border-b-[3px] border-secondary-200 text-secondary-200'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Mô tả
                                </button>
                                <button
                                    onClick={() => setTab('reviews')}
                                    className={`pb-2 font-bold text-lg px-2 ${
                                        tab === 'reviews'
                                            ? 'border-b-[3px] border-secondary-200 text-secondary-200'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Đánh giá
                                </button>
                            </div>

                            <div className="mt-6 px-4">
                                {tab === 'detail' && (
                                    <div className="text-gray-700 leading-relaxed break-words flex flex-col gap-3">
                                        <div className="flex gap-4">
                                            <span className="font-semibold">
                                                Danh mục:{' '}
                                            </span>
                                            <div className="flex flex-wrap gap-5">
                                                {data?.category &&
                                                data.category.length > 0 ? (
                                                    data.category.map(
                                                        (cat, index) => (
                                                            <Link
                                                                ref={
                                                                    containerRef
                                                                }
                                                                key={
                                                                    cat._id ||
                                                                    index
                                                                }
                                                                onClick={() =>
                                                                    handleRedirectProductListPage(
                                                                        cat._id,
                                                                        cat.name
                                                                    )
                                                                }
                                                                className="hover:underline text-blue-600 font-semibold"
                                                            >
                                                                {cat.name}
                                                            </Link>
                                                        )
                                                    )
                                                ) : (
                                                    <span className="italic text-gray-500 break-words">
                                                        Không có danh mục
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <span className="font-semibold">
                                                Số lượng còn lại:
                                            </span>
                                            {data.stock}
                                        </div>
                                        <div className="flex gap-4">
                                            <span className="font-semibold">
                                                Đơn vị tính:
                                            </span>
                                            {data.unit}
                                        </div>
                                    </div>
                                )}
                                {tab === 'description' && (
                                    <p className="text-gray-700 leading-relaxed break-words">
                                        {data?.description &&
                                        data.description.trim() !== '' ? (
                                            data.description
                                        ) : (
                                            <span className="italic text-gray-500">
                                                Sản phẩm này hiện chưa có mô tả.
                                            </span>
                                        )}
                                    </p>
                                )}
                                {tab === 'reviews' && (
                                    <p className="italic text-gray-500 break-words">
                                        Chưa có đánh giá nào.
                                    </p>
                                )}
                            </div>
                        </section>

                        <div
                            className={`${
                                data?.more_details &&
                                Object.keys(data.more_details).length > 0
                                    ? 'flex'
                                    : 'hidden'
                            } bg-white p-4 rounded-lg flex-col gap-6`}
                        >
                            {data?.more_details &&
                                Object.keys(data.more_details).map(
                                    (element, index) => (
                                        <div key={element || index}>
                                            <p className="pb-2 font-semibold text-lg">
                                                {element}
                                            </p>
                                            <p className="text-base break-words">
                                                {data.more_details[element]}
                                            </p>
                                        </div>
                                    )
                                )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="bg-green-200 text-green-700 lg:p-2 p-3 rounded-full w-fit">
                        <p className="text-md font-medium leading-[14px]">
                            10 min
                        </p>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold">
                        {data.name}
                    </h1>
                    <p className="text-secondary-100 font-bold text-xl">
                        {data.unit}
                    </p>
                    <Divider />

                    <div className="flex items-center gap-8">
                        <p className="text-3xl lg:text-4xl font-bold text-secondary-200">
                            {DisplayPriceInVND(
                                pricewithDiscount(data.price, data.discount)
                            )}
                        </p>
                        {data.discount > 0 && (
                            <div className="flex items-center gap-3 text-base">
                                <p className="line-through text-gray-400">
                                    {DisplayPriceInVND(data.price)}
                                </p>
                                <span
                                    className="bg-primary border-2 border-secondary-200 text-secondary-200 font-semibold
                                px-3 rounded-full shadow"
                                >
                                    -{data.discount}%
                                </span>
                            </div>
                        )}
                    </div>

                    <div>
                        {data.stock === 0 ? (
                            <p className="text-lg text-rose-600 my-2">
                                Out of Stock
                            </p>
                        ) : (
                            <div className="flex items-center gap-14 mt-2">
                                <AddToCartButton data={data} />
                                <button
                                    onClick={redirectToCartPage}
                                    className="bg-primary-3 hover:opacity-80 text-secondary-200 lg:px-6 px-7 py-3
                                rounded-lg font-bold shadow-md shadow-secondary-100"
                                >
                                    Mua ngay
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 bg-primary-100 p-4 rounded-lg shadow-md">
                        <h2 className="font-semibold text-lg">
                            Tại sao nên mua sắm tại Ecommerce SHOP?{' '}
                        </h2>
                        <div>
                            <div className="flex items-center gap-4 my-4">
                                <img
                                    src={image1}
                                    alt="superfast delivery"
                                    className="w-20 h-20 object-cover shadow-md shadow-secondary-100 rounded-xl"
                                />
                                <div className="text-base flex flex-col gap-1">
                                    <div className="font-semibold">
                                        Giao hàng siêu tốc
                                    </div>
                                    <p className="text-[15px]">
                                        Nhận hàng ngay tại cửa trong thời gian
                                        ngắn nhất, từ các kho gần bạn.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 my-4">
                                <img
                                    src={image2}
                                    alt="Best prices offers"
                                    className="w-20 h-20 object-cover shadow-md shadow-secondary-100 rounded-xl"
                                />
                                <div className="text-base flex flex-col gap-1">
                                    <div className="font-semibold">
                                        Giá tốt & ưu đãi hấp dẫn
                                    </div>
                                    <p className="text-[15px]">
                                        Mua sắm với mức giá cạnh tranh cùng
                                        nhiều khuyến mãi trực tiếp từ nhà sản
                                        xuất.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 my-4">
                                <img
                                    src={image3}
                                    alt="Wide Assortment"
                                    className="w-20 h-20 object-cover shadow-md shadow-secondary-100 rounded-xl"
                                />
                                <div className="text-base flex flex-col gap-1">
                                    <div className="font-semibold">
                                        Thanh toán an toàn
                                    </div>
                                    <p className="text-[15px]">
                                        Hỗ trợ nhiều phương thức thanh toán bảo
                                        mật.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6 lg:hidden">
                <section className="mt-8 bg-white p-4 rounded-lg">
                    <div className="flex items-center gap-6 border-b border-gray-300">
                        <button
                            onClick={() => setTab('detail')}
                            className={`pb-2 font-bold text-lg px-2 ${
                                tab === 'detail'
                                    ? 'border-b-[3px] border-secondary-200 text-secondary-200'
                                    : 'text-gray-600'
                            }`}
                        >
                            Chi tiết
                        </button>
                        <button
                            onClick={() => setTab('description')}
                            className={`pb-2 font-bold text-lg px-2 ${
                                tab === 'description'
                                    ? 'border-b-[3px] border-secondary-200 text-secondary-200'
                                    : 'text-gray-600'
                            }`}
                        >
                            Mô tả
                        </button>
                        <button
                            onClick={() => setTab('reviews')}
                            className={`pb-2 font-bold text-lg px-2 ${
                                tab === 'reviews'
                                    ? 'border-b-[3px] border-secondary-200 text-secondary-200'
                                    : 'text-gray-600'
                            }`}
                        >
                            Đánh giá
                        </button>
                    </div>

                    <div className="mt-6 px-4">
                        {tab === 'detail' && (
                            <div className="text-gray-700 leading-relaxed break-words flex flex-col gap-3">
                                <div className="flex gap-4">
                                    <span className="font-semibold">
                                        Danh mục:{' '}
                                    </span>
                                    <div className="flex flex-wrap gap-5">
                                        {data?.category &&
                                        data.category.length > 0 ? (
                                            data.category.map((cat, index) => (
                                                <Link
                                                    ref={containerRef}
                                                    key={cat._id || index}
                                                    onClick={() =>
                                                        handleRedirectProductListPage(
                                                            cat._id,
                                                            cat.name
                                                        )
                                                    }
                                                    className="hover:underline text-blue-600 font-semibold"
                                                >
                                                    {cat.name}
                                                </Link>
                                            ))
                                        ) : (
                                            <span className="italic text-gray-500 break-words">
                                                Không có danh mục
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <span className="font-semibold">
                                        Số lượng còn lại:
                                    </span>
                                    {data.stock}
                                </div>
                                <div className="flex gap-4">
                                    <span className="font-semibold">
                                        Đơn vị tính:
                                    </span>
                                    {data.unit}
                                </div>
                            </div>
                        )}
                        {tab === 'description' && (
                            <p className="text-gray-700 leading-relaxed break-words">
                                {data?.description &&
                                data.description.trim() !== '' ? (
                                    data.description
                                ) : (
                                    <span className="italic text-gray-500">
                                        Sản phẩm này hiện chưa có mô tả.
                                    </span>
                                )}
                            </p>
                        )}
                        {tab === 'reviews' && (
                            <p className="italic text-gray-500 break-words">
                                Chưa có đánh giá nào.
                            </p>
                        )}
                    </div>
                </section>

                <div
                    className={`${
                        data?.more_details &&
                        Object.keys(data.more_details).length > 0
                            ? 'flex'
                            : 'hidden'
                    } bg-white p-4 rounded-lg flex-col gap-6`}
                >
                    {data?.more_details &&
                        Object.keys(data.more_details).map((element, index) => (
                            <div key={element || index}>
                                <p className="pb-2 font-semibold text-lg">
                                    {element}
                                </p>
                                <p className="text-base break-words">
                                    {data.more_details[element]}
                                </p>
                            </div>
                        ))}
                </div>
            </div>

            <div
                className="mt-10 lg:mb-4 bg-primary-100 p-4 py-6 shadow-md rounded-lg
            flex flex-col gap-4"
            >
                <h2 className="text-xl font-bold text-secondary-200">
                    Sản phẩm tương tự
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {relatedProducts.length > 0 ? (
                        relatedProducts.map((item) => (
                            <CardProduct key={item._id} data={item} />
                        ))
                    ) : (
                        <p className="text-gray-500">
                            Không có sản phẩm tương tự.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ProductDisplayPage;
