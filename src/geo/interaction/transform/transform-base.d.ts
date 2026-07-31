import type { MapBrowserEvent } from 'ol';
import { Pointer as OLPointer } from 'ol/interaction';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type { Coordinate } from 'ol/coordinate';
import type { MapViewer } from '@/geo/map/map-viewer';
import { TransformEvent, TransformSelectionEvent, TransformDeleteFeatureEvent } from './transform-events';
/**
 * Handle types for the transform interaction
 */
export declare enum HandleType {
    BOUNDARY = "boundary",
    ROTATE = "rotate",
    ROTATE_LINE = "rotate-line",
    SCALE = "scale",
    TRANSLATE = "translate",
    STRETCH_N = "stretch-n",
    STRETCH_E = "stretch-e",
    STRETCH_S = "stretch-s",
    STRETCH_W = "stretch-w",
    SCALE_NE = "scale-ne",
    SCALE_SE = "scale-se",
    SCALE_SW = "scale-sw",
    SCALE_NW = "scale-nw",
    DELETE = "delete",
    VERTEX = "vertex",
    EDGE_MIDPOINT = "edge-midpoint"
}
/**
 * OpenLayers Transform interaction for manipulating features on the map.
 */
export declare class OLTransform extends OLPointer {
    #private;
    /** The collection of features to transform */
    features: Collection<Feature>;
    /** The layer used to display handles */
    handleLayer: VectorLayer<VectorSource>;
    /** The source for the handle layer */
    handleSource: VectorSource;
    /** The currently selected feature */
    selectedFeature?: Feature;
    /** The current handle being dragged */
    currentHandle?: Feature;
    /** Options for the transform interaction */
    options: TransformBaseOptions;
    /** The start coordinates when dragging */
    startCoordinate?: Coordinate;
    /** The start geometry when transforming */
    startGeometry?: Geometry;
    /** The center of the feature being transformed */
    center?: Coordinate;
    /** The angle for rotation */
    angle: number;
    /** The map viewer */
    mapViewer?: MapViewer;
    /** Callback invoked when a transformation starts. Bridged to EventHelper delegates by the Transform wrapper. */
    onTransformStart?: (event: TransformEvent) => void;
    /** Callback invoked during an ongoing transformation. Bridged to EventHelper delegates by the Transform wrapper. */
    onTransforming?: (event: TransformEvent) => void;
    /** Callback invoked when a transformation ends. Bridged to EventHelper delegates by the Transform wrapper. */
    onTransformEnd?: (event: TransformEvent) => void;
    /** Callback invoked when a feature is deleted. Bridged to EventHelper delegates by the Transform wrapper. */
    onDeleteFeature?: (event: TransformDeleteFeatureEvent) => void;
    /** Callback invoked when the selected feature changes. Bridged to EventHelper delegates by the Transform wrapper. */
    onSelectionChange?: (event: TransformSelectionEvent) => void;
    /**
     * Initializes a OLTransform component.
     *
     * @param options - Object to configure the initialization
     */
    constructor(options?: TransformBaseOptions);
    /**
     * Handles click events for feature selection and handle interaction.
     *
     * @param event - The map browser event
     * @returns Whether the event was handled
     */
    handleDownEvent(event: MapBrowserEvent<PointerEvent>): boolean;
    /**
     * Handles pointer drag events for feature transformation.
     *
     * @param event - The map browser event
     */
    handleDragEvent(event: MapBrowserEvent<PointerEvent>): void;
    /**
     * Handles pointer up events to finalize transformation.
     *
     * @param event - The map browser event
     * @returns Whether the event was handled
     */
    handleUpEvent(event: MapBrowserEvent<PointerEvent>): boolean;
    /**
     * Handles pointer move events for cursor updates.
     *
     * Not to be confused with moving handles. This overrides the move event from OL Pointer.
     *
     * @param event - The map browser event
     */
    handleMoveEvent(event: MapBrowserEvent<PointerEvent>): void;
    /**
     * Handles all events, including double-click.
     *
     * @param event - The map browser event
     * @returns Whether the event was handled
     */
    handleEvent(event: MapBrowserEvent<PointerEvent>): boolean;
    /**
     * Cleans up the interaction.
     */
    dispose(): void;
    /**
     * Selects a feature for transformation.
     *
     * @param feature - The feature to select
     * @param clearHistory - Whether to clear the history
     */
    selectFeature(feature: Feature<Geometry>, clearHistory?: boolean): void;
    /**
     * Checks if a feature is currently being transformed.
     *
     * @param feature - The feature to check
     * @returns True if the feature is being transformed
     */
    isFeatureBeingTransformed(feature: Feature): boolean;
    /**
     * Gets the currently selected/transforming feature.
     *
     * @returns The selected feature or undefined
     */
    getSelectedFeature(): Feature | undefined;
    /**
     * Checks if any transformation is currently active.
     *
     * @returns True if transformation is active
     */
    isTransforming(): boolean;
    /**
     * Clears the current selection.
     *
     * @param keepHistory - Whether the history should be kept when clearing the selection
     */
    clearSelection(keepHistory?: boolean): void;
    /**
     * Initializes transformation state for keyboard-based transformations (Keyboard / Crosshair).
     * Sets up all necessary state that would normally be set by mouse-down event.
     *
     * @param coordinate - The coordinate where the transformation begins
     * @param handleType - The type of handle being transformed
     * @returns True if a transformation was started, false if just an action was performed (e.g., vertex added, feature deleted)
     */
    beginKeyboardTransform(coordinate: Coordinate, handleType: HandleType): boolean;
    /**
     * Applies a transformation from a grabbed coordinate to a new coordinate (Keyboard / Crosshair).
     * Handles all transformation types internally based on the handle type.
     *
     * @param startCoordinate - The coordinate where the handle was grabbed
     * @param endCoordinate - The coordinate to transform to
     * @param handleType - The type of handle being transformed
     * @returns Whether the transformation was successfully applied
     */
    applyKeyboardTransformFromCoordinates(startCoordinate: number[], endCoordinate: number[], handleType: HandleType): boolean;
    /**
     * Restores all handles by recreating them.
     */
    restoreHandleStyle(): void;
    /**
     * Deletes a vertex at the specified coordinate if one exists.
     *
     * @param coordinate - The coordinate to check for a vertex
     * @returns Whether a vertex was deleted
     */
    deleteVertexAtCoordinate(coordinate: Coordinate): boolean;
    /**
     * Creates handles for the selected feature.
     */
    createHandles(): void;
    /**
     * Clears all handles.
     */
    clearHandles(): void;
    /**
     * Updates the handles to match the new geometry.
     */
    updateHandles(): void;
    /**
     * Creates a simple text editor for text features
     */
    showTextEditor(): void;
    /**
     * Undoes the last transformation.
     *
     * @returns True if undo was successful
     */
    undo(callback?: () => void): boolean;
    /**
     * Redoes the next transformation.
     *
     * @returns True if redo was successful
     */
    redo(callback?: () => void): boolean;
    /**
     * Checks if undo is available.
     *
     * @returns True if undo is available
     */
    canUndo(): boolean;
    /**
     * Checks if redo is available.
     *
     * @returns True if redo is available
     */
    canRedo(): boolean;
    /**
     * Gets the cursor style for a handle type.
     *
     * @param handleType - The handle type
     * @returns The cursor style
     */
    static getCursorForHandleType(handleType: HandleType): string;
    /**
     * Gets the event type from a handle type.
     *
     * @param handleType - The handle type
     * @param suffix - The event suffix (start, ing, end)
     * @returns The event type
     */
    static getEventTypeFromHandleType(handleType: HandleType, suffix: string): string;
    /**
     * Rotates a coordinate around a center point by an angle.
     *
     * @param coordinate - The coordinate to rotate
     * @param center - The center point
     * @param angle - The angle in radians
     * @returns The rotated coordinate
     */
    static rotateCoordinate(coordinate: Coordinate, center: Coordinate, angle: number): Coordinate;
    /**
     * Scales a coordinate relative to a fixed point.
     *
     * @param coordinate - The coordinate to scale
     * @param fixedPoint - The fixed point
     * @param scaleX - The X scale factor
     * @param scaleY - The Y scale factor
     * @returns The scaled coordinate
     */
    static scaleCoordinate(coordinate: Coordinate, fixedPoint: Coordinate, scaleX: number, scaleY: number): Coordinate;
}
/**
 * Options for the transform interaction
 */
export interface TransformBaseOptions {
    features?: Collection<Feature>;
    source?: VectorSource;
    translate?: boolean;
    scale?: boolean;
    rotate?: boolean;
    stretch?: boolean;
    keepAspectRatio?: boolean;
    hitTolerance?: number;
    enableDelete?: boolean;
    mapViewer?: MapViewer;
}
/**
 * Properties for creating a handle feature.
 */
export interface CreateHandleProps {
    vertexIndex?: number;
    isCircleCenter?: boolean;
    isCircleEdge?: boolean;
}
//# sourceMappingURL=transform-base.d.ts.map