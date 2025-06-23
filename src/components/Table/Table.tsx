import TablePage from './TablePage';

export type Column<T> = {
    label: JSX.Element,
    key: (item: T) => JSX.Element
}

export default function Table<T>({ items, columns, itemsPerPage }: { items: T[], columns: Column<T>[], itemsPerPage: number }) {
    const rows = items.map((item) => columns.map((column) => column.key(item)));
    const headers = columns.map((column) => column.label);

    // If no items, show empty state
    if (items.length === 0) {
        return (
            <div className="w-full">
                {/* Show headers */}
                <div className="bg-gray-50 border-b border-gray-200">
                    <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
                        {headers.map((header, index) => (
                            <div key={index} className="font-medium text-gray-900">
                                {header}
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Empty state message */}
                <div className="text-center py-12 bg-white border-b border-gray-200">
                    <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-2 2m0 0l-2-2m2 2v6"></path>
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                        <p className="text-gray-500">There are no items to display at this time.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <TablePage headers={headers} rows={rows} />
    );
}
