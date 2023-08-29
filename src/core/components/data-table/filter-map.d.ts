import { Dispatch } from 'react';
interface FilterMapProps {
    setMapFiltered: Dispatch<boolean>;
    mapFiltered: boolean;
}
/**
 * Custom  GeoJson export button which will help to download data table data in geojson format.
 * @param {Features[]} features list of rows to be displayed in data table
 * @param {string} layerId id of the layer
 * @returns {JSX.Element} returns Menu Item
 *
 */
declare function FilterMap({ mapFiltered, setMapFiltered }: FilterMapProps): JSX.Element;
export default FilterMap;
