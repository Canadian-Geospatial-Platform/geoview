import { Dispatch, SetStateAction } from 'react';
import { Extent } from 'ol/extent';
import { Geometry } from 'ol/geom';
export interface Rows {
    geometry: Geometry;
    extent?: Extent;
    featureKey?: string;
    featureIcon?: string;
    featureActions?: unknown;
}
interface MenuDataGridProps {
    mapFiltered: boolean;
    setMapFiltered: Dispatch<SetStateAction<boolean>>;
    rows: Rows[];
    layerKey: string;
}
/**
 * Custom the toolbar/Menu to be displayed in data-grid
 * @param {mapFiltered} mapFiltered boolean value that will allow filteration in data grid.
 * @param {setMapFiltered} setMapFiltered dispatch event for updating mapFiltered state.
 * @param {rows} Row list of rows to be displayed in data grid
 * @param {layerKey} layerKey unique id of layers rendered in map.
 *
 * @return {GridToolbarContainer} toolbar
 */
declare function MenuDataGrid({ mapFiltered, setMapFiltered, rows, layerKey }: MenuDataGridProps): JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof MenuDataGrid>;
export default _default;
