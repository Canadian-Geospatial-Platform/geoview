/// <reference types="react" />
import { DataGridProps } from '@mui/x-data-grid';
import { TypeDisplayLanguage } from '../../../geo/map/map-schema-types';
/**
 * Create a data grid (table) component for a lyer features all request
 *
 * @param {DataGridProps} props table properties
 * @returns {JSX.Element} returns table component
 */
interface CustomDataGridProps extends DataGridProps {
    rowId: string;
    layerKey: string;
    displayLanguage: TypeDisplayLanguage;
}
export declare function LayerDataGrid(props: CustomDataGridProps): JSX.Element;
export {};
