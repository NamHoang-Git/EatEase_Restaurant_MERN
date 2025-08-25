import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { valideURLConvert } from '../utils/valideURLConvert';
import Loading from './../components/Loading';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import CardProduct from '../components/CardProduct';

const ProductListPage = () => {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const params = useParams();
    const AllCategory = useSelector((state) => state.product.allCategory);
    const [displayCategory, setDisplayCategory] = useState([]);

    const category = params?.category?.split('-');
    const categoryId = category?.slice(-1)[0]; // Lấy ID
    // Lấy categoryName từ AllCategory dựa trên categoryId
    const categoryInfo = AllCategory.find((cat) => cat._id === categoryId);
    const categoryName = categoryInfo ? categoryInfo.name : '';

    const fetchProduct = async () => {
        // API lấy sản phẩm theo category list là public, không cần authentication
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_product_by_category_list,
                data: {
                    categoryId: categoryId,
                    page: page,
                    limit: 8,
                },
            });

            const { data: responseData } = response;

            if (responseData.success) {
                if (page === 1) {
                    setData(responseData.data);
                } else {
                    setData((prev) => [...prev, ...responseData.data]);
                }
                setTotalCount(responseData.totalCount);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    // Reset về page 1 khi đổi category
    useEffect(() => {
        setPage(1);
    }, [params.category]);

    useEffect(() => {
        fetchProduct();
    }, [params.category, page]);

    useEffect(() => {
        setDisplayCategory(AllCategory);
    }, [AllCategory]);

    return (
        <section className="sticky top-24 lg:top-20">
            <div
                className="container sticky top-24 mx-auto grid
            grid-cols-[90px,1fr] md:grid-cols-[200px,1fr] lg:grid-cols-[280px,1fr]"
            >
                {/** Category **/}
                <div
                    className="min-h-[88vh] max-h-[88vh] overflow-y-scroll flex flex-col gap-4
                shadow-md scrollbarCustom bg-white py-2"
                >
                    {displayCategory.map((s, index) => {
                        const link = `/${valideURLConvert(s.name)}-${s._id}`;
                        return (
                            <Link
                                key={s._id || index}
                                to={link}
                                className={`w-full p-2 lg:p-1 box-border border-b hover:bg-rose-100
                            cursor-pointer rounded
                                ${categoryId === s._id ? 'bg-rose-200' : ''}`}
                            >
                                <div
                                    className="w-fit p-2 lg:p-1 flex flex-col items-center gap-2 lg:flex lg:flex-row lg:w-full lg:h-16 lg:gap-4
                                mx-auto lg:mx-0 bg-white lg:bg-transparent rounded box-border "
                                >
                                    <img
                                        src={s.image}
                                        alt="category"
                                        className="w-14 lg:bg-white rounded h-full object-cover"
                                    />
                                    <p className="-mt-6 lg:mt-0 text-xs text-center lg:text-left lg:text-base">
                                        {s.name}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/** Product **/}
                <div className="sticky top-20">
                    <div className="bg-white shadow-md p-6 rounded-sm z-10">
                        <h3 className="text-lg font-bold">
                            {categoryName || 'Unknown Category'}
                        </h3>
                    </div>
                    <div>
                        {loading && <Loading />}
                        <div className="min-h-[80vh] max-h-[80vh] overflow-y-auto relative">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 p-4 gap-4">
                                {data.map((p, index) => {
                                    return (
                                        <CardProduct
                                            data={p}
                                            key={
                                                p._id +
                                                'productCategory' +
                                                index
                                            }
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductListPage;
