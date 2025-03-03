'use client';

import { useState } from "react";
import TableBody from "./TableBody";
import TableFilter from "./TableFilter";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Page({ rows, headers }: { rows: JSX.Element[][], headers: JSX.Element[]}) {
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, ] = useState<number>(10);

    return (
        <div className="w-full h-full flex flex-col justify-between">
            <TableFilter page={page} rows={rows} rowsPerPage={rowsPerPage}>
                {(visableRows) => (
                    <TableBody headers={headers} rows={visableRows} />
                )}
            </TableFilter>

            <div className="flex flex-row gap-32 justify-center items-center p-6">
                <button onClick={() => setPage(page - 1)} disabled={page === 0}><FaChevronLeft className={`w-[25px] h-[25px] ${page === 0 ? "text-gray-500" : "text-black"}`} /></button>
                <button onClick={() => setPage(page + 1)} disabled={(page + 1) * rowsPerPage >= rows.length}><FaChevronRight className={`w-[25px] h-[25px] ${(page + 1) * rowsPerPage >= rows.length ? "text-gray-500" : "text-black"}`} /></button>
            </div>
        </div>
    )
}