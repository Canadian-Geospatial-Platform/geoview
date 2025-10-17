import type { TimeDimensionESRI } from '@/core/utils/date-mgt';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type { TypeFeatureInfoEntryPartial, TypeStyleGeometry, codedValueType, rangeDomainType, TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { EsriRelatedRecordsJsonResponseRelatedRecord } from '@/geo/layer/gv-layers/utils';
import type { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import type { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import type { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
/**
 * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
 * with a numeric layerId and creates a group entry when a layer is a group.
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
 */
export declare function commonValidateListOfLayerEntryConfig(layer: EsriDynamic | EsriFeature, listOfLayerEntryConfig: ConfigBaseClass[]): void;
/**
 * Extract the domain of the specified field from the metadata. If the type can not be found, return 'string'.
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - Layer configuration.
 * @param {string} fieldName - Field name for which we want to get the domain.
 * @returns {TypeOutfieldsType} The type of the field.
 */
export declare function commonGetFieldType(layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig, fieldName: string): TypeOutfieldsType;
/**
 * Return the type of the specified field.
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig layer configuration.
 * @param {string} fieldName field name for which we want to get the type.
 * @returns {null | codedValueType | rangeDomainType} The domain of the field.
 */
export declare function commonGetFieldDomain(layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig, fieldName: string): null | codedValueType | rangeDomainType;
/**
 * This method will create a Geoview temporal dimension if it exist in the service metadata
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - The layer entry to configure
 * @param {TimeDimensionESRI} esriTimeDimension - The ESRI time dimension object
 * @param {boolean} singleHandle - True for ESRI Image
 */
export declare function commonProcessTimeDimension(layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig, esriTimeDimension: TimeDimensionESRI, singleHandle?: boolean): void;
/**
 * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - The layer entry to configure.
 */
export declare function commonProcessFeatureInfoConfig(layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig): void;
/**
 * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - The layer entry to configure.
 */
export declare function commonProcessInitialSettings(layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig): void;
/**
 * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
 * initial settings, fields and aliases).
 * @param {EsriDynamic | EsriFeature | EsriImage} layer The ESRI layer instance pointer.
 * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
 * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
 * @returns {Promise<TypeLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
 */
export declare function commonProcessLayerMetadata<T extends EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig>(layer: EsriDynamic | EsriFeature | EsriImage, layerConfig: T, abortSignal?: AbortSignal): Promise<T>;
/**
 * Transforms the query results of an Esri service response - when not querying on the Layers themselves (giving a 'reduced' FeatureInfoEntry).
 * The transformation reads the Esri formatted information and return a list of `TypeFeatureInfoEntryPartial` records.
 * In a similar fashion and response object as the "Query Feature Infos" functionalities done via the Layers.
 * @param {EsriRelatedRecordsJsonResponseRelatedRecord[]} records - The Json Object representing the data from Esri.
 * @returns TypeFeatureInfoEntryPartial[] an array of relared records of type TypeFeatureInfoEntryPartial
 */
export declare function parseFeatureInfoEntries(records: EsriRelatedRecordsJsonResponseRelatedRecord[]): TypeFeatureInfoEntryPartial[];
/**
 * Asynchronously queries an Esri feature layer given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {string} url - An Esri url indicating a feature layer to query
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export declare function queryRecordsByUrl(url: string): Promise<TypeFeatureInfoEntryPartial[]>;
/**
 * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {string} url - An Esri url indicating a relationship table to query
 * @param {number} recordGroupIndex - The group index of the relationship layer on which to read the related records
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export declare function queryRelatedRecordsByUrl(url: string, recordGroupIndex: number): Promise<TypeFeatureInfoEntryPartial[]>;
/**
 * Converts an esri geometry type string to a TypeStyleGeometry.
 * @param {string} esriGeometryType - The esri geometry type to convert
 * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
 */
export declare function convertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry;
//# sourceMappingURL=esri-layer-common.d.ts.map