export default function TableHeader<T>({ children, rows, page, rowsPerPage }: { children: (visableRows: T[][]) => JSX.Element, rows: T[][], page: number, rowsPerPage: number }) {
    return (
        <>
            {children(rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage))}
        </>
    )
}