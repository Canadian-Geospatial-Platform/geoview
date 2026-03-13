import type { ImageArcGISRest } from 'ol/source';
import type { Coordinate } from 'ol/coordinate';
import { Image as ImageLayer } from 'ol/layer';
import type { Extent } from 'ol/extent';
import { Feature } from 'ol';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type { codedValueType, rangeDomainType, TypeFeatureInfoEntry, TypeFeatureInfoResult, TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { GeometryJson } from '@/geo/layer/gv-layers/utils';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import type { TypeMetadataEsriRasterFunctionInfos, TypeMosaicRule } from '@/api/types/layer-schema-types';
import type { TemporalMode } from '@/index';
/**
 * Manages an Esri Image layer.
 *
 * @exports
 * @class GVEsriImage
 */
export declare class GVEsriImage extends AbstractGVRaster {
    #private;
    /**
     * Constructs a GVEsriImage layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: ImageArcGISRest, layerConfig: EsriImageLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     *
     * @returns The strongly-typed OpenLayers type.
     */
    getOLLayer(): ImageLayer<ImageArcGISRest>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     *
     * @returns The ImageArcGISRest source instance associated with this layer.
     */
    getOLSource(): ImageArcGISRest;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): EsriImageLayerEntryConfig;
    /**
     * Overrides the fetching of the legend for an Esri image layer.
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     * @override
     */
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overrides when the style should be set by the fetched legend.
     * @param {TypeLegend} legend - The legend type
     * @returns {void}
     * @override
     */
    onSetStyleAccordingToLegend(legend: TypeLegend): void;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param projection - The projection to get the bounds into.
     * @param stops - The number of stops to use to generate the extent.
     * @returns A promise of layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Overrides the way a WMS layer applies a view filter. It does so by updating the source TIME parameters.
     * @param {LayerFilters} [filter] - An optional filter to be used in place of the getViewFilter value.
     * @returns {void}
     * @override
     */
    protected onSetLayerFilters(filter?: LayerFilters): void;
    /**
     * Overrides the return of feature information at a given coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of a TypeFeatureInfoResult.
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At LonLat from.
     * @param {Coordinate} lonlat - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of a TypeFeatureInfoResult.
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry?: boolean): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     * @override
     */
    protected onGetFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Overrides the return of the domain of the specified field.
     * @param {string} fieldName - The field name for which we want to get the domain.
     * @returns {null | codedValueType | rangeDomainType} The domain of the field.
     * @override
     */
    protected onGetFieldDomain(fieldName: string): null | codedValueType | rangeDomainType;
    /**
     * Overrides the formatting of feature info results to skip icon rendering for pixel-based queries.
     * ESRI Image layers return pixel values, not symbolized features, so we skip the icon source step.
     * @param {Feature[]} features - The array of features to format.
     * @returns {TypeFeatureInfoEntry[]} The formatted feature info entries.
     * @override
     * @protected
     */
    protected formatFeatureInfoResult(features: Feature[], layerConfig: EsriImageLayerEntryConfig, serviceDateFormat: string | undefined, serviceDateIANA: string | undefined, serviceDateTemporalMode: TemporalMode | undefined): TypeFeatureInfoEntry[];
    /**
     * Gets the list of rasterFunctionInfos that are available in the ImageServer
     * @returns {TypeMetadataEsriRasterFunctionInfo[]} The ImageServer's rasterFunctionInfos
     */
    getMetadataRasterFunctionInfos(): TypeMetadataEsriRasterFunctionInfos[] | undefined;
    /**
     * Gets the currently active raster function identifier.
     * @returns {string | undefined} The raster function identifier
     */
    getRasterFunction(): string | undefined;
    /**
     * Updates the raster function for the layer
     * @param {string | undefined} rasterFunctionId - The raster function ID to apply
     * @returns {void}
     */
    setRasterFunction(rasterFunctionId: string | undefined): void;
    /**
     * Gets individual preview promises for each raster function
     * @param {number} [size=400] - The size of the preview image (width and height)
     * @returns {Map<string, Promise<string>>} Map of raster function names to preview promises
     */
    getRasterFunctionPreviews(size?: number): Map<string, Promise<string>>;
    /**
     * Gets the current mosaic rule for the layer.
     * @returns The current mosaic rule.
     */
    getMosaicRule(): TypeMosaicRule | undefined;
    /**
     * Sets the entire mosaicRule object and updates the OL source.
     * @param mosaicRule - The new mosaicRule object.
     */
    setMosaicRule(mosaicRule: TypeMosaicRule | undefined): void;
}
export type TypeEsriImageLayerLegend = {
    layers: TypeEsriImageLayerLegendLayer[];
};
export type TypeEsriImageLayerLegendLayer = {
    layerId: number | string;
    layerName: string;
    layerType: string;
    minScale: number;
    maxScale: number;
    legendType: string;
    legend: TypeEsriImageLayerLegendLayerLegend[];
};
export type TypeEsriImageLayerLegendLayerLegend = {
    label: string;
    url: string;
    imageData: string;
    contentType: string;
    height: number;
    width: number;
    values: string[];
};
export type EsriImageIdentifyJsonResponse = {
    objectId: number;
    name: string;
    value: string | number;
    location?: {
        x: number;
        y: number;
        spatialReference: {
            wkid: number;
            latestWkid?: number;
        };
    };
    properties?: {
        Values: string[];
    };
    catalogItems?: {
        objectIdFieldName: string;
        geometryType: string;
        spatialReference: {
            wkid: number;
            latestWkid?: number;
        };
        features: Array<{
            attributes: Record<string, unknown>;
            geometry?: GeometryJson;
        }>;
    };
    processedValues?: string[];
};
//# sourceMappingURL=gv-esri-image.d.ts.map