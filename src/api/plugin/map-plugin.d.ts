import type { Root } from 'react-dom/client';
import { AbstractPlugin } from './abstract-plugin';
/**
 * Map Plugin abstract class.
 */
export declare abstract class MapPlugin extends AbstractPlugin {
    /** The root for the mounted Map Plugin */
    reactRoot?: Root;
    /**
     * Overridable function to create map plugin actual content
     * @returns JSX.Element The map plugin actual content
     */
    protected onCreateContent(): JSX.Element;
    /**
     * Called when a map plugin is being added
     */
    protected onAdd(): void;
    /**
     * Called when a map plugin is being removed
     */
    protected onRemove(): void;
}
//# sourceMappingURL=map-plugin.d.ts.map