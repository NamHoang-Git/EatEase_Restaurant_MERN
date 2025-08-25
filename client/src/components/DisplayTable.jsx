import React from 'react';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import NoData from './NoData';

const DisplayTable = ({ data, column }) => {
    const table = useReactTable({
        data: data || [],
        columns: column,
        getCoreRowModel: getCoreRowModel(),
    });

    if (!data || data.length === 0) {
        return <NoData />;
    }

    return (
        <div className="p-2 overflow-x-auto">
            {' '}
            {/* Thêm overflow-x-auto */}
            <table className="w-full border-collapse">
                {' '}
                {/* Đặt min-width */}
                <thead className="bg-blue-950 text-white">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            <th className="border py-2 text-center">Sr.No</th>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id} className="border py-2">
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row, index) => (
                        <tr key={row.id} className="hover:bg-gray-100">
                            <td className="text-center border p-2">
                                {index + 1}
                            </td>
                            {row.getVisibleCells().map((cell) => (
                                <td
                                    key={cell.id}
                                    className={`border p-2 ${
                                        cell.column.columnDef.meta?.className ||
                                        ''
                                    }`}
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DisplayTable;
