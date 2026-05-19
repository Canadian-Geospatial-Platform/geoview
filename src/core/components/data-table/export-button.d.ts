import type { ReactElement } from 'react';
import type { MRT_ColumnDef as MRTColumnDef } from 'material-react-table';
import type { DataTableRow } from './data-table-types';
/** Properties for the ExportButton component. */
interface ExportButtonProps {
    layerPath: string;
    rows: DataTableRow[];
    columns: MRTColumnDef<DataTableRow>[];
    children?: ReactElement | undefined;
}
/**
 * Creates an export button component with CSV download menu.
 *
 * @param props - Properties defined in ExportButtonProps interface
 * @returns The export button element
 */
declare function ExportButton({ layerPath, rows, columns, children }: ExportButtonProps): JSX.Element;
export default ExportButton;
//# sourceMappingURL=export-button.d.ts.map