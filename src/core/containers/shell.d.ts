import { MapViewer } from '@/geo/map/map-viewer';
type ShellProps = {
    mapViewer: MapViewer;
};
/**
 * Create a shell component to wrap the map and other components not inside the map
 * @param {ShellProps} props the shell properties
 * @returns {JSX.Element} the shell component
 */
export declare function Shell(props: ShellProps): JSX.Element;
export {};
