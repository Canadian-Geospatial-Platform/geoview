import ImageLayer from 'ol/layer/Image';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { ImageWMS } from 'ol/source';
import { Extent } from 'ol/extent';
import { TypeJsonObject } from '@/core/types/global-types';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
import { AbstractGVRaster } from './abstract-gv-raster';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
/**
 * Manages a WMS layer.
 *
 * @exports
 * @class GVWMS
 */
export declare class GVWMS extends AbstractGVRaster {
    #private;
    WMSStyles: never[];
    /**
     * Constructs a GVWMS layer to manage an OpenLayer layer.
     * @param {string} mapId - The map id
     * @param {ImageWMS} olSource - The OpenLayer source.
     * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(mapId: string, olSource: ImageWMS, layerConfig: OgcWmsLayerEntryConfig, layerCapabilities: TypeJsonObject);
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {ImageLayer<ImageWMS>} The OpenLayers Layer
     */
    getOLLayer(): ImageLayer<ImageWMS>;
    /**
     * Overrides the get of the OpenLayers Layer Source
     * @returns {ImageWMS} The OpenLayers Layer Source
     */
    getOLSource(): ImageWMS;
    /**
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {OgcWmsLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): OgcWmsLayerEntryConfig;
    /**
     * Overrides the return of feature information at a given pixel location.
     * @param {Coordinate} location - The pixel coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtPixel(location: Pixel): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overrides the return of feature information at a given coordinate.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     * @param {Coordinate} lnglat - The coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtLongLat(lnglat: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overrides the fetching of the legend for a WMS layer.
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     */
    getLegend(): Promise<TypeLegend | null>;
    /**
     * Sets the style to be used by the wms layer. This methode does nothing if the layer path can't be found.
     * @param {string} wmsStyleId - The style identifier that will be used.
     */
    setWmsStyle(wmsStyleId: string): void;
    /**
     * Overrides when the layer gets in loaded status.
     */
    onLoaded(): void;
    /**
     * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter paramater is used alone to display
     * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
     * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
     * is done.
     * TODO ! The combination of the legend filter and the dimension filter probably does not apply to WMS. The code can be simplified.
     * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
     * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
     */
    applyViewFilter(filter: string, combineLegendFilter?: boolean): void;
    /**
     * Gets the bounds of the layer and returns updated bounds.
     * @returns {Extent | undefined} The layer bounding box.
     */
    getBounds(): Extent | undefined;
}
