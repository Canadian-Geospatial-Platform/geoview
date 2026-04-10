import type { ReactElement } from 'react';
import type { MRT_ColumnDef as MRTColumnDef } from 'material-react-table';
import type { ColumnsType } from './data-table-types';
/** Properties for the ExportButton component. */
interface ExportButtonProps {
    layerPath: string;
    rows: ColumnsType[];
    columns: MRTColumnDef<ColumnsType>[];
    children?: ReactElement | undefined;
}
/**
 * Renders an export button with a menu for downloading data table data.
 *
 * @param props - ExportButton properties
 * @returns The export button element
 */
declare function ExportButton({ layerPath, rows, columns, children }: ExportButtonProps): JSX.Element;
export default ExportButton;
//# sourceMappingURL=export-button.d.ts.map