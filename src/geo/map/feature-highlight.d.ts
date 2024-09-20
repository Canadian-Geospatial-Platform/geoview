import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Extent } from 'ol/extent';
import { TypeHighlightColors } from '@config/types/map-schema-types';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypeFeatureInfoEntry } from './map-schema-types';
import { PointMarkers } from '@/core/components/point-markers/point-markers';
/** *****************************************************************************************************************************
 * A class to handle highlighting of features
 *
 * @exports
 * @class FeatureHighlight
 */
export declare class FeatureHighlight {
    #private;
    /** The vector source to use for the animation features */
    highlighSource: VectorSource;
    /** The hidden layer to display animations. */
    overlayLayer: VectorLayer;
    pointMarkers: PointMarkers;
    /**
     * Initializes feature higlight classes
     * @param {MapViewer} mapViewer a reference to the map viewer
     */
    constructor(mapViewer: MapViewer);
    /**
     * Changes the highlight color
     * @param {TypeHighlightColor} color - New color
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
