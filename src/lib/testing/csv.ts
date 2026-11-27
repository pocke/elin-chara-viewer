// A column left out of a row is written as an empty cell, which the schemas
// read as 0 for numbers and '' for strings.
export const toCsv = <C extends string>(
  columns: readonly C[],
  rows: Partial<Record<C, string>>[]
): string => {
  const quote = (cell: string) => `"${cell.replaceAll('"', '""')}"`;
  const lines = [
    columns,
    ...rows.map((row) => columns.map((column) => row[column] ?? '')),
  ];
  return lines.map((cells) => cells.map(quote).join(',')).join('\n');
};
