import type { MapViewer } from '@/geo/map/map-viewer';
/** The properties for the shell component. */
type ShellProps = {
    /** The map viewer instance. */
    mapViewer: MapViewer;
};
/**
 * Creates a shell component to wrap the map and other components not inside the map.
 *
 * @param props - The shell properties
 * @returns The shell component
 */
export declare function Shell(props: ShellProps): JSX.Element;
export {};
//# sourceMappingURL=shell.d.ts.map