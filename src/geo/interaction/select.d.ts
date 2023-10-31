import { Select as OLSelect } from 'ol/interaction';
import { SelectEvent as OLSelectEvent } from 'ol/interaction/Select';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Interaction, InteractionOptions } from './interaction';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
/**
 * Supported options for select interactions
 */
export type SelectOptions = InteractionOptions & {
    features?: Collection<Feature>;
    style?: TypeFeatureStyle;
    hitTolerance?: number;
};
/**
 * Class used for selecting features on a map
 *
 * @exports
 * @class Select
 */
export declare class Select extends Interaction {
    ol_select: OLSelect;
    /**
     * Initialize Select component
     * @param {SelectOptions} options object to configure the initialization of the Select interaction
     */
    constructor(options: SelectOptions);
    /**
     * Starts the interaction on the map
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map
     */
    stopInteraction(): void;
    /**
     * Handles when the selection has changed
     * @param {OLSelectEvent} e object representing the Open Layers event from the interaction
     */
    onSelectChanged: (e: OLSelectEvent) => void;
}
