/// <reference types="react" />
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
interface JSONExportButtonProps {
    features: TypeFeatureInfoEntry[];
    layerPath: string;
}
/**
 * Custom  GeoJson export button which will help to download data table data in geojson format.
 * @param {TypeFeatureInfoEntry[]} features list of rows to be displayed in data table
 * @param {string} layerPath id of the layer
 * @returns {JSX.Element} returns Menu Item
 *
 */
declare function JSONExportButton({ features, layerPath }: JSONExportButtonProps): JSX.Element;
export default JSONExportButton;
