import { ReactElement } from 'react';
import { type MRT_ColumnDef as MRTColumnDef } from 'material-react-table';
import { ColumnsType } from './data-table-types';
interface ExportButtonProps {
    layerPath: string;
    rows: ColumnsType[];
    columns: MRTColumnDef<ColumnsType>[];
    children?: ReactElement | undefined;
}
/**
 * Custom  export button which will help to download data table data in csv format.
 * @param {string} layerPath id of the layer
 * @param {ColumnsType} rows list of rows to be displayed in data table
 * @param {MRTColumnDef<ColumnsType>[]} columns array of object represent column header data.
 * @param {ReactElement} children Menu item to be rendered in Menu.
 * @returns {JSX.Element} returns export button
 *
 */
declare function ExportButton({ layerPath, rows, columns, children }: ExportButtonProps): JSX.Element;
export default ExportButton;
//# sourceMappingURL=export-button.d.ts.map