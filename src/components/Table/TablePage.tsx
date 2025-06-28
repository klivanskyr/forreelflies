'use client';

import { useState } from "react";
import TableBody from "./TableBody";
import TableFilter from "./TableFilter";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Page({ rows, headers }: { rows: JSX.Element[][], headers: JSX.Element[]}) {
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, ] = useState<number>(10);

    // Calculate total pages
    const totalPages = Math.ceil(rows.length / rowsPerPage);
    const hasItems = rows.length > 0;

    return (
        <div className="w-full h-full flex flex-col justify-between">
            <TableFilter page={page} rows={rows} rowsPerPage={rowsPerPage}>
                {(visableRows) => (
                    <TableBody headers={headers} rows={visableRows} />
                )}
            </TableFilter>

            {/* Only show pagination if there are items */}
            {hasItems && (
                <div className="flex flex-row items-center justify-center p-6 gap-6">
                    <button 
                        onClick={() => setPage(page - 1)} 
                        disabled={page === 0}
                        className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 disabled:hover:bg-transparent transition-colors"
                    >
                        <FaChevronLeft className={`w-[20px] h-[20px] ${page === 0 ? "text-gray-400" : "text-gray-700 hover:text-gray-900"}`} />
                    </button>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Page {page + 1} of {totalPages}</span>
                        <span>•</span>
                        <span>{rows.length} total items</span>
                    </div>
                    
                    <button 
                        onClick={() => setPage(page + 1)} 
                        disabled={(page + 1) * rowsPerPage >= rows.length}
                        className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 disabled:hover:bg-transparent transition-colors"
                    >
                        <FaChevronRight className={`w-[20px] h-[20px] ${(page + 1) * rowsPerPage >= rows.length ? "text-gray-400" : "text-gray-700 hover:text-gray-900"}`} />
                    </button>
                </div>
            )}
        </div>
    )
}