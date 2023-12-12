/// <reference types="react" />
import { MapDataTableDataEntrys } from './map-data-table';
interface JSONExportButtonProps {
    features: MapDataTableDataEntrys[];
    layerId: string;
}
/**
 * Custom  GeoJson export button which will help to download data table data in geojson format.
 * @param {MapDataTableDataEntrys[]} features list of rows to be displayed in data table
 * @param {string} layerId id of the layer
 * @returns {JSX.Element} returns Menu Item
 *
 */
declare function JSONExportButton({ features, layerId }: JSONExportButtonProps): JSX.Element;
export default JSONExportButton;
