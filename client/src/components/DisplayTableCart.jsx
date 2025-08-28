import React from 'react';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import NoData from './NoData';

const DisplayTableCart = ({ data, column }) => {
    const table = useReactTable({
        data: data || [],
        columns: column,
        getCoreRowModel: getCoreRowModel(),
    });

    if (!data || data.length === 0) {
        return <NoData />;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead className="bg-primary-100 text-secondary-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className={`border px-1 py-2 sm:p-2 border-b-4 border-b-secondary-100 text-center sm:text-base text-xs ${
                                        header.column.columnDef.meta
                                            ?.className || ''
                                    }`}
                                >
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
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-base-100">
                            {row.getVisibleCells().map((cell) => (
                                <td
                                    key={cell.id}
                                    className={`border px-1 py-2 sm:p-2 sm:text-base text-xs ${
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

export default DisplayTableCart;
