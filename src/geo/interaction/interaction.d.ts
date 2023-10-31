import { Interaction as OLInteraction } from 'ol/interaction';
import { MapViewer } from '@/geo/map/map-viewer';
/**
 * Options for interactions
 */
export type InteractionOptions = {
    mapViewer: MapViewer;
};
/**
 * Astract Class used for GeoView Interactions
 *
 * @exports
 * @class Interaction
 */
export declare abstract class Interaction {
    options: InteractionOptions;
    mapViewer: MapViewer;
    /**
     * initialize modify component
     * @param {InteractionOptions} options object to configure the initialization of the Interaction mother class
     */
    constructor(options: InteractionOptions);
    /**
     * Starts the drawing interaction on the map
     * @param {OLInteraction} olInteraction the Open Layers Interaction object the map should start interacting on
     */
    protected startInteraction(olInteraction: OLInteraction): void;
    /**
     * Stops the drawing interaction on the map
     * @param {OLInteraction} olInteraction the Open Layers Interaction object the map should stop interacting on
     */
    protected stopInteraction(olInteraction: OLInteraction): void;
}
