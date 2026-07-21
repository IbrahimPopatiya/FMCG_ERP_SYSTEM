interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

export function Table<T>({ columns, rows, rowKey, emptyMessage = "No records found." }: TableProps<T>) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500">
            {columns.map((col) => (
              <th key={col.header} className="whitespace-nowrap px-3 py-2 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-zinc-100 last:border-0">
              {columns.map((col) => (
                <td key={col.header} className="whitespace-nowrap px-3 py-2 text-zinc-800">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
