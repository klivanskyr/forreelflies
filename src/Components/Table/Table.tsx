import TablePage from './TablePage';

export type Column<T> = {
    label: JSX.Element,
    key: (item: T) => JSX.Element
}

export default function Table<T>({ items, columns }: { items: T[], columns: Column<T>[], itemsPerPage: number }) {
    const rows = items.map((item) => columns.map((column) => column.key(item)));
    const headers = columns.map((column) => column.label);

    return (
        <TablePage headers={headers} rows={rows} />
    );
}
