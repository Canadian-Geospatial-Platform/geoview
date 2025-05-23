import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Extent } from 'ol/extent';
import { TypeHighlightColors, TypeFeatureInfoEntry } from '@/api/config/types/map-schema-types';
import { MapViewer } from '@/geo/map/map-viewer';
import { PointMarkers } from './point-markers';
/**
 * A class to handle highlighting of features
 *
 * @exports
 * @class FeatureHighlight
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
     * Constructor
     * @param {MapViewer} mapViewer - A reference to the map viewer
     */
    constructor(mapViewer: MapViewer);
    /**
     * Initializes the FeatureHightlight with the MapViewer, now that the map is accessible inside the MapViewer.
     */
    init(): void;
    /**
     * Changes the highlight color
     * @param {TypeHighlightColors} color - New color
     */
    changeHighlightColor(color: TypeHighlightColors): void;
    /**
     * Removes feature highlight(s)
     * @param {string} id - Uid of the feature to deselect, or 'all' to clear all
     */
    removeHighlight(id: string): void;
    /**
     * Highlights a feature with a plain overlay
     * @param {TypeFeatureInfoEntry} feature - Feature to highlight
     */
    highlightFeature(feature: TypeFeatureInfoEntry): void;
    /**
     * Highlights a bounding box
     * @param {Extent} extent - Extent to highlight
     * @param {boolean} isLayerHighlight - Optional if it is a layer highlight
     */
    highlightGeolocatorBBox(extent: Extent, isLayerHighlight?: boolean): void;
    /**
     * Removes bounding box highlight
     */
    removeBBoxHighlight(): void;
}
