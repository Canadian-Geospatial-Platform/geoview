/// <reference types="react" />
import OLMap from 'ol/Map';
type OverwiewMapProps = {
    olMap: OLMap;
};
/**
 * Creates an overview map control and adds it to the map
 * @param {OverwiewMapProps} props - Overview map props containing the viewer
 *
 * @returns {JSX.Element} returns empty container
 */
export declare function OverviewMap(props: OverwiewMapProps): JSX.Element;
export {};
