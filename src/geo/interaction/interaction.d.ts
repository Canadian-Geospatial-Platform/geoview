import type { Interaction as OLInteraction } from 'ol/interaction';
import type { MapViewer } from '@/geo/map/map-viewer';
/**
 * Options for interactions
 */
export type InteractionOptions = {
    mapViewer: MapViewer;
};
/**
 * Astract Class used for GeoView Interactions
 *
 * @class Interaction
 * @abstract
 * @exports
 */
export declare abstract class Interaction {
    /** Reference the MapViewer associated with this interaction */
    mapViewer: MapViewer;
    /**
     * Constructs an abstract Interaction component
     * @param {InteractionOptions} options - Object to configure the initialization of the Interaction mother class
     */
    constructor(options: InteractionOptions);
    /**
     * Starts the drawing interaction on the map
     * @param {OLInteraction} olInteraction - The OpenLayers Interaction object the map should start interacting on
     */
    protected startInteraction(olInteraction: OLInteraction): void;
    /**
     * Stops the drawing interaction on the map
     * @param {OLInteraction} olInteraction - The OpenLayers Interaction object the map should stop interacting on
     */
    protected stopInteraction(olInteraction: OLInteraction): void;
}
//# sourceMappingURL=interaction.d.ts.map