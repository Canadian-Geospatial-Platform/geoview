import { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { TypeFeatureInfoEntry, rangeDomainType, codedValueType, TypeOutfieldsType } from '@/api/config/types/map-schema-types';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeJsonObject } from '@/api/config/types/config-types';
/**
 * Manages an Esri Dynamic layer.
 *
 * @exports
 * @class GVEsriDynamic
 */
export declare class GVEsriDynamic extends AbstractGVRaster {
    #private;
    static DEFAULT_HIT_TOLERANCE: number;
    hitTolerance: number;
    /**
     * Constructs a GVEsriDynamic layer to manage an OpenLayer layer.
     * @param {string} mapId - The map id
     * @param {ImageArcGISRest} olSource - The OpenLayer source.
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(mapId: string, olSource: ImageArcGISRest, layerConfig: EsriDynamicLayerEntryConfig);
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {ImageLayer<ImageArcGISRest>} The OpenLayers Layer
     */
    getOLLayer(): ImageLayer<ImageArcGISRest>;
    /**
     * Overrides the get of the OpenLayers Layer Source
     * @returns {ImageArcGISRest} The OpenLayers Layer Source
     */
    getOLSource(): ImageArcGISRest;
    /**
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {EsriDynamicLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): EsriDynamicLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected getFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Overrides the return of the domain of the specified field.
     * @param {string} fieldName - The field name for which we want to get the domain.
     * @returns {null | codedValueType | rangeDomainType} The domain of the field.
     */
    protected getFieldDomain(fieldName: string): null | codedValueType | rangeDomainType;
    /**
     * Overrides the get all feature information for all the features stored in the layer.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getAllFeatureInfo(abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Query all features with a web worker
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer config
     * @returns {TypeJsonObject} A promise of esri response for query.
     */
    fetchAllFeatureInfoWithWorker(layerConfig: EsriDynamicLayerEntryConfig): Promise<TypeJsonObject>;
    /**
     * Overrides the return of feature information at a given pixel location.
     * @param {Pixel} location - The pixel coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtPixel(location: Pixel, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the return of feature information at a given coordinate.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Query the features geometry with a web worker
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer config
     * @param {number[]} objectIds - Array of object IDs to query
     * @param {boolean} queryGeometry - Whether to include geometry in the query
     * @param {number} projection - The spatial reference ID for the output
     * @param {number} maxAllowableOffset - The maximum allowable offset for geometry simplification
     * @returns {TypeJsonObject} A promise of esri response for query.
     */
    fetchFeatureInfoGeometryWithWorker(layerConfig: EsriDynamicLayerEntryConfig, objectIds: number[], queryGeometry: boolean, projection: number, maxAllowableOffset: number): Promise<TypeJsonObject>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     * @param {Coordinate} lnglat - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtLongLat(lnglat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Gets the layer view filter. The filter is derived from the uniqueValue or the classBreak visibility flags and a layerFilter
     * associated to the layer.
     * @returns {string} The filter associated to the layer
     */
    getViewFilter(): string;
    /**
     * Overrides the fetching of the legend for an Esri Dynamic layer.
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     */
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overrides when the style should be set by the fetched legend.
     * @param legend
     */
    onSetStyleAccordingToLegend(legend: TypeLegend): void;
    /**
     * Overrides when the layer gets in loaded status.
     */
    onLoaded(): void;
    /**
     * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter paramater is used alone to display
     * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
     * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
     * is done.
     * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
     * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
     */
    applyViewFilter(filter: string, combineLegendFilter?: boolean): void;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(): Extent | undefined;
    /**
     * Sends a query to get ESRI Dynamic feature geometries and calculates an extent from them.
     * @param {string[]} objectIds - The IDs of the features to calculate the extent from.
     * @param {string} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent | undefined>} The extent of the features, if available.
     */
    getExtentFromFeatures(objectIds: string[], outfield?: string): Promise<Extent | undefined>;
}
