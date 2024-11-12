import { AbstractPlugin } from './abstract-plugin';
/** ******************************************************************************************************************************
 * Map Plugin abstract class.
 */
export declare abstract class MapPlugin extends AbstractPlugin {
    /**
     * Overridable function to create map plugin actual content
     * @returns JSX.Element The map plugin actual content
     */
    onCreateContent(): JSX.Element;
    /**
     * Called when a map plugin is being added
     */
    onAdd(): void;
    /**
     * Called when a map plugin is being removed
     */
    onRemove(): void;
}
