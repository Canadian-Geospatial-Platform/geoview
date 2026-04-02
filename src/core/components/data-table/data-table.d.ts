import type { DataTableProps } from './data-table-types';
/**
 * Renders the interactive data table for a single layer.
 *
 * Memoized to avoid re-rendering all layer tables when only one layer's data changes.
 *
 * @param props - DataTable properties
 * @returns The data table element
 */
declare function DataTable({ data, layerPath, containerType }: DataTableProps): JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof DataTable>;
export default _default;
//# sourceMappingURL=data-table.d.ts.map