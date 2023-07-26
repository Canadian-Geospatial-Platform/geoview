/// <reference types="react" />
import { type MRT_ColumnDef as MRTColumnDef } from 'material-react-table';
import { ColumnsType } from './data-table';
interface ExportButtonProps {
    dataTableData: ColumnsType[];
    columns: MRTColumnDef<ColumnsType>[];
}
/**
 * Custom  export button which will help to download data table data in csv format.
 * @param {ColumnsType} dataTableData list of rows to be displayed in data table
 * @param {MRTColumnDef<ColumnsType>[]} columns array of object represent column header data.
 * @returns {JSX.Element} returns export button
 *
 */
declare function ExportButton({ dataTableData, columns }: ExportButtonProps): JSX.Element;
export default ExportButton;
