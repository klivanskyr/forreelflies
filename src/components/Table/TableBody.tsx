export default function TableBody({ headers, rows }: { headers: JSX.Element[], rows: JSX.Element[][] }) {
    return (
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}>
            {headers.map((header, index) => (
                <div key={`header-${index}`} className="font-bold border-b p-2">
                    {header}
                </div>
            ))}

            {rows.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                    <div
                        key={`row-${rowIndex}-col-${colIndex}`}
                        className="p-2 border-b"
                    >
                        {cell}
                    </div>
                ))
            ))}
        </div>
    )
}