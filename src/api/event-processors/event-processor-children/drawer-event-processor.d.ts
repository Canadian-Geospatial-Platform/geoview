import { IDrawerState, StyleProps } from '@/core/stores/store-interface-and-intial-values/drawer-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { GeoviewStoreType } from '@/app';
/**
 * Event processor focusing on interacting with the drawer state in the store.
 */
export declare class DrawerEventProcessor extends AbstractEventProcessor {
    #private;
    /**
     * Shortcut to get the Drawer state for a given map id
     * @param {string} mapId The mapId
     * @returns {IDrawerState | undefined} The Drawer state. Forcing the return to also be 'undefined', because
     *                                       there will be no drawerState if the Drawer plugin isn't active.
     *                                       This helps the developers making sure the existence is checked.
     */
    protected static getDrawerState(mapId: string): IDrawerState | undefined;
    /**
     * Initializes the event processor and sets up subscriptions
     * @param {GeoviewStoreType} store The store to initialize with
     * @returns {Array<() => void>} Array of unsubscribe functions
     */
    onInitialize(store: GeoviewStoreType): Array<() => void>;
    /**
     * Starts a drawing operation with the specified geometry type
     * @param {string} mapId The map ID
     * @param {string} geomType The geometry type to draw (optional, uses current state if not provided)
     * @param {StyleProps} styleInput Optional style properties to use
     */
    static startDrawing(mapId: string, geomType?: string, styleInput?: StyleProps): void;
    /**
     * Stops the current drawing operation
     * @param {string} mapId The map ID
     */
    static stopDrawing(mapId: string): void;
    /**
     * Toggles the drawing state
     * @param {string} mapId The map ID
     */
    static toggleDrawing(mapId: string): void;
    /**
     * Initiates editing interactions
     * @param mapId The map ID
     * @param geomTypes Array of geometry types to start editing
     */
    static startEditing(mapId: string, geomTypes?: string[]): void;
    /**
     * Stops the editing interatction for all groups
     * @param mapId The map ID
     * @param geomTypes Array of geometry types to stop editing
     */
    static stopEditing(mapId: string, geomTypes?: string[]): void;
    /**
     * Function to toggle editing state
     * @param mapId The map ID
     * @param geomTypes Array of geometry types to toggle editing
     */
    static toggleEditing(mapId: string, geomTypes?: string[]): void;
    /**
     * Clears all drawings from the map
     * @param {string} mapId The map ID
     * @param {string[]} geomTypes Array of geometry types to clear
     */
    static clearDrawings(mapId: string, geomTypes?: string[]): void;
    /**
     * Refreshes the interaction instances
     * @param mapId The map ID
     */
    static refreshInteractionInstances(mapId: string): void;
    /**
     * Toggles the measurement overlays on the map
     * @param mapId The map ID
     */
    static toggleHideMeasurements(mapId: string): void;
}
//# sourceMappingURL=drawer-event-processor.d.ts.map