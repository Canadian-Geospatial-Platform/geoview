import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { type StyleProps } from '@/core/stores/store-interface-and-intial-values/drawer-state';
import type { UIDomain } from '@/core/domains/ui-domain';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
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
    /** The default icon source as a base64-encoded SVG data URI */
    static readonly DEFAULT_ICON_SOURCE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03bTAgOS41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNXMxLjEyLTIuNSAyLjUtMi41IDIuNSAxLjEyIDIuNSAyLjUtMS4xMiAyLjUtMi41IDIuNSIgZmlsbD0icmdiYSgyNTIsIDI0MSwgMCwgMC4zKSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEuMyIvPjwvc3ZnPg==";
    /**
     * Creates an instance of DrawerController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller
     * @param uiDomain - The UI domain instance to associate with this controller
     * @param geometryApi - The geometry API instance to associate with this controller
     */
    constructor(mapViewer: MapViewer, uiDomain: UIDomain, geometryApi: GeometryApi);
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
    stopDrawing(): void;
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
    stopEditing(): void;
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
    setTextValue(text: string): void;
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
}
/**
 * Hook to access the DrawerController from the controller context.
 *
 * @returns The drawer controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider.
 * @throws {Error} When the Drawer plugin is not configured.
 */
export declare function useDrawerController(): DrawerController;
//# sourceMappingURL=drawer-controller.d.ts.map