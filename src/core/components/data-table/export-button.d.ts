import { ReactElement } from 'react';
import { type MRT_ColumnDef as MRTColumnDef } from 'material-react-table';
import { ColumnsType } from './data-table-types';
interface ExportButtonProps {
    rows: ColumnsType[];
    columns: MRTColumnDef<ColumnsType>[];
    children?: ReactElement | undefined;
}
/**
 * Custom  export button which will help to download data table data in csv format.
 * @param {ColumnsType} rows list of rows to be displayed in data table
 * @param {MRTColumnDef<ColumnsType>[]} columns array of object represent column header data.
 * @param {ReactElement} children Menu item to be rendered in Menu.
 * @returns {JSX.Element} returns export button
 *
 */
declare function ExportButton({ rows, columns, children }: ExportButtonProps): JSX.Element;
export default ExportButton;
