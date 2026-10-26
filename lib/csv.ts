type Cell = string | number | boolean | null | undefined

function escapeCell(value: Cell) {
  if (value === null || value === undefined) return ""
  let text = String(value)
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(text) && typeof value !== "number") text = `'${text}`
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

export function toCsv(rows: Record<string, Cell>[]) {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const lines = [headers.map(escapeCell).join(",")]
  for (const row of rows) lines.push(headers.map((header) => escapeCell(row[header])).join(","))
  return lines.join("\r\n")
}

export function downloadCsv(filename: string, rows: Record<string, Cell>[]) {
  const blob = new Blob([`\uFEFF${toCsv(rows)}`], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
