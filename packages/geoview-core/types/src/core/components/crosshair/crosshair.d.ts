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
 * @return {JSX.Element} the north arrow component
 */
export declare function Crosshair(props: CrosshairProps): JSX.Element;
export {};
