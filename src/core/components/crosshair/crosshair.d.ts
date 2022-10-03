/// <reference types="react" />
/**
 * Crosshair properties interface
 */
interface CrosshairProps {
    id: string;
}
/**
 * Create a Crosshair when map is focus with the keyboard so user can click on the map
 * @param {CrosshairProps} props the crosshair properties
 * @returns {JSX.Element} the crosshair component
 */
export declare function Crosshair(props: CrosshairProps): JSX.Element;
export {};
