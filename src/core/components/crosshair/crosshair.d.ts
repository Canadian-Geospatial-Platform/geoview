/// <reference types="react" />
type CrosshairProps = {
    mapTargetElement: HTMLElement;
};
/**
 * Create a Crosshair when map is focus with the keyboard so user can click on the map
 * @param {CrosshairProps} - Crossahir props who caintain the mapTargetELement
 * @returns {JSX.Element} the crosshair component
 */
export declare function Crosshair({ mapTargetElement }: CrosshairProps): JSX.Element;
export {};
