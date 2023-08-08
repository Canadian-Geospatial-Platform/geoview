/// <reference types="react" />
import { Features } from './map-data-table';
interface JSONExportButtonProps {
    features: Features[];
    layerId: string;
}
/**
 * Custom  GeoJson export button which will help to download data table data in geojson format.
 * @param {Features[]} features list of rows to be displayed in data table
 * @param {string} layerId id of the layer
 * @returns {JSX.Element} returns Menu Item
 *
 */
declare function JSONExportButton({ features, layerId }: JSONExportButtonProps): JSX.Element;
export default JSONExportButton;
