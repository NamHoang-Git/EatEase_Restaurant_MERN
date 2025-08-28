import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { pricewithDiscount } from '../utils/PriceWithDiscount';
import { DisplayPriceInVND } from '../utils/DisplayPriceInVND';
import AddToCartButton from '../components/AddToCartButton';
import DisplayTableCart from '../components/DisplayTableCart';
import { IoClose } from 'react-icons/io5';
import { FaLongArrowAltLeft, FaRegArrowAltCircleLeft } from 'react-icons/fa';
import NoData from '../components/NoData';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import {
    handleAddItemCart,
    removeFromCart,
    removeSelectedItemsFromCart,
} from '../store/cartProduct';
import toast from 'react-hot-toast';
import { useGlobalContext } from '../provider/GlobalProvider';

const CartPage = () => {
    const { cart } = useSelector((state) => state.cartItem);
    const [selectedItems, setSelectedItems] = useState([]);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { fetchCartItem } = useGlobalContext();

    useEffect(() => {
        const fetchCartItems = async () => {
            // Không gọi API nếu user chưa đăng nhập
            const accessToken = localStorage.getItem('accesstoken');
            if (!accessToken) return;

            try {
                const response = await Axios({
                    url: SummaryApi.get_cart_item.url,
                    method: SummaryApi.get_cart_item.method,
                });
                if (response.data.success) {
                    dispatch(handleAddItemCart(response.data.data));
                } else {
                    toast.error('Lỗi khi tải giỏ hàng');
                }
            } catch (error) {
                toast.error('Lỗi khi tải giỏ hàng: ' + error.message);
            }
        };

        fetchCartItems();

        const { state } = location;
        if (state?.selectedProductId && cart) {
            const productToSelect = cart.find(
                (item) => item.productId._id === state.selectedProductId
            );
            if (
                productToSelect &&
                !selectedItems.includes(productToSelect._id)
            ) {
                setSelectedItems((prev) => [...prev, productToSelect._id]);
            }
        }
    }, [dispatch, location]);

    const toggleSelect = (id) => {
        setSelectedItems((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedItems.length === cart.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cart.map((i) => i._id));
        }
    };

    const totalPrice = cart
        .filter((item) => selectedItems.includes(item._id))
        .reduce(
            (acc, item) =>
                acc +
                pricewithDiscount(
                    item.productId?.price || 0,
                    item.productId?.discount || 0
                ) *
                    (item.quantity || 1),
            0
        );

    const originalTotalPrice = cart
        .filter((item) => selectedItems.includes(item._id))
        .reduce(
            (acc, item) =>
                acc + (item.productId?.price || 0) * (item.quantity || 1),
            0
        );

    const hasDiscount = cart
        .filter((item) => selectedItems.includes(item._id))
        .some((item) => item.productId?.discount > 0);

    const handleRemoveItem = async (id) => {
        try {
            const response = await Axios({
                url: SummaryApi.delete_cart_item.url,
                method: SummaryApi.delete_cart_item.method,
                data: { _id: id },
            });
            if (response.data.success) {
                dispatch(removeFromCart(id)); // Cập nhật Redux ngay lập tức
                await fetchCartItem(); // Đồng bộ với server
                toast.success('Đã xóa sản phẩm');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error('Lỗi khi xóa sản phẩm: ' + error.message);
        }
    };

    const handleRemoveSelectedItems = async () => {
        try {
            for (const id of selectedItems) {
                await Axios({
                    url: SummaryApi.delete_cart_item.url,
                    method: SummaryApi.delete_cart_item.method,
                    data: { _id: id },
                });
            }
            dispatch(removeSelectedItemsFromCart(selectedItems)); // Cập nhật Redux ngay lập tức
            setSelectedItems([]);
            await fetchCartItem(); // Đồng bộ với server
            toast.success('Đã xóa các sản phẩm được chọn');
        } catch (error) {
            toast.error('Lỗi khi xóa sản phẩm: ' + error.message);
        }
    };

    const goToCheckout = () => {
        if (selectedItems.length === 0) return;
        navigate('/checkout', { state: { selectedItems } });
    };

    const columns = [
        {
            header: '',
            accessorKey: 'checkbox',
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={selectedItems.includes(row.original._id)}
                    onChange={() => toggleSelect(row.original._id)}
                    className=""
                />
            ),
            meta: { className: 'sm:w-fit max-w-[35px]' },
        },
        {
            header: 'Sản phẩm',
            accessorKey: 'productId.name',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 sm:gap-4 sm:h-16 h-10">
                    <img
                        src={row.original.productId?.image?.[0] || ''}
                        alt={row.original.productId?.name || ''}
                        className="sm:w-16 w-10 h-full flex-shrink-0 object-cover rounded"
                        onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                        }}
                    />
                    <p className="font-semibold w-full line-clamp-2">
                        {row.original.productId?.name || 'Tên không xác định'}
                    </p>
                </div>
            ),
            meta: { className: 'text-left max-w-48' },
        },
        {
            header: 'Đơn vị',
            accessorKey: 'productId.unit',
            cell: ({ row }) => (
                <p className="font-semibold w-full line-clamp-1">
                    {row.original.productId?.unit || ''}
                </p>
            ),
            meta: { className: 'text-center max-w-24 hidden sm:table-cell' },
        },
        {
            header: 'Số lượng',
            accessorKey: 'quantity',
            cell: ({ row }) => (
                <div className="flex items-center justify-center mx-auto">
                    <AddToCartButton data={row.original.productId} />
                </div>
            ),
            meta: { className: 'sm:max-w-24' },
        },
        {
            header: 'Giá',
            accessorKey: 'price',
            cell: ({ row }) => (
                <div className="lg:flex items-end gap-2 justify-center">
                    <p className="text-[10px] sm:text-base font-bold text-secondary-200">
                        {DisplayPriceInVND(
                            pricewithDiscount(
                                row.original.productId?.price || 0,
                                row.original.productId?.discount || 0
                            )
                        )}
                    </p>
                    {row.original.productId?.discount > 0 && (
                        <p className="text-[10px] sm:text-base text-gray-500 line-through">
                            {DisplayPriceInVND(
                                row.original.productId?.price || 0
                            )}
                        </p>
                    )}
                </div>
            ),
            meta: { className: 'max-w-28' },
        },
        {
            header: '',
            accessorKey: 'action',
            cell: ({ row }) => (
                <button
                    onClick={() => handleRemoveItem(row.original._id)}
                    className="bg-white px-[6px] py-[2px] rounded-md text-secondary-200 hover:opacity-80
                shadow-md border-2 border-inset border-secondary-200 hover:bg-secondary-200 hover:text-white"
                >
                    <IoClose size={16} />
                </button>
            ),
            meta: { className: 'text-center hidden sm:table-cell' },
        },
    ];

    return (
        <section className="container mx-auto min-h-[80vh] px-2 py-6">
            <div
                className="p-3 sm:p-4 mb-3 bg-primary-4 rounded-md shadow-md shadow-secondary-100
                font-bold text-secondary-200 sm:text-lg text-sm uppercase flex items-center gap-2"
            >
                <span onClick={() => navigate('/')} className="cursor-pointer hover:text-secondary-100 sm:hidden block">
                    <FaRegArrowAltCircleLeft size={25} />
                </span>
                <p className="leading-3 mt-1">Giỏ hàng</p>
            </div>

            {cart.length === 0 ? (
                <NoData />
            ) : (
                <div className="bg-white shadow rounded-lg p-2 sm:p-4">
                    <DisplayTableCart data={cart} column={columns} />

                    <div
                        className="flex justify-between items-center mt-6 px-4 py-3 bg-primary-100 shadow-md
                    rounded-lg sm:text-base text-xs"
                    >
                        <div>
                            <p className="font-bold">
                                Tổng cộng ({selectedItems.length} sản phẩm đã
                                chọn):
                            </p>
                            {hasDiscount > 0 && (
                                <p className="text-gray-500 line-through">
                                    {DisplayPriceInVND(originalTotalPrice)}
                                </p>
                            )}
                        </div>
                        <p className="text-base sm:text-xl font-bold text-secondary-200">
                            {DisplayPriceInVND(totalPrice)}
                        </p>
                    </div>

                    <div className="mt-5 flex justify-between gap-4 sm:text-base text-xs">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedItems.length === cart.length
                                    }
                                    onChange={selectAll}
                                    className=""
                                />
                                <span className="font-bold">Chọn tất cả</span>
                            </div>
                            {selectedItems.length > 0 && (
                                <button
                                    onClick={handleRemoveSelectedItems}
                                    className="text-secondary-200 hover:text-secondary-100 font-bold"
                                >
                                    Xóa
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button
                                className="px-4 py-2 border-2 border-inset border-secondary-100 text-secondary-100
                            bg-white hover:bg-secondary-100 hover:text-white rounded-lg font-semibold shadow-lg
                            sm:block hidden"
                                onClick={() => navigate('/')}
                            >
                                Tiếp tục mua sắm
                            </button>
                            <button
                                onClick={goToCheckout}
                                disabled={selectedItems.length === 0}
                                className={`px-4 py-2 rounded-lg font-bold ${
                                    selectedItems.length === 0
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-primary-3 hover:opacity-80 text-secondary-200 rounded-lg font-bold shadow-lg'
                                }`}
                            >
                                Đặt hàng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CartPage;
