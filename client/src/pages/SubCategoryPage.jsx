// import React, { useState } from 'react';
// import { useEffect } from 'react';
// import UploadSubCategoryModel from '../components/UploadSubCategoryModel';
// import SummaryApi from '../common/SummaryApi';
// import Axios from '../utils/Axios';
// import AxiosToastError from '../utils/AxiosToastError';
// import DisplayTable from '../components/DisplayTable';
// import { createColumnHelper } from '@tanstack/react-table';
// import ViewImage from '../components/ViewImage';
// import { LuPencil, LuTrash } from 'react-icons/lu';
// import EditSubCategory from '../components/EditSubCategory';
// import Loading from '../components/Loading';
// import ConfirmBox from '../components/ConfirmBox';
// import successAlert from '../utils/successAlert';

// const SubCategoryPage = () => {
//     const [openAddSubCategory, setOpenAddSubCategory] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [data, setData] = useState([]);
//     const columnHelper = createColumnHelper();
//     const [imageURL, setImageURL] = useState('');

//     const [openEdit, setOpenEdit] = useState(false);
//     const [editData, setEditData] = useState({
//         _id: '',
//         name: '',
//         image: '',
//     });

//     const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false);
//     const [deleteSubCategory, setDeleteSubCategory] = useState({
//         _id: '',
//     });

//     const fetchSubCategory = async () => {
//         try {
//             setLoading(true);
//             const response = await Axios({
//                 ...SummaryApi.get_sub_category,
//             });

//             const { data: responseData } = response;

//             if (responseData.success) {
//                 setData(responseData.data);
//             }
//         } catch (error) {
//             AxiosToastError(error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchSubCategory();
//     }, []);

//     const handleDeleteSubCategory = async () => {
//         try {
//             const response = await Axios({
//                 ...SummaryApi.delete_sub_category,
//                 data: deleteSubCategory,
//             });

//             const { data: responseData } = response;

//             if (responseData.success) {
//                 successAlert(responseData.message);
//                 fetchSubCategory();
//                 setOpenConfirmBoxDelete(false);
//             }
//         } catch (error) {
//             AxiosToastError(error);
//         }
//     };

//     const column = [
//         columnHelper.accessor('name', {
//             header: 'Name',
//             cell: (info) => info.getValue(),
//             meta: {
//                 className: 'truncate max-w-[200px] overflow-hidden whitespace-nowrap ',
//             },
//         }),
//         columnHelper.accessor('image', {
//             header: 'Image',
//             cell: ({ row }) => {
//                 return (
//                     <div className="flex justify-center items-center">
//                         <img
//                             src={row.original.image}
//                             alt={row.original.image}
//                             className="w-10 h-10 object-contain cursor-pointer hover:opacity-85"
//                             onClick={() => {
//                                 setImageURL(row.original.image);
//                             }}
//                         />
//                     </div>
//                 );
//             },
//         }),
//         columnHelper.accessor('category', {
//             header: 'Category',
//             cell: ({ row }) => {
//                 return (
//                     <div
//                         className="grid grid-cols-1 sm:grid-cols-2
//                         md:grid-cols-2 lg:grid-cols-3 gap-3 py-2"
//                     >
//                         {row.original.category.map((cate) => {
//                             return (
//                                 <span
//                                     key={cate._id + 'Table'}
//                                     className="shadow-md px-4 text-center truncate max-w-[200px]
//                                     overflow-hidden whitespace-nowrap"
//                                     title={cate.name}
//                                 >
//                                     {cate.name}
//                                 </span>
//                             );
//                         })}
//                     </div>
//                 );
//             },
//         }),
//         columnHelper.accessor('_id', {
//             header: 'Action',
//             cell: ({ row }) => {
//                 return (
//                     <div className="flex items-center justify-center gap-4">
//                         <button
//                             onClick={() => {
//                                 setOpenEdit(true);
//                                 setEditData(row.original);
//                             }}
//                             className="bg-orange-100 hover:bg-orange-200 text-orange-600
//                                     font-bold rounded p-1"
//                         >
//                             <LuPencil size={20} />
//                         </button>
//                         <button
//                             onClick={() => {
//                                 setOpenConfirmBoxDelete(true);
//                                 setDeleteSubCategory(row.original);
//                             }}
//                             className="bg-red-100 hover:bg-red-200 text-red-600
//                                     font-bold rounded p-1"
//                         >
//                             <LuTrash size={20} />
//                         </button>
//                     </div>
//                 );
//             },
//         }),
//     ];

//     return (
//         <section>
//             <div
//                 className="p-2 mb-3 bg-slate-50 rounded shadow-md flex items-center
//             justify-between gap-4"
//             >
//                 <h2 className="font-bold">Sub Category</h2>
//                 <button
//                     onClick={() => setOpenAddSubCategory(true)}
//                     className="text-sm border border-green-400 hover:bg-green-200
//                 rounded py-1 px-6"
//                 >
//                     Add
//                 </button>
//             </div>

//             <div className="overflow-auto w-full max-w-[95vw]">
//                 <DisplayTable data={data} column={column} />
//             </div>

//             {loading && <Loading />}

//             {openAddSubCategory && (
//                 <UploadSubCategoryModel
//                     close={() => setOpenAddSubCategory(false)}
//                     fetchData={fetchSubCategory}
//                 />
//             )}

//             {imageURL && (
//                 <ViewImage url={imageURL} close={() => setImageURL('')} />
//             )}

//             {openEdit && (
//                 <EditSubCategory
//                     close={() => setOpenEdit(false)}
//                     fetchData={fetchSubCategory}
//                     data={editData}
//                 />
//             )}

//             {openConfirmBoxDelete && (
//                 <ConfirmBox
//                     close={() => setOpenConfirmBoxDelete(false)}
//                     cancel={() => setOpenConfirmBoxDelete(false)}
//                     confirm={handleDeleteSubCategory}
//                 />
//             )}
//         </section>
//     );
// };

// export default SubCategoryPage;
