/// <reference types="react" />
interface FilterMapProps {
    layerKey: string;
    mapId: string;
}
/**
 * Custom Filter map toggle button.
 * @param {string} layerKey key of the layer displayed in the map.
 * @param {string} mapid id of the map
 * @returns {JSX.Element} returns Switch
 *
 */
declare function FilterMap({ layerKey, mapId }: FilterMapProps): JSX.Element;
export default FilterMap;
