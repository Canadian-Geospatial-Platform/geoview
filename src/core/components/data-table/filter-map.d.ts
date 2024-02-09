/// <reference types="react" />
interface FilterMapProps {
    layerPath: string;
}
/**
 * Custom Filter map toggle button.
 * @param {string} layerPath key of the layer displayed in the map.
 * @param {string} mapid id of the map
 * @returns {JSX.Element} returns Switch
 *
 */
declare function FilterMap({ layerPath }: FilterMapProps): JSX.Element;
export default FilterMap;
