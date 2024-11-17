'use client';

import { useState } from "react";
import TableBody from "./TableBody";
import TableFilter from "./TableFilter";

export default function Page<T>({ rows, headers }: { rows: string[][], headers: string[]}) {
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(5);

    return (
        <div className="w-full h-full flex flex-col justify-between">
            <TableFilter page={page} rows={rows} rowsPerPage={rowsPerPage}>
                {(visableRows) => (
                    <TableBody headers={headers} rows={visableRows} />
                )}
            </TableFilter>

            <div className="flex flex-row gap-4">
                <button onClick={() => setPage(page - 1)} disabled={page === 0}>Previous</button>
                <button onClick={() => setPage(page + 1)} disabled={(page + 1) * rowsPerPage >= rows.length}>Next</button>
            </div>
        </div>
    )
}