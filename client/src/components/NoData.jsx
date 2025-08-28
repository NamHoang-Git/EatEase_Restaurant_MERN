import React from 'react';
import noDataImage from '../assets/nodata.png';

const NoData = () => {
    return (
        <div className="flex flex-col justify-center items-center w-full mx-auto p-4 gap-2">
            <img
                src={noDataImage}
                alt="No Data"
                className="w-full h-full max-w-xs max-h-xs block"
            />
            <p className="text-slate-400 font-bold">Không có dữ liệu</p>
        </div>
    );
};

export default NoData;
