import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
/** Properties for the JSONExportButton component. */
interface JSONExportButtonProps {
    layerPath: string;
    rows: unknown[];
    features: TypeFeatureInfoEntry[];
}
/**
 * Renders a GeoJSON export menu item for downloading data table data.
 *
 * @param props - JSONExportButton properties
 * @returns The GeoJSON export menu item element
 */
declare function JSONExportButton({ rows, features, layerPath }: JSONExportButtonProps): JSX.Element;
export default JSONExportButton;
//# sourceMappingURL=json-export-button.d.ts.map