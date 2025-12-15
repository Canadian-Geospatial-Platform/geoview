import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Vector as VectorSource } from 'ol/source';
import type Feature from 'ol/Feature';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { type TypeOutfields, type TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerConfig, TypeMetadataWFS, VectorStrategy } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GVWFS } from '@/geo/layer/gv-layers/vector/gv-wfs';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
export interface TypeWFSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'geoviewLayerType'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.WFS;
    fetchStylesOnWMS?: boolean;
    listOfLayerEntryConfig: OgcWfsLayerEntryConfig[];
}
/**
 * A class to add WFS layer.
 *
 * @exports
 * @class WFS
 */
export declare class WFS extends AbstractGeoViewVector {
    #private;
    /**
     * Constructs a WFS Layer configuration processor.
     * @param {TypeWFSLayerConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeWFSLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataWFS | undefined} The strongly-typed layer configuration specific to this layer.
     */
    getMetadata(): TypeMetadataWFS | undefined;
    /**
     * Overrides the way the metadata is fetched.
     * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<T = TypeMetadataWFS>} A promise with the metadata or undefined when no metadata for the particular layer type.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     * @throws {LayerNoCapabilitiesError} When the metadata is empty (no Capabilities).
     */
    protected onFetchServiceMetadata<T = TypeMetadataWFS>(abortSignal?: AbortSignal): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     * @throws {LayerNoCapabilitiesError} When the metadata is empty (no Capabilities).
     */
    protected onInitLayerEntries(abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the validation of a layer entry config.
     * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
     */
    protected onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
     */
    protected onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig, abortSignal?: AbortSignal): Promise<VectorLayerEntryConfig>;
    /**
     * Overrides the creation of the source configuration for the vector layer
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration.
     * @param {SourceOptions} sourceOptions - The source options.
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
     */
    protected onCreateVectorSource(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>): VectorSource<Feature>;
    /**
     * Overrides the creation of the GV Layer
     * @param {OgcWfsLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVWFS} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: OgcWfsLayerEntryConfig): GVWFS;
    /**
     * Fetches the metadata for a typical WFS class.
     * @param {string} url - The url to query the metadata from.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<TypeMetadataWFS | undefined>} Promise with the metadata when fetched or undefined when capabilities weren't found.
     */
    static fetchMetadata(url: string, abortSignal?: AbortSignal): Promise<TypeMetadataWFS | undefined>;
    /**
     * Fetches WFS metadata for a given service URL and layer ID, then retrieves
     * the corresponding geometry type from the DescribeFeatureType response.
     * This method performs the following steps:
     * 1. Normalizes the base service URL.
     * 2. Fetches WFS capabilities or metadata from the service.
     * 3. Determines the WFS version and the proper output format for DescribeFeatureType.
     * 4. Builds and executes the DescribeFeatureType request.
     * 5. Extracts and returns the geometry type (e.g., `"Point"`, `"LineString"`, `"Polygon"`).
     * @param {string} url - The full WFS or WMS service URL from which to derive the base endpoint.
     * @param {string} layerId - The name or identifier of the layer to inspect.
     * @param {AbortSignal} [abortSignal] - Optional signal that allows the request to be aborted.
     * @returns {Promise<TypeOutfields[]>} A promise that resolves with the list of fields for the layer.
     */
    static fetchMetadataAndRetrieveFieldsInfo(url: string, layerId: string, abortSignal?: AbortSignal): Promise<TypeOutfields[]>;
    /**
     * Initializes a GeoView layer configuration for a WFS layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param {string} geoviewLayerId - A unique identifier for the layer.
     * @param {string} geoviewLayerName - The display name of the layer.
     * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string): Promise<TypeGeoviewLayerConfig>;
    /**
     * Extracts the preferred output format value for a WFS DescribeFeatureType operation
     * from the parsed WFS capabilities metadata.
     * The method navigates through the `ows:OperationsMetadata` section of the capabilities
     * document to locate the `"DescribeFeatureType"` operation and returns the first available
     * output format value.
     * @param {TypeMetadataWFS} metadata - The parsed WFS capabilities metadata object.
     * @returns {string} The detected output format string for the DescribeFeatureType operation,
     * or an empty string if no suitable value is found.
     */
    static extractDescribeFeatureOutputFormat(metadata: TypeMetadataWFS): string;
    /**
     * Fetches and parses a WFS `DescribeFeatureType` response from the given URL,
     * automatically selecting the appropriate parsing method (JSON or XML)
     * based on the specified output format.
     * @param {string} url - The DescribeFeatureType request URL.
     * @param {string} outputFormat - The expected response format (`"application/json"` or XML-based MIME type).
     * @param {AbortSignal} [abortSignal] - Optional signal that allows the fetch request to be aborted.
     * @returns {Promise<TypeOutfields[]>} A promise resolving to an array of field definitions
     *   describing the feature type's properties (including geometry fields).
     */
    static fetchDescribeFeature(url: string, outputFormat: string, abortSignal?: AbortSignal): Promise<TypeOutfields[]>;
    /**
     * Fetches and parses a WFS `DescribeFeatureType` response in JSON format.
     * This method is used when the WFS server supports
     * `outputFormat=application/json` for DescribeFeatureType requests.
     * It extracts and returns the list of feature type properties.
     * @param {string} url - The DescribeFeatureType request URL.
     * @param {AbortSignal} [abortSignal] - Optional signal to abort the fetch request.
     * @returns {Promise<TypeOutfields[]>} A promise resolving to
     *   an array of feature type field definitions extracted from the JSON response.
     */
    static fetchDescribeFeatureJson(url: string, abortSignal?: AbortSignal): Promise<TypeOutfields[]>;
    /**
     * Fetches and parses a WFS `DescribeFeatureType` response in XML format.
     * This method is used for servers that only support XML DescribeFeatureType responses
     * (e.g., GeoServer, MapServer, or QGIS Server without JSON output).
     * It converts the XML schema to JSON and extracts the list of feature properties
     * from the complex type definition.
     * @param {string} url - The DescribeFeatureType request URL.
     * @param {AbortSignal} [abortSignal] - Optional signal to abort the fetch request.
     * @returns {Promise<TypeOutfields[]>} A promise resolving to
     *   an array of feature type field definitions extracted from the XML schema.
     */
    static fetchDescribeFeatureXML(url: string, abortSignal?: AbortSignal): Promise<TypeOutfields[]>;
    /**
     * Determines the simplified data type of a specified field from a WFS layer configuration.
     * Extracts the field definition from the layer’s metadata, interprets its WFS type
     * (e.g., `xsd:int`, `xsd:date`), and maps it to a normalized internal type
     * (`'string'`, `'number'`, or `'date'`).
     * @param {string} fieldName - The name of the field whose type should be retrieved.
     * @param {OgcWfsLayerEntryConfig} layerConfig - The WFS layer configuration containing metadata definitions.
     * @returns {TypeOutfieldsType} The normalized field type (`'string'`, `'number'`, or `'date'`).
     */
    static getFieldType(fieldName: string, layerConfig: OgcWfsLayerEntryConfig): TypeOutfieldsType;
    /**
     * Determines whether a given WFS feature type field represents a geometry property.
     * Checks if the field's type string starts with the `"gml:"` prefix, which indicates
     * a GML geometry type such as `gml:PointPropertyType`, `gml:PolygonPropertyType`, etc.
     * @param {TypeOutfields} field - The feature type field definition to evaluate.
     * @returns {boolean} `true` if the field is a geometry field; otherwise, `false`.
     */
    static isGmlGeometryField(field: TypeOutfields): boolean;
    /**
     * Creates a configuration object for an WFS Feature layer.
     * This function constructs a `TypeWFSLayerConfig` object that describes an WFS Feature layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {VectorStrategy} strategy - Indicates the strategy to use to fetch vector data.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeWFSLayerConfig} The constructed configuration object for the WFS Feature layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, strategy: VectorStrategy, layerEntries: TypeLayerEntryShell[]): TypeWFSLayerConfig;
    /**
     * Processes a WFS (Web Feature Service) GeoviewLayerConfig and returns a promise
     * that resolves to an array of `ConfigBaseClass` layer entry configurations.
     *
     * This method:
     * 1. Creates a Geoview layer configuration using the provided parameters.
     * 2. Instantiates a layer with that configuration.
     * 3. Processes the layer configuration and returns the result.
     * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name for the GeoView layer.
     * @param {string} url - The URL of the service endpoint.
     * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
     * @param {boolean} isTimeAware - Indicates if the layer is time aware.
     * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: string[], isTimeAware: boolean, vectorStrategy: VectorStrategy, fetchStylesOnWMS: boolean, callbackCreateLayerEntryConfig?: (wfsEntry: TypeLayerEntryShell) => TypeLayerEntryShell): Promise<ConfigBaseClass[]>;
}
//# sourceMappingURL=wfs.d.ts.map