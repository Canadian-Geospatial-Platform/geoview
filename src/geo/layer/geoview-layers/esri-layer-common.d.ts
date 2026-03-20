import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type { TypeFeatureInfoEntryPartial, TypeStyleGeometry, codedValueType, rangeDomainType, TypeOutfieldsType, DisplayDateMode } from '@/api/types/map-schema-types';
import type { TypeMosaicRule, TypeLayerMetadataFields } from '@/api/types/layer-schema-types';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { EsriRelatedRecordsJsonResponseRelatedRecord } from '@/geo/layer/gv-layers/utils';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import type { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
export declare class EsriUtilities {
    #private;
    /**
     * This method validates recursively the configuration of the layer entries to ensure that
     * it is a feature layer identified with a numeric layerId and creates a group entry
     * when a layer is a group.
     *
     * @param layer - The ESRI layer instance pointer.
     * @param listOfLayerEntryConfig - The list of layer entries configuration to validate.
     * @param callbackWhenRegisteringConfig - Called when a config needs to be registered.
     * @remarks
     * - This method performs **indirect recursion** by eventually delegating child validation to
     *   {@link validateListOfLayerEntryConfig} in a sub function called here.
     */
    static commonValidateListOfLayerEntryConfig(layer: EsriDynamic | EsriFeature, listOfLayerEntryConfig: ConfigBaseClass[], callbackWhenRegisteringConfig: RegisterLayerEntryConfigDelegate): void;
    /**
     * This method is used to process the layer's metadata.
     *
     * It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param layer - The ESRI layer instance pointer
     * @param layerConfig - The layer entry configuration to process
     * @param displayDateMode - Optional display date mode
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves once the layer configuration has its metadata processed
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error
     */
    static commonProcessLayerMetadata<T extends EsriDynamic | EsriFeature | EsriImage, U extends EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig>(layer: T, layerConfig: U, displayDateMode?: DisplayDateMode, abortSignal?: AbortSignal): Promise<U>;
    /**
     * Converts metadata mosaic method to ESRI REST API format.
     *
     * @param method - The metadata mosaic method
     * @returns The ESRI API mosaic method string
     */
    static convertMosaicMethod(method: string): TypeMosaicRule['mosaicMethod'];
    /**
     * Converts metadata mosaic operator to ESRI REST API format.
     *
     * @param operator - The metadata mosaic operator
     * @returns The ESRI API mosaic operation string
     */
    static convertMosaicOperator(operator: string): TypeMosaicRule['mosaicOperation'];
    /**
     * Asynchronously queries an Esri feature layer given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
     *
     * @param url - An Esri url indicating a feature layer to query
     * @param geometryType - Optional geometry type for the geometries in the layer being queried (used when geometries are returned)
     * @param parseFeatureInfoEntries - Optional boolean to indicate if we use the raw esri output or if we parse it, defaults to true
     * @returns A promise that resolves with an array of related records of type TypeFeatureInfoEntryPartial, or an empty array
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal
     * @throws {ResponseError} When the response is not OK (non-2xx)
     * @throws {ResponseEmptyError} When the JSON response is empty
     * @throws {ResponseTypeError} When the response from the service is not an object
     * @throws {ResponseContentError} When the response actually contains an error within it
     * @throws {NetworkError} When a network issue happened
     */
    static queryRecordsByUrl(url: string, geometryType: TypeStyleGeometry | undefined, parseFeatureInfoEntries?: boolean): Promise<TypeFeatureInfoEntryPartial[]>;
    /**
     * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
     *
     * @param url - An Esri url indicating a relationship table to query
     * @param recordGroupIndex - The group index of the relationship layer on which to read the related records
     * @returns A promise that resolves with an array of related records of type TypeFeatureInfoEntryPartial, or an empty array
     * @deprecated Doesn't seem to be called anywhere
     */
    static queryRelatedRecordsByUrl(url: string, recordGroupIndex: number): Promise<TypeFeatureInfoEntryPartial[]>;
    /**
     * Asynchronously queries an Esri feature layer given the url and object ids and returns an array of `TypeFeatureInfoEntryPartial` records.
     *
     * @param layerUrl - An Esri url indicating a feature layer to query
     * @param geometryType - Optional geometry type for the geometries in the layer being queried (used when returnGeometry is true)
     * @param objectIds - The list of objectids to filter the query on
     * @param fields - The list of field names to include in the output
     * @param geometry - True to return the geometries in the output
     * @param outSR - Optional spatial reference of the output geometries from the query
     * @param maxOffset - Optional max allowable offset value to simplify geometry
     * @param parseFeatureInfoEntries - Optional boolean to indicate if we use the raw esri output or if we parse it
     * @returns A promise that resolves with an array of related records of type TypeFeatureInfoEntryPartial, or an empty array
     */
    static queryRecordsByUrlObjectIds(layerUrl: string, geometryType: TypeStyleGeometry | undefined, objectIds: number[], fields: string, geometry: boolean, outSR?: number, maxOffset?: number, parseFeatureInfoEntries?: boolean): Promise<TypeFeatureInfoEntryPartial[]>;
    /**
     * Transforms the query results of an Esri service response - when not querying on the Layers themselves (giving a 'reduced' FeatureInfoEntry).
     *
     * The transformation reads the Esri formatted information and return a list of `TypeFeatureInfoEntryPartial` records.
     * In a similar fashion and response object as the "Query Feature Infos" functionalities done via the Layers.
     *
     * @param records - The records representing the data from Esri
     * @param geometryType - Optional geometry type
     * @returns An array of related records of type TypeFeatureInfoEntryPartial
     */
    static esriParseFeatureInfoEntries(records: EsriRelatedRecordsJsonResponseRelatedRecord[], geometryType?: TypeStyleGeometry): TypeFeatureInfoEntryPartial[];
    /**
     * Returns the type of the specified field.
     *
     * For ESRI Image layers, well-known pixel fields (`PixelValue`, `ProcessedValue`, `Name`)
     * are short-circuited to `'string'` because they have no metadata entry.
     *
     * @param layerConfig - The ESRI layer config, used to detect EsriImage-specific fields.
     * @param fields - The metadata field definitions to search.
     * @param fieldName - Field name for which we want to get the type.
     * @returns The mapped outfield type (`'date'`, `'oid'`, `'number'`, or `'string'`).
     */
    static esriGetFieldType(layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig, fields: TypeLayerMetadataFields[], fieldName: string): TypeOutfieldsType;
    /**
     * Returns the domain of the specified field.
     *
     * @param fields - The metadata field definitions to search.
     * @param fieldName - Field name for which we want to get the domain.
     * @returns The domain of the field, or `null` if not found.
     */
    static esriGetFieldDomain(fields: TypeLayerMetadataFields[], fieldName: string): codedValueType | rangeDomainType | undefined;
}
export type RegisterLayerEntryConfigDelegate = (config: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | GroupLayerEntryConfig) => void;
//# sourceMappingURL=esri-layer-common.d.ts.map