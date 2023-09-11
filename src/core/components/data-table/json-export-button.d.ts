/// <reference types="react" />
import { Projection } from 'ol/proj';
import { MapDataTableDataEntrys } from './map-data-table';
interface JSONExportButtonProps {
    features: MapDataTableDataEntrys[];
    layerId: string;
    projectionConfig: Projection;
}
/**
 * Custom  GeoJson export button which will help to download data table data in geojson format.
 * @param {MapDataTableDataEntrys[]} features list of rows to be displayed in data table
 * @param {string} layerId id of the layer
 * @param {Projection} projectionConfig projection config to transfer lat long.
 * @returns {JSX.Element} returns Menu Item
 *
 */
declare function JSONExportButton({ features, layerId, projectionConfig }: JSONExportButtonProps): JSX.Element;
export default JSONExportButton;
