import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { IDrawerState, StyleProps } from '@/core/stores/store-interface-and-intial-values/drawer-state';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
export declare const DRAW_GROUP_KEY = "draw-group";
/**
 * Event processor focusing on interacting with the drawer state in the store.
 */
export declare class DrawerEventProcessor extends AbstractEventProcessor {
    #private;
    /**
     * Shortcut to get the Drawer state for a given map id
     * @param {string} mapId - The mapId
     * @returns {IDrawerState | undefined} The Drawer state. Forcing the return to also be 'undefined', because
     *                                       there will be no drawerState if the Drawer plugin isn't active.
     *                                       This helps the developers making sure the existence is checked.
     */
    protected static getDrawerState(mapId: string): IDrawerState | undefined;
    /**
     * Initializes the event processor and sets up subscriptions
     * @param {GeoviewStoreType} store - The store to initialize with
     * @returns {Array<() => void>} Array of unsubscribe functions
     */
    onInitialize(store: GeoviewStoreType): Array<() => void>;
    /**
     * Starts a drawing operation with the specified geometry type
     * @param {string} mapId - The map ID
     * @param {string} geomType - The geometry type to draw (optional, uses current state if not provided)
     * @param {StyleProps} styleInput - Optional style properties to use
     */
    static startDrawing(mapId: string, geomType?: string, styleInput?: StyleProps): void;
    /**
     * Stops the current drawing operation
     * @param {string} mapId - The map ID
     */
    static stopDrawing(mapId: string): void;
    /**
     * Toggles the drawing state
     * @param {string} mapId - The map ID
     */
    static toggleDrawing(mapId: string): void;
    /**
     * Initiates editing interactions
     * @param {string} mapId - The map ID
     */
    static startEditing(mapId: string): void;
    /**
     * Stops the editing interaction for all groups
     * @param {string} mapId - The map ID
     */
    static stopEditing(mapId: string): void;
    /**
     * Function to toggle editing state
     * @param {string} mapId - The map ID
     */
    static toggleEditing(mapId: string): void;
    /**
     * Updates the style of any currently transforming features
     * @param {string} mapId - The map ID
     * @param {StyleProps} newStyle - The new style to apply
     */
    static updateTransformingFeatureStyle(mapId: string, newStyle: StyleProps): void;
    /**
     * Delete a single drawing feature from the map
     * @param {string} mapId - The map ID
     * @param {string} featureId - The ID of the feature to be deleted
     */
    static deleteSingleDrawing(mapId: string, featureId: string): void;
    /**
     * Clears all drawings from the map
     * @param {string} mapId - The map ID
     */
    static clearDrawings(mapId: string): void;
    /**
     * Refreshes the interaction instances
     * @param {string} mapId - The map ID
     */
    static refreshInteractionInstances(mapId: string): void;
    /**
     * Toggles the measurement overlays on the map
     * @param {string} mapId - The map ID
     */
    static toggleHideMeasurements(mapId: string): void;
    /**
     * Downloads drawings as GeoJSON with embedded styles
     * @param {string} mapId - The map ID
     */
    static downloadDrawings(mapId: string): void;
    /**
     * Uploads and loads drawings from GeoJSON file
     * @param {string} mapId - The map ID
     * @param {File} file - The GeoJSON file
     */
    static uploadDrawings(mapId: string, file: File): void;
    /**
     * Undoes the last drawer action.
     * @param {string} mapId - The map ID
     * @returns {boolean} If the action was successful
     */
    static undo(mapId: string): boolean;
    /**
     * Redoes the next drawer action.
     * @param {string} mapId - The map ID
     * @returns {boolean} If the action was successful
     */
    static redo(mapId: string): boolean;
    /**
     * Clean up resources for a map
     * @param {string} mapId - The map ID
     */
    static cleanup(mapId: string): void;
}
//# sourceMappingURL=drawer-event-processor.d.ts.map