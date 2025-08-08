import { Pointer as OLPointer } from 'ol/interaction';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Geometry, Polygon, LineString } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { MapBrowserEvent } from 'ol';
import { TransformEvent, TransformSelectionEvent, TransformDeleteFeatureEvent } from './transform-events';
import { MapViewer } from '@/app';
/**
 * Handle types for the transform interaction
 */
export declare enum HandleType {
    BOUNDARY = "boundary",
    ROTATE = "rotate",
    ROTATE_LINE = "rotate-line",
    SCALE = "scale",
    TRANSLATE = "translate",
    TRANSLATE_CENTER = "translate-center",
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
 * Options for the transform interaction
 */
export interface TransformBaseOptions {
    features?: Collection<Feature>;
    source?: VectorSource;
    translateFeature?: boolean;
    scale?: boolean;
    rotate?: boolean;
    stretch?: boolean;
    keepAspectRatio?: boolean;
    hitTolerance?: number;
    enableDelete?: boolean;
    mapViewer?: MapViewer;
}
export interface CreateHandleProps {
    vertexIndex?: number;
    isCircleCenter?: boolean;
    isCircleEdge?: boolean;
}
/**
 * OpenLayers Transform interaction
 * @class OLTransform
 * @extends {OLPointer}
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
    /** Callback functions for events */
    onTransformstart?: (event: TransformEvent) => void;
    onTransforming?: (event: TransformEvent) => void;
    onTransformend?: (event: TransformEvent) => void;
    onDeletefeature?: (event: TransformDeleteFeatureEvent) => void;
    onSelectionChange?: (event: TransformSelectionEvent) => void;
    /**
     * Initializes a OLTransform component.
     * @param {TransformBaseOptions} options - Object to configure the initialization.
     */
    constructor(options?: TransformBaseOptions);
    /**
     * Handles when a feature is removed from the collection.
     * @param {Event} event - The event.
     */
    onFeatureRemove(event: {
        element: Feature;
    }): void;
    /**
     * Selects a feature for transformation.
     * @param {Feature<Geometry>} feature - The feature to select.
     */
    selectFeature(feature: Feature<Geometry>): void;
    /**
     * Checks if a feature is currently being transformed.
     * @param {Feature} feature - The feature to check.
     * @returns {boolean} True if the feature is being transformed.
     */
    isFeatureBeingTransformed(feature: Feature): boolean;
    /**
     * Gets the currently selected/transforming feature.
     * @returns {Feature | undefined} The selected feature or undefined.
     */
    getSelectedFeature(): Feature | undefined;
    /**
     * Checks if any transformation is currently active.
     * @returns {boolean} True if transformation is active.
     */
    isTransforming(): boolean;
    /**
     * Clears the current selection.
     */
    clearSelection(): void;
    /**
     * Rotates a coordinate around a center point by an angle.
     * @param {Coordinate} coordinate - The coordinate to rotate.
     * @param {Coordinate} center - The center point.
     * @param {number} angle - The angle in radians.
     * @returns {Coordinate} The rotated coordinate.
     */
    static rotateCoordinate(coordinate: Coordinate, center: Coordinate, angle: number): Coordinate;
    /**
     * Scales a coordinate relative to a fixed point
     * @param {Coordinate} coordinate - The coordinate to scale.
     * @param {Coordinate} fixedPoint - The fixed point.
     * @param {number} scaleX - The X scale factor.
     * @param {number} scaleY - The Y scale factor.
     * @returns {Coordinate} The scaled coordinate.
     */
    static scaleCoordinate(coordinate: Coordinate, fixedPoint: Coordinate, scaleX: number, scaleY: number): Coordinate;
    /** Context menu event handler to prevent context menu when removing vertices */
    contextMenuHandler: (e: MouseEvent) => void;
    /**
     * Cleans up the interaction.
     */
    dispose(): void;
    /**
     * Creates handles for the selected feature.
     */
    createHandles(): void;
    /**
     * Creates a handle at the specified coordinate with the given type.
     * @param {Coordinate} coordinate - The coordinate for the handle.
     * @param {HandleType} type - The type of handle.
     */
    createHandle(coordinate: Coordinate, type: HandleType, properties?: CreateHandleProps): void;
    /**
     * Creates the extent boundary rectangle.
     * @param {Extent} extent - The expanded extent.
     */
    createExtentBoundary(extent: Extent): void;
    /**
     * Creates scale handles at the corners of the extent.
     * @param {Extent} extent - The extent of the feature.
     */
    createScaleHandles(extent: Extent): void;
    /**
     * Creates stretch handles at the middle of each side of the extent.
     * @param {Extent} extent - The extent of the feature.
     */
    createStretchHandles(extent: Extent): void;
    /**
     * Creates a rotation handle above the feature.
     * @param {Extent} extent - The extent of the feature.
     */
    createRotateHandle(extent: Extent): void;
    /**
     * Creates a delete handle for the feature.
     * @param {Extent} extent - The extent of the feature.
     */
    createDeleteHandle(extent: Extent): void;
    /**
     * Creates vertex handles for LineString and Polygon geometries.
     * @param {LineString | Polygon} geometry - The geometry to create vertex handles for.
     */
    createVertexHandles(geometry: LineString | Polygon): void;
    /**
     * Gets the cursor style for a handle type.
     * @param {HandleType} handleType - The handle type.
     * @returns {string} The cursor style.
     */
    static getCursorForHandleType(handleType: HandleType): string;
    /**
     * Gets the event type from a handle type.
     * @param {HandleType} handleType - The handle type.
     * @param {string} suffix - The event suffix (start, ing, end).
     * @returns {string} The event type.
     */
    static getEventTypeFromHandleType(handleType: HandleType, suffix: string): string;
    /**
     * Clears all handles.
     */
    clearHandles(): void;
    /**
     * Updates the handles to match the new geometry.
     */
    updateHandles(): void;
    /**
     * Handles translation of a feature.
     * @param {number} deltaX - The change in X coordinate.
     * @param {number} deltaY - The change in Y coordinate.
     */
    handleTranslate(deltaX: number, deltaY: number): void;
    /**
     * Handles rotation of a feature.
     * @param {Coordinate} coordinate - The current coordinate.
     */
    handleRotate(coordinate: Coordinate): void;
    /**
     * Handles scaling of a feature.
     * @param {Coordinate} coordinate - The current coordinate.
     * @param {HandleType} handleType - The type of handle being dragged.
     * @param {boolean} ctrlKey - If the ctrlKey is being pressed to maintain the ratio
     */
    handleScale(coordinate: Coordinate, handleType: HandleType, ctrlKey?: boolean): void;
    /**
     * Handles stretching of a feature.
     * @param {Coordinate} coordinate - The current coordinate.
     * @param {HandleType} handleType - The type of handle being dragged.
     */
    handleStretch(coordinate: Coordinate, handleType: HandleType): void;
    /**
     * Handle Click Events
     * @param {MapBrowserEvent} event - The map browser event.
     * @returns {boolean} Whether the event was handled.
     */
    handleDownEvent(event: MapBrowserEvent<PointerEvent>): boolean;
    /**
     * Handle pointer drag events.
     * @param {MapBrowserEvent} event - The map browser event.
     */
    handleDragEvent(event: MapBrowserEvent<PointerEvent>): void;
    /**
     * Handle pointer up events.
     * @param {MapBrowserEvent} event - The map browser event.
     * @returns {boolean} Whether the event was handled.
     */
    handleUpEvent(event: MapBrowserEvent<PointerEvent>): boolean;
    /**
     * Handle pointer move events. Not to be confused with moving handles.
     * This overrides the move event from OL Pointer
     * @param {MapBrowserEvent} event - The map browser event.
     */
    handleMoveEvent(event: MapBrowserEvent<PointerEvent>): void;
    /**
     * Handles moving a vertex.
     * @param {Coordinate} coordinate - The new coordinate.
     * @param {Feature} vertexHandle - The vertex handle being dragged.
     */
    handleVertexMove(coordinate: Coordinate, vertexHandle?: Feature): void;
    /**
     * Handles adding a new vertex.
     * @param {Coordinate} coordinate - The coordinate for the new vertex.
     * @param {Feature} midpointHandle - The midpoint handle being dragged.
     */
    handleAddVertex(coordinate: Coordinate, midpointHandle?: Feature): void;
    /**
     * Undoes the last transformation.
     * @returns {boolean} True if undo was successful.
     */
    undo(callback?: () => void): boolean;
    /**
     * Redoes the next transformation.
     * @returns {boolean} True if redo was successful.
     */
    redo(callback?: () => void): boolean;
    /**
     * Checks if undo is available.
     * @returns {boolean} True if undo is available.
     */
    canUndo(): boolean;
    /**
     * Checks if redo is available.
     * @returns {boolean} True if redo is available.
     */
    canRedo(): boolean;
}
//# sourceMappingURL=transform-base.d.ts.map