import { TypeFeatureInfoEntry } from '@/api/config/types/map-schema-types';
interface JSONExportButtonProps {
    rows: unknown[];
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
declare function JSONExportButton({ rows, features, layerPath }: JSONExportButtonProps): JSX.Element;
export default JSONExportButton;
//# sourceMappingURL=json-export-button.d.ts.map