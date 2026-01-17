"use client"

interface Column {
  key: string
  label: string
  format?: "currency" | "percent" | "number" | "date"
}

interface DataTableProps {
  title: string
  data: Record<string, unknown>[]
  columns: Column[]
}

export function DataTable({ title, data, columns }: DataTableProps) {
  const formatValue = (value: unknown, format?: string) => {
    if (value === null || value === undefined) return "-"

    if (typeof value === "number") {
      switch (format) {
        case "currency":
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(value)
        case "percent":
          return `${value.toFixed(1)}%`
        case "number":
          return new Intl.NumberFormat("en-US").format(value)
        default:
          return String(value)
      }
    }

    if (format === "date" && typeof value === "string") {
      try {
        return new Date(value).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      } catch {
        return value
      }
    }

    return String(value)
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4" data-slot="data-table">
        <div className="text-sm font-medium text-foreground mb-3">{title}</div>
        <div className="text-xs text-muted-foreground">No data available</div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden" data-slot="data-table">
      <div className="px-4 py-3 border-b border-border">
        <div className="text-sm font-medium text-foreground">{title}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-2.5 text-xs text-foreground"
                  >
                    {formatValue(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
