import { Extent } from 'ol/extent';
import { TypeFeatureInfoEntry } from '@/app';
/** *****************************************************************************************************************************
 * A class to handle highlighting of features
 *
 * @exports
 * @class FeatureHighlight
 */
export declare class FeatureHighlight {
    /** The map identifier the layer set belongs to */
    private mapId;
    /** The vector source to use for the animation features */
    private animationSource;
    /** The hidden layer to display animations */
    private overlayLayer;
    /** The style to make a linestring blink */
    private blankStyle;
    /** The fill for the animation */
    private whiteFill;
    /** The style for the feature animation */
    private whiteStyle;
    /** The fill for the highlight */
    private darkFill;
    /** The style for the highlight */
    private darkStyle;
    /** The ID's of currently animated features */
    private selectedFeatureIds;
    /** The ID's of currently highlighted features */
    private highlightedFeatureIds;
    /** List of timeout intervals to clear when removing selection */
    private intervals;
    /** Timeout of the bounding box highlight */
    private bboxTimeout;
    constructor(mapId: string);
    /**
     * Set animation for points
     *
     * @param {number} radius max radius of circle to draw
     * @param {Feature<Point>} pointFeature the feature to animate
     * @returns {NodeJS.Timeout} The interval timer.
     */
    private pointInterval;
    /**
     * Set animation for polygons
     *
     * @param {Geometry} geometry the geometry to animate
     * @returns {NodeJS.Timeout} The interval timer.
     */
    private polygonInterval;
    /**
     * Style, register, and add feature for animation
     *
     * @param {Feature} feature the feature to add
     * @param {string} id the id of the feature
     */
    private addFeatureAnimation;
    /**
     * Animate selected point
     *
     * @param {TypeFeatureInfoEntry} feature the point feature to animate
     */
    private animateSelection;
    /**
     * Animate all points in MultiPoint feature
     *
     * @param {TypeFeatureInfoEntry} feature the MultiPoint feature to animate
     */
    private animateMultiPoint;
    /**
     * Animate selected polygon
     *
     * @param {TypeFeatureInfoEntry} feature the feature Polygon to animate
     */
    private animatePolygon;
    /**
     * Animate all points in MultiPolygon feature
     *
     * @param {TypeFeatureInfoEntry} feature the multiPolygon feature to animate
     */
    private animateMultiPolygon;
    /**
     * Animate selected lineString
     *
     * @param {TypeFeatureInfoEntry} feature the lineString feature to animate
     */
    private animateLineString;
    /**
     * Reset animation feature and clear intervals
     *
     * @param {string} id the Uid of the feature to deselect, or 'all' to clear all
     */
    resetAnimation(id: string): void;
    /**
     * Highlight a feature with an animated overlay
     *
     * @param {TypeFeatureInfoEntry} feature the feature to highlight
     */
    selectFeature(feature: TypeFeatureInfoEntry): void;
    /**
     * Style and register feature for highlighting
     *
     * @param {Feature} feature the feature to add
     * @param {string} id the id of the feature
     */
    private styleHighlightedFeature;
    /**
     * Remove feature highlight(s)
     *
     * @param {string} id the Uid of the feature to deselect, or 'all' to clear all
     */
    removeHighlight(id: string): void;
    /**
     * Highlight a feature with a plain overlay
     *
     * @param {TypeFeatureInfoEntry} feature the feature to highlight
     */
    highlightFeature(feature: TypeFeatureInfoEntry): void;
    /**
     * Highlight a bounding box
     *
     * @param {Extent} extent the extent to highlight
     */
    highlightGeolocatorBBox(extent: Extent): void;
}
