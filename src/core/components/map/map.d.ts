import { MapViewer } from '@/geo/map/map-viewer';
type MapProps = {
    viewer: MapViewer;
    mapHeight: string;
};
/**
 * Create a map component
 * @param {MapProps} props - Map props containing the viewer
 *
 * @return {JSX.Element} The map component
 */
export declare function Map(props: MapProps): JSX.Element;
export {};
