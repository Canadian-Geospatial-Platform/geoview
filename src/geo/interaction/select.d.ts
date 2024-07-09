import { SelectEvent as OLSelectEvent } from 'ol/interaction/Select';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { Interaction, InteractionOptions } from './interaction';
/**
 * Supported options for select interactions
 */
export type SelectOptions = InteractionOptions & {
    features?: Collection<Feature>;
    style?: TypeFeatureStyle;
    hitTolerance?: number;
};
/**
 * Class used for selecting features on a map.
 * @class Select
 * @extends {Interaction}
 * @exports
 */
export declare class Select extends Interaction {
    #private;
    /**
     * Initializes a Select component.
     * @param {SelectOptions} options - Object to configure the initialization of the Select interaction.
     */
    constructor(options: SelectOptions);
    /**
     * Starts the interaction on the map.
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map.
     */
    stopInteraction(): void;
    /**
     * Gets the selected features.
     * @returns {Collection<Feature<Geometry>>} The selected features.
     */
    getFeatures(): Collection<Feature<Geometry>>;
    /**
     * Registers a select changed event handler.
     * @param {SelectChangedDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onSelectChanged(callback: SelectChangedDelegate): void;
    /**
     * Unregisters a select changed event handler.
     * @param {SelectChangedDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offSelectChanged(callback: SelectChangedDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
type SelectChangedDelegate = EventDelegateBase<Select, OLSelectEvent, void>;
export {};
