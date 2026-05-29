import type { StyleLike } from 'ol/style/Style';
import { DrawerStyle } from '@/geo/style/drawer-style';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import { type StyleProps } from '@/core/stores/states/drawer-state';
import type { UIDomain } from '@/core/domains/ui-domain';
import type { MapViewer } from '@/geo/map/map-viewer';
import { HandleType } from '@/geo/interaction/transform/transform';
/**
 * Controller responsible for drawer interactions, keyboard shortcuts, and
 * bridging the drawer state with the UI domain and map projection changes.
 */
export declare class DrawerController extends AbstractMapViewerController {
    #private;
    /** The geometry group key used for all drawer features */
    static readonly DRAW_GROUP_KEY = "draw-group";
    /** Maximum history size */
    static readonly MAX_HISTORY_SIZE = 50;
    /** Tolerance for comparing style values */
    static readonly STYLE_TOLERANCE = 0.1;
    /** Hit tolerance for mouse-based editing interactions */
    static readonly MOUSE_HIT_TOLERANCE = 5;
    /** Hit tolerance for keyboard-based editing interactions (crosshair) */
    static readonly KEYBOARD_HIT_TOLERANCE = 20;
    /** The ID for the shortcuts indicator element */
    static readonly SHORTCUTS_INDICATOR_ID = "shortcuts-enabled";
    /** The default icon source as a base64-encoded SVG data URI */
    static readonly DEFAULT_ICON_SOURCE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03bTAgOS41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNXMxLjEyLTIuNSAyLjUtMi41IDIuNSAxLjEyIDIuNSAyLjUtMS4xMiAyLjUtMi41IDIuNSIgZmlsbD0icmdiYSgyNTIsIDI0MSwgMCwgMC4zKSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEuMyIvPjwvc3ZnPg==";
    /**
     * Creates an instance of DrawerController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller
     * @param controllerRegistry - The controller registry for accessing sibling controllers
     * @param uiDomain - The UI domain instance to associate with this controller
     */
    constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry, uiDomain: UIDomain);
    /**
     * Hooks the controller into action.
     */
    protected onHook(): void;
    /**
     * Unhooks the controller from the action.
     */
    protected onUnhook(): void;
    /**
     * Starts a drawing operation with the specified geometry type.
     *
     * @param geomType - Optional geometry type to draw (uses current state if not provided)
     * @param styleInput - Optional style properties to use
     */
    startDrawing(geomType?: string, styleInput?: StyleProps): void;
    /**
     * Stops the current drawing operation.
     */
    stopDrawing(registerHandlers?: boolean): void;
    /**
     * Toggles the drawing state.
     */
    toggleDrawing(): void;
    /**
     * Initiates editing interactions.
     */
    startEditing(): void;
    /**
     * Stops the editing interaction for all groups.
     */
    stopEditing(registerHandlers?: boolean): void;
    /**
     * Toggles the editing state.
     */
    toggleEditing(): void;
    /**
     * Starts snapping interactions.
     */
    startSnapping(): void;
    /**
     * Stops snapping interactions.
     */
    stopSnapping(): void;
    /**
     * Toggles the snapping state.
     */
    toggleSnapping(): void;
    /**
     * Deletes a single drawing feature from the map.
     *
     * @param featureId - The ID of the feature to be deleted
     */
    deleteSingleDrawing(featureId: string): void;
    /**
     * Clears all drawings from the map.
     *
     * @param saveHistory - Optional flag to determine whether to save this action to history (default: true)
     */
    clearDrawings(saveHistory?: boolean): void;
    /**
     * Refreshes the interaction instances.
     *
     */
    refreshInteractionInstances(): void;
    /**
     * Refreshes the snapping instance by stopping and restarting it.
     *
     */
    refreshSnappingInstance(): void;
    /**
     * Toggles the measurement overlays on the map.
     *
     */
    toggleHideMeasurements(): void;
    /**
     * Sets the active geometry type and refreshes the interaction instances.
     *
     * @param geomType - The geometry type to set as active
     */
    setActiveGeom(geomType: string): void;
    /**
     * Sets the fill color in the store and updates the feature style.
     *
     * @param fillColor - The fill color value
     */
    setFillColor(fillColor: string): void;
    /**
     * Sets the stroke color in the store and updates the feature style.
     *
     * @param strokeColor - The stroke color value
     */
    setStrokeColor(strokeColor: string): void;
    /**
     * Sets the stroke width in the store and updates the feature style.
     *
     * @param strokeWidth - The stroke width value
     */
    setStrokeWidth(strokeWidth: number): void;
    /**
     * Sets the drawer icon source in the store.
     *
     * @param iconSrc - The icon source value
     */
    setDrawerIconSrc(iconSrc: string): void;
    /**
     * Sets the icon size in the store and updates the feature style.
     *
     * @param iconSize - The icon size value
     */
    setDrawerIconSize(iconSize: number): void;
    /**
     * Sets the text value in the store and updates the feature style.
     *
     * @param text - The text content
     */
    setTextValue(text: string | string[]): void;
    /**
     * Sets the text size in the store and updates the feature style.
     *
     * @param size - The text size in pixels
     */
    setTextSize(size: number): void;
    /**
     * Sets the text font in the store and updates the feature style.
     *
     * @param font - The font family name
     */
    setTextFont(font: string): void;
    /**
     * Sets the text color in the store and updates the feature style.
     *
     * @param color - The text color value
     */
    setTextColor(color: string): void;
    /**
     * Sets the text halo color in the store and updates the feature style.
     *
     * @param color - The halo color value
     */
    setTextHaloColor(color: string): void;
    /**
     * Sets the text halo width in the store and updates the feature style.
     *
     * @param width - The halo width value
     */
    setTextHaloWidth(width: number): void;
    /**
     * Sets the text bold state in the store and updates the feature style.
     *
     * @param bold - Whether the text should be bold
     */
    setTextBold(bold: boolean): void;
    /**
     * Sets the text italic state in the store and updates the feature style.
     *
     * @param italic - Whether the text should be italic
     */
    setTextItalic(italic: boolean): void;
    /**
     * Sets the text rotation in the store and updates the feature style.
     *
     * @param rotation - The rotation angle
     */
    setTextRotation(rotation: number): void;
    /**
     * Refreshes the draw instance and updates the style of any transforming feature.
     */
    updateFeatureStyle(): void;
    /**
     * Updates the style of any currently transforming features.
     *
     * @param newStyle - The new style to apply
     */
    updateTransformingFeatureStyle(newStyle: StyleProps): void;
    /**
     * Enables or disables keyboard shortcuts for the drawer.
     *
     * @param enabled - Whether to enable or disable keyboard shortcuts
     */
    setShortcutsEnabled(enabled: boolean): void;
    /**
     * Adds a coordinate to the current drawing when using keyboard/crosshair input.
     *
     * @param coordinate - The map coordinate to add as a vertex
     * @returns Whether the coordinate was added successfully
     */
    addCoordinateToDrawing(coordinate: number[]): boolean;
    /**
     * Finishes the current drawing when using keyboard/crosshair input.
     */
    finishCurrentDrawing(): void;
    /**
     * Handles a shift-click action at the given coordinate (keyboard equivalent: Shift+Enter/Space).
     *
     * @param coordinate - The map coordinate where the shift-click occurred
     * @returns Whether the shift-click was handled
     */
    handleShiftClickAtCoordinate(coordinate: number[]): boolean;
    /**
     * Selects or deselects a feature at the given coordinate for editing.
     *
     * @param coordinate - The map coordinate to check for features
     * @returns Whether a feature was selected/deselected
     */
    handleEditingAtCoordinate(coordinate: number[]): boolean;
    /**
     * Grabs a handle at the given coordinate for keyboard-based transformation.
     *
     * @param coordinate - The map coordinate to check for handles
     * @returns Whether a handle was successfully grabbed
     */
    grabHandleForKeyboard(coordinate: number[]): boolean;
    /**
     * Grabs a handle at the given coordinate for keyboard-based transformation (Keyboard / Crosshair).
     *
     * @param coordinate - The map coordinate to check for handles
     * @returns The handle type if a handle was grabbed, otherwise undefined
     */
    grabHandleAtCoordinate(coordinate: number[]): HandleType | undefined;
    /**
     * Applies the currently grabbed transformation to a new coordinate.
     *
     * @param newCoordinate - The coordinate to apply the transformation to
     * @returns Whether the transformation was successfully applied
     */
    applyGrabbedTransform(newCoordinate: number[]): boolean;
    /**
     * Cancels any currently grabbed transformation and restores handle highlights.
     */
    cancelGrabbedTransform(): void;
    /**
     * Checks if a handle is currently grabbed for transformation.
     *
     * @returns Whether a handle is grabbed
     */
    isHandleGrabbed(): boolean;
    /**
     * Applies a transformation from a start coordinate to an end coordinate using the specified handle type (Keyboard / Crosshair).
     *
     * @param startCoordinate - The starting coordinate where the handle was grabbed
     * @param endCoordinate - The ending coordinate where the handle should be moved to
     * @param handleType - The type of handle being transformed
     * @returns Whether the transformation was successfully applied
     */
    applyTransformFromCoordinates(startCoordinate: number[], endCoordinate: number[], handleType: HandleType): boolean;
    /**
     * Cycles to the next or previous geometry type.
     *
     * @param forward - Whether to cycle forward (true) or backward (false)
     */
    cycleGeometryType(forward?: boolean): void;
    /**
     * Opens the style menu and focuses the first input.
     */
    openStyleMenu(): void;
    /**
     * Triggers the file upload dialog for importing drawings.
     */
    triggerUploadDialog(): void;
    /**
     * Enables keyboard shortcuts for drawing operations.
     *
     * Note: Undo/redo shortcuts are always enabled and not affected by this method.
     */
    enableKeyboardShortcuts(): void;
    /**
     * Disables keyboard shortcuts for drawing operations.
     *
     * Note: Undo/redo shortcuts remain active and are not affected by this method.
     */
    disableKeyboardShortcuts(): void;
    /**
     * Checks if keyboard shortcuts are currently enabled.
     *
     * @returns Whether keyboard shortcuts are enabled
     */
    isKeyboardShortcutsEnabled(): boolean;
    /**
     * Undoes the last drawer action.
     *
     * @returns Whether the action was successful
     */
    undo(): boolean;
    /**
     * Redoes the next drawer action.
     *
     * @returns Whether the action was successful
     */
    redo(): boolean;
    /**
     * Cleans up resources for a map.
     */
    cleanup(): void;
    /**
     * Downloads drawings as GeoJSON with embedded styles.
     *
     */
    downloadDrawings(): void;
    /**
     * Uploads and loads drawings from a GeoJSON file.
     *
     * @param file - The GeoJSON file
     */
    uploadDrawings(file: File): void;
    /**
     * Clones a given style or array of styles.
     *
     * @param styleLike - The style or array of styles to clone
     * @returns A cloned style or array of cloned styles
     */
    static cloneStyle(styleLike: StyleLike): DrawerStyle | DrawerStyle[];
}
//# sourceMappingURL=drawer-controller.d.ts.map