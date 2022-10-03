/// <reference types="react" />
import { OverviewMap as OLOverviewMap } from 'ol/control';
/**
 * Properties for the overview map toggle
 */
interface OverviewMapToggleProps {
    /**
     * OpenLayers overview map control
     */
    overviewMap: OLOverviewMap;
}
/**
 * Create a toggle icon button
 *
 * @param {OverviewMapToggleProps} props overview map toggle properties
 * @returns {JSX.Element} returns the toggle icon button
 */
export declare function OverviewMapToggle(props: OverviewMapToggleProps): JSX.Element;
export {};
