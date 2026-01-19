import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type { TypeFeatureInfoEntryPartial, TypeStyleGeometry, codedValueType, rangeDomainType, TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { EsriRelatedRecordsJsonResponseRelatedRecord } from '@/geo/layer/gv-layers/utils';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import type { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
export declare class EsriUtilities {
    #private;
    /**
     * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
     * with a numeric layerId and creates a group entry when a layer is a group.
     * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
     * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
     * @param {RegisterLayerEntryConfigDelegate} callbackWhenRegisteringConfig - Called when a config needs to be registered.
     * @static
     */
    static commonValidateListOfLayerEntryConfig(layer: EsriDynamic | EsriFeature, listOfLayerEntryConfig: ConfigBaseClass[], callbackWhenRegisteringConfig: RegisterLayerEntryConfigDelegate): void;
    /**
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     * @param {EsriDynamic | EsriFeature | EsriImage} layer The ESRI layer instance pointer.
     * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<TypeLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     * @static
     */
    static commonProcessLayerMetadata<T extends EsriDynamic | EsriFeature | EsriImage, U extends EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig>(layer: T, layerConfig: U, abortSignal?: AbortSignal): Promise<U>;
    /**
     * Asynchronously queries an Esri feature layer given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
     * @param {string} url - An Esri url indicating a feature layer to query
     * @param {TypeStyleGeometry?} geometryType - The geometry type for the geometries in the layer being queried (used when geometries are returned)
     * @param {boolean} parseFeatureInfoEntries - A boolean to indicate if we use the raw esri output or if we parse it, defaults to true.
     * @returns {Promise<TypeFeatureInfoEntryPartial[]>} A promise of an array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {ResponseTypeError} When the response from the service is not an object.
     * @throws {ResponseContentError} When the response actually contains an error within it.
     * @throws {NetworkError} When a network issue happened.
     * @static
     */
    static queryRecordsByUrl(url: string, geometryType: TypeStyleGeometry | undefined, parseFeatureInfoEntries?: boolean): Promise<TypeFeatureInfoEntryPartial[]>;
    /**
     * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
     * @param {string} url - An Esri url indicating a relationship table to query
     * @param {number} recordGroupIndex - The group index of the relationship layer on which to read the related records
     * @returns {Promise<TypeFeatureInfoEntryPartial[]>} A promise of an array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
     * @static
     * @deprecated Doesn't seem to be called anywhere.
     */
    static queryRelatedRecordsByUrl(url: string, recordGroupIndex: number): Promise<TypeFeatureInfoEntryPartial[]>;
    /**
     * Asynchronously queries an Esri feature layer given the url and object ids and returns an array of `TypeFeatureInfoEntryPartial` records.
     * @param {string} layerUrl - An Esri url indicating a feature layer to query
     * @param {TypeStyleGeometry} geometryType - The geometry type for the geometries in the layer being queried (used when returnGeometry is true)
     * @param {number[]} objectIds - The list of objectids to filter the query on
     * @param {string} fields - The list of field names to include in the output
     * @param {boolean} geometry - True to return the geometries in the output
     * @param {number} outSR - The spatial reference of the output geometries from the query
     * @param {number} maxOffset - The max allowable offset value to simplify geometry
     * @param {boolean} parseFeatureInfoEntries - A boolean to indicate if we use the raw esri output or if we parse it
     * @returns {Promise<TypeFeatureInfoEntryPartial[]>} A promise of an array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
     * @static
     */
    static queryRecordsByUrlObjectIds(layerUrl: string, geometryType: TypeStyleGeometry | undefined, objectIds: number[], fields: string, geometry: boolean, outSR?: number, maxOffset?: number, parseFeatureInfoEntries?: boolean): Promise<TypeFeatureInfoEntryPartial[]>;
    /**
     * Transforms the query results of an Esri service response - when not querying on the Layers themselves (giving a 'reduced' FeatureInfoEntry).
     * The transformation reads the Esri formatted information and return a list of `TypeFeatureInfoEntryPartial` records.
     * In a similar fashion and response object as the "Query Feature Infos" functionalities done via the Layers.
     * @param {EsriRelatedRecordsJsonResponseRelatedRecord[]} records The records representing the data from Esri.
     * @param {TypeStyleGeometry?} geometryType - Optional, the geometry type.
     * @returns TypeFeatureInfoEntryPartial[] An array of relared records of type TypeFeatureInfoEntryPartial
     * @static
     */
    static esriParseFeatureInfoEntries(records: EsriRelatedRecordsJsonResponseRelatedRecord[], geometryType?: TypeStyleGeometry): TypeFeatureInfoEntryPartial[];
    /**
     * Returns the type of the specified field.
     * @param {EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig The ESRI layer config
     * @param {string} fieldName field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     * @static
     */
    static esriGetFieldType(layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig, fieldName: string): TypeOutfieldsType;
    /**
     * Returns the domain of the specified field.
     * @param {EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig The ESRI layer config
     * @param {string} fieldName field name for which we want to get the domain.
     * @returns {codedValueType | rangeDomainType | null} The domain of the field.
     * @static
     */
    static esriGetFieldDomain(layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig, fieldName: string): codedValueType | rangeDomainType | null;
}
export type RegisterLayerEntryConfigDelegate = (config: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | GroupLayerEntryConfig) => void;
//# sourceMappingURL=esri-layer-common.d.ts.map