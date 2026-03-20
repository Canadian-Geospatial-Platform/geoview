import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type { Extent } from 'ol/extent';
import { type TypeHighlightColors, type TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import type { MapViewer } from '@/geo/map/map-viewer';
import { PointMarkers } from './point-markers';
/**
 * A class to handle highlighting of features.
 */
export declare class FeatureHighlight {
    #private;
    /** Reference on the map viewer */
    mapViewer: MapViewer;
    /** The vector source to use for the highlight features */
    highlightSource: VectorSource;
    /** The hidden layer to display highlight. */
    overlayLayer?: VectorLayer;
    pointMarkers?: PointMarkers;
    /**
     * Constructor.
     *
     * @param mapViewer - A reference to the map viewer
     */
    constructor(mapViewer: MapViewer);
    /**
     * Initializes the FeatureHighlight with the MapViewer, now that the map is accessible inside the MapViewer.
     */
    init(): void;
    /**
     * Changes the highlight color.
     *
     * @param color - New color
     */
    changeHighlightColor(color: TypeHighlightColors): void;
    /**
     * Removes feature highlight(s).
     *
     * @param id - Uid of the feature to deselect, or 'all' to clear all
     */
    removeHighlight(id: string): void;
    /**
     * Highlights a feature with a plain overlay.
     *
     * @param feature - Feature to highlight
     */
    highlightFeature(feature: TypeFeatureInfoEntry): void;
    /**
     * Highlights a bounding box.
     *
     * @param extent - Extent to highlight
     * @param isLayerHighlight - Optional if it is a layer highlight
     */
    highlightGeolocatorBBox(extent: Extent, isLayerHighlight?: boolean): void;
    /**
     * Removes bounding box highlight
     */
    removeBBoxHighlight(): void;
}
//# sourceMappingURL=feature-highlight.d.ts.map