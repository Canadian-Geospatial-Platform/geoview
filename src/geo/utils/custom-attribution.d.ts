import OLAttribution, { Options } from 'ol/control/Attribution';
/**
 * Custom Attribution control that extends Openlayers Attribution control.
 * Class adds title to attribution text to show a tooltip when mouse is over it.
 *
 * @class CustomAttribution
 */
export declare class CustomAttribution extends OLAttribution {
    attributions: string[];
    mapId: string;
    /**
     * Constructor that enables attribution text tooltip.
     *
     * @param {Options} optOptions control options
     */
    constructor(optOptions: Options, mapId: string);
    /**
     * Format the attribution element by removing duplicate
     */
    formatAttribution(): void;
}
