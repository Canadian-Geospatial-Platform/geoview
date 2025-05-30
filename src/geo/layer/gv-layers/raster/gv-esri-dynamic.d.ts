import { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';
import { Map as OLMap } from 'ol';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { TypeFeatureInfoEntry, rangeDomainType, codedValueType, TypeLayerStyleConfig, TypeOutfieldsType } from '@/api/config/types/map-schema-types';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeDateFragments } from '@/core/utils/date-mgt';
/**
 * Manages an Esri Dynamic layer.
 *
 * @exports
 * @class GVEsriDynamic
 */
export declare class GVEsriDynamic extends AbstractGVRaster {
    #private;
    static DEFAULT_HIT_TOLERANCE: number;
    static DEFAULT_FILTER_1EQUALS1: string;
    /**
     * Constructs a GVEsriDynamic layer to manage an OpenLayer layer.
     * @param {ImageArcGISRest} olSource - The OpenLayer source.
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: ImageArcGISRest, layerConfig: EsriDynamicLayerEntryConfig);
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
     * Overrides the way to get the bounds for this layer type.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Extent | undefined;
    /**
     * Sends a query to get ESRI Dynamic feature geometries and calculates an extent from them.
     * @param {string[]} objectIds - The IDs of the features to calculate the extent from.
     * @param {OLProjection} outProjection - The output projection for the extent.
     * @param {string?} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent>} The extent of the features, if available.
     */
    getExtentFromFeatures(objectIds: string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
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
     * Overrides the hit tolerance of the layer
     * @returns {number} The hit tolerance for a GV Esri Dynamic layer
     */
    getHitTolerance(): number;
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
     * Overrides the return of feature information at a given coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At LonLat from.
     * @param {Coordinate} lonlat - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Applies a view filter to an Esri Dynamic layer's source by updating the `layerDefs` parameter.
     * @param {string | undefined} filter - The raw filter string input (defaults to an empty string if not provided).
     */
    applyViewFilter(filter?: string | undefined): void;
    /**
     * Applies a view filter to an Esri Dynamic layer's source by updating the `layerDefs` parameter.
     * This function is responsible for generating the appropriate filter expression based on the layer configuration,
     * optional style, and time-based fragments. It ensures the filter is only applied if it has changed or needs to be reset.
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The configuration object for the Esri Dynamic layer.
     * @param {ImageArcGISRest} source - The OpenLayers `ImageArcGISRest` source instance to which the filter will be applied.
     * @param {TypeLayerStyleConfig | undefined} style - Optional style configuration that may influence filter expression generation.
     * @param {TypeDateFragments | undefined} externalDateFragments - Optional external date fragments used to assist in formatting time-based filters.
     * @param {GVEsriDynamic | undefined} layer - Optional GeoView layer containing the source (if exists) in order to trigger a redraw.
     * @param {string | undefined} filter - The raw filter string input (defaults to an empty string if not provided).
     * @param {Function?} callbackWhenUpdated - Optional callback that is invoked with the final filter string if the layer was updated.
     * @throws {LayerInvalidLayerFilterError} If the filter expression fails to parse or cannot be applied.
     */
    static applyViewFilterOnSource(layerConfig: EsriDynamicLayerEntryConfig, source: ImageArcGISRest, style: TypeLayerStyleConfig | undefined, externalDateFragments: TypeDateFragments | undefined, layer: GVEsriDynamic | undefined, filter?: string | undefined, callbackWhenUpdated?: ((filterToUse: string) => void) | undefined): void;
    /**
     * Gets the layer view filter. The filter is derived from the uniqueValue or the classBreak visibility flags and a layerFilter
     * associated to the layer.
     * @returns {string} The filter associated to the layer
     */
    static getViewFilter(layerConfig: EsriDynamicLayerEntryConfig, style: TypeLayerStyleConfig | undefined): string;
}
