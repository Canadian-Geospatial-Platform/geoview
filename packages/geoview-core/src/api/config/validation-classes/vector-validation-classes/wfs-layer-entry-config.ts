import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeMetadataWFSCapabilities,
  TypeMetadataWFSFeatureTypeListFeatureType,
  TypeMetadataWFSOperationMetadataOperation,
  TypeMetadataWFSOperationMetadataOperationParameter,
  TypeMetadataWFSOperationMetadataOperationParameterValue,
  TypeMetadataWFSTextOnly,
} from '@/api/types/layer-schema-types';
import type { TypeOutfields } from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { LayerEntryConfigLayerIdNotFoundError } from '@/core/exceptions/layer-entry-config-exceptions';
import { LayerServiceMetadataEmptyError } from '@/core/exceptions/layer-exceptions';
import { toArray } from '@/core/utils/utilities';
import type { TypeWFSLayerConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import { WfsRenderer } from '@/geo/utils/renderer/wfs-renderer';

export interface OgcWfsLayerEntryConfigProps extends VectorLayerEntryConfigProps {}

export class OgcWfsLayerEntryConfig extends VectorLayerEntryConfig {
  /** The DescribeFeatureType full URL that was used for the layer, if any */
  #describeFeatureTypeFullUrl?: string;

  /**
   * Creates an instance of OgcWfsLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   */
  constructor(layerConfig: OgcWfsLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.WFS);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer
   */
  override getGeoviewLayerConfig(): TypeWFSLayerConfig {
    return super.getGeoviewLayerConfig() as TypeWFSLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed service metadata specific to this layer entry config
   */
  override getServiceMetadata(): TypeMetadataWFSCapabilities | undefined {
    return super.getServiceMetadata() as TypeMetadataWFSCapabilities | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer metadata specific to this layer entry config
   */
  override getLayerMetadata(): TypeOutfields[] | undefined {
    return super.getLayerMetadata() as TypeOutfields[] | undefined;
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Retrieves the WFS `FeatureType` metadata entry corresponding to this layer.
   *
   * This method searches the WFS `FeatureTypeList` inside the service metadata and
   * finds the feature type whose `Name` matches the layer's `layerId`.
   *
   * @returns The `FeatureType` metadata entry describing this layer
   * @throws {LayerServiceMetadataEmptyError} When the WFS service metadata is missing or incomplete
   * @throws {LayerEntryConfigLayerIdNotFoundError} When no `FeatureType` entry matches this layer's `layerId`
   */
  getFeatureType(): TypeMetadataWFSFeatureTypeListFeatureType {
    // The metadata
    const metadata = this.getServiceMetadata();

    // If no metadata
    if (!metadata || !metadata.FeatureTypeList || !metadata.FeatureTypeList.FeatureType) {
      throw new LayerServiceMetadataEmptyError(this.getGeoviewLayerId(), this.getLayerNameCascade());
    }

    // If metadata FeatureType isn't an array
    let featureTypes: TypeMetadataWFSFeatureTypeListFeatureType[] = metadata.FeatureTypeList
      .FeatureType as TypeMetadataWFSFeatureTypeListFeatureType[];
    featureTypes = toArray(metadata.FeatureTypeList.FeatureType);

    // Find the feature type for this layer
    const featureTypeForLayer = featureTypes.find((layerMetadata) => {
      let id = layerMetadata.Name as string;
      if (typeof layerMetadata.Name === 'object' && '#text' in layerMetadata.Name) id = layerMetadata.Name['#text'];
      return id === this.layerId;
    });

    // If not found
    if (!featureTypeForLayer) throw new LayerEntryConfigLayerIdNotFoundError(this);

    // Return it
    return featureTypeForLayer;
  }

  /**
   * Returns the spatial reference system (SRS) of the layer's data.
   *
   * Reads the version-specific field: `DefaultCRS` (WFS 2.0), `DefaultSRS` (WFS 1.1), or `SRS` (WFS 1.0), in that order.
   * A value may be a string or an XML-parsed object with a `#text` property.
   *
   * The CRS identifier is returned as provided by the service (for example, an EPSG code, OGC URN, or OGC CRS URI);
   * it is not normalized.
   *
   * @returns The CRS identifier declared by the service, or undefined if none is available
   */
  getProjectionOfData(): string | undefined {
    // Get the feature type
    const featureType = this.getFeatureType();
    // If WFS is version 2.0.0, check DefaultCRS
    if (featureType.DefaultCRS) {
      if (typeof featureType.DefaultCRS === 'object' && '#text' in featureType.DefaultCRS) {
        return featureType.DefaultCRS['#text'];
      }
      return featureType.DefaultCRS;
    }

    // If WFS is version 1.1.0, check DefaultSRS
    if (featureType.DefaultSRS) {
      if (typeof featureType.DefaultSRS === 'object' && '#text' in featureType.DefaultSRS) {
        return featureType.DefaultSRS['#text'];
      }
      return featureType.DefaultSRS;
    }

    // If WFS is version 1.0.0, check SRS
    if (featureType.SRS) {
      if (typeof featureType.SRS === 'object' && '#text' in featureType.SRS) {
        return featureType.SRS['#text'];
      }
      return featureType.SRS;
    }

    // Unknown
    return undefined;
  }

  /**
   * Returns the list of supported mime output formats for this WFS layer.
   *
   * Formats are extracted from the `OutputFormats` section of the layer's WFS
   * `FeatureType` metadata.
   *
   * @param defaultWhenNone - Optional default format to return if no supported formats are found
   * @returns An array of MIME types / format identifiers supported by the WFS service for GetFeature responses
   * @throws {LayerServiceMetadataEmptyError} When the metadata is missing or incomplete (propagated from `getFeatureType()`)
   * @throws {LayerEntryConfigLayerIdNotFoundError} When the layer's feature type is not found (propagated from `getFeatureType()`)
   */
  getSupportedFormats(defaultWhenNone?: string): string[] {
    // Get the feature type
    const featureType = this.getFeatureType();

    let formats = featureType.OutputFormats?.Format as (string | TypeMetadataWFSTextOnly)[];
    if (typeof featureType.OutputFormats?.Format === 'string') formats = [featureType.OutputFormats?.Format];

    // Return the output formats supported
    const supportedFormats = formats?.map((formatItem) => {
      if (typeof formatItem === 'object' && '#text' in formatItem) {
        return formatItem['#text'];
      }
      return formatItem;
    });

    // If found any
    if (supportedFormats && supportedFormats.length > 0) {
      return supportedFormats;
    }

    // Here, none were found

    // If we want a default when none, return the default as an array
    if (defaultWhenNone) {
      return [defaultWhenNone];
    }

    // Return empty
    return [];
  }

  /**
   * Gets the version.
   *
   * @returns The service version as read from the metadata attribute
   */
  getVersion(): string | undefined {
    // Read the version from the metadata information
    return this.getServiceMetadata()?.version;
  }

  /**
   * Gets the version and defaults to 1.3.0 when couldn't be determined as it's the most stable in testing.
   *
   * @returns The service version as read from the metadata attribute, or '1.3.0' if not available
   */
  getVersionOrDefault(): string {
    // Redirect
    return this.getVersion() ?? '1.3.0';
  }

  /**
   * Gets if the version is higher than 2.0.0.
   *
   * @returns True if the version is higher than 2.0.0, otherwise false
   */
  getVersionIsHigherThan2(): boolean {
    return WfsRenderer.versionIsHigherThan2(this.getVersionOrDefault());
  }

  /**
   * Gets the advertised DescribeFeatureType operation metadata.
   *
   * @returns The operation metadata, or undefined when the service does not provide it
   */
  getMetadataDescribeFeatureTypeOperation(): TypeMetadataWFSOperationMetadataOperation | undefined {
    return OgcWfsLayerEntryConfig.readDescribeFeatureOperation(this.getServiceMetadata());
  }

  /**
   * Gets the advertised output formats for the DescribeFeatureType operation.
   *
   * @returns The advertised output format strings, or an empty array if none are found
   */
  getMetadataDescribeFeatureTypeOutputFormats(): string[] {
    const describeFeatureOp = this.getMetadataDescribeFeatureTypeOperation();
    if (!describeFeatureOp) return [];

    // Capabilities may provide one parameter object or an array of parameters.
    let describeFeatureOperationParameter = describeFeatureOp['ows:Parameter'] as TypeMetadataWFSOperationMetadataOperationParameter[];
    describeFeatureOperationParameter = toArray(describeFeatureOperationParameter);

    const describeOperationOutputFormat = describeFeatureOperationParameter.find((op) => op['@attributes'].name === 'outputFormat');
    if (!describeOperationOutputFormat) return [];

    let outputFormatValues: (string | TypeMetadataWFSTextOnly)[] = [];
    if (typeof describeOperationOutputFormat === 'object' && 'ows:AllowedValues' in describeOperationOutputFormat) {
      // GeoServer nests the advertised formats under AllowedValues.
      const allowedValues = toArray(
        describeOperationOutputFormat['ows:AllowedValues'] as
          TypeMetadataWFSOperationMetadataOperationParameterValue | TypeMetadataWFSOperationMetadataOperationParameterValue[]
      );
      outputFormatValues = allowedValues.flatMap((allowedValue) =>
        toArray(allowedValue['ows:Value'] as (string | TypeMetadataWFSTextOnly) | (string | TypeMetadataWFSTextOnly)[])
      );
    } else if (typeof describeOperationOutputFormat === 'object' && 'ows:Value' in describeOperationOutputFormat) {
      // QGIS exposes the values directly on the outputFormat parameter.
      outputFormatValues = toArray(
        describeOperationOutputFormat['ows:Value'] as string | string[] | TypeMetadataWFSTextOnly | TypeMetadataWFSTextOnly[]
      );
    }

    // XML parsers may wrap values in #text objects; discard empty entries.
    return outputFormatValues
      .flatMap((value) => {
        if (typeof value === 'string') return [value];
        if (value && typeof value === 'object' && '#text' in value) return [value['#text']];
        return [];
      })
      .filter((format) => format !== '');
  }

  /**
   * Gets the advertised GetFeature operation metadata.
   *
   * @returns The operation metadata, or undefined when the service does not provide it
   */
  getMetadataGetFeatureOperation(): TypeMetadataWFSOperationMetadataOperation | undefined {
    return OgcWfsLayerEntryConfig.readGetFeatureOperation(this.getServiceMetadata());
  }

  /**
   * Gets the advertised HTTP GET URL for the GetFeature operation.
   *
   * @returns The advertised GET URL, or undefined when the service does not provide one
   */
  getMetadataGetFeatureOperationUrlGet(): string | undefined {
    return OgcWfsLayerEntryConfig.#getMetadataGetFeatureOperationUrl(
      this.getServiceMetadata(),
      this.getMetadataGetFeatureOperation(),
      'Get'
    );
  }

  /**
   * Gets the advertised HTTP POST URL for the GetFeature operation.
   *
   * @returns The advertised POST URL, or undefined when the service does not provide one
   */
  getMetadataGetFeatureOperationUrlPost(): string | undefined {
    return OgcWfsLayerEntryConfig.#getMetadataGetFeatureOperationUrl(
      this.getServiceMetadata(),
      this.getMetadataGetFeatureOperation(),
      'Post'
    );
  }

  /**
   * Gets the full URL used for the DescribeFeatureType request.
   *
   * @returns The recorded DescribeFeatureType URL, or undefined if none was recorded
   */
  getDescribeFeatureTypeFullUrl(): string | undefined {
    return this.#describeFeatureTypeFullUrl;
  }

  /**
   * Stores the full DescribeFeatureType URL used for the layer.
   *
   * @param describeFeatureTypeFullUrl - Full URL of the DescribeFeatureType request
   */
  setDescribeFeatureTypeFullUrl(describeFeatureTypeFullUrl: string): void {
    this.#describeFeatureTypeFullUrl = describeFeatureTypeFullUrl;
  }

  // #endregion METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object) represents a WFS Feature layer type.
   *
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   *
   * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
   * @returns `true` if the config is for a WFS Feature layer; otherwise `false`
   */
  static isClassOrTypeWFSLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWFSLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.WFS);
  }

  /**
   * Finds the DescribeFeatureType operation in the WFS service metadata.
   *
   * @param metadata - The parsed WFS capabilities metadata
   * @returns The operation metadata, or undefined when the service does not advertise the operation
   */
  static readDescribeFeatureOperation(
    metadata: TypeMetadataWFSCapabilities | undefined
  ): TypeMetadataWFSOperationMetadataOperation | undefined {
    // Find the operation for DescribeFeatureOutput
    return metadata?.['ows:OperationsMetadata']?.['ows:Operation']?.find((op) => op['@attributes'].name === 'DescribeFeatureType');
  }

  /**
   * Finds the GetFeature operation in the WFS service metadata.
   *
   * @param metadata - The parsed WFS capabilities metadata
   * @returns The operation metadata, or undefined when the service does not advertise the operation
   */
  static readGetFeatureOperation(metadata: TypeMetadataWFSCapabilities | undefined): TypeMetadataWFSOperationMetadataOperation | undefined {
    // Find the operation for GetFeature
    return metadata?.['ows:OperationsMetadata']?.['ows:Operation']?.find((op) => op['@attributes'].name === 'GetFeature');
  }

  /**
   * Gets the advertised HTTP binding URL for the GetFeature operation.
   *
   * Checks OWS OperationsMetadata first, then the legacy WFS 1.0.0 Capability structure.
   *
   * @param method - The HTTP binding method
   * @returns The advertised binding URL, or undefined when none is found
   */
  static #getMetadataGetFeatureOperationUrl(
    metadata: TypeMetadataWFSCapabilities | undefined,
    operation: TypeMetadataWFSOperationMetadataOperation | undefined,
    method: 'Get' | 'Post'
  ): string | undefined {
    if (!metadata) return undefined;

    const dcpValues = operation?.['ows:DCP'];
    for (const dcp of toArray(dcpValues ?? [])) {
      const http = dcp['ows:HTTP'];
      let bindings: unknown;
      if (method === 'Get') bindings = http?.['ows:Get'];
      else bindings = http?.['ows:Post'];
      const href = OgcWfsLayerEntryConfig.#readBindingHref(bindings);
      if (href) return href;
    }

    const legacyGetFeature = OgcWfsLayerEntryConfig.#asRecord(metadata.Capability?.Request.GetFeature);
    const legacyDcpValues = legacyGetFeature?.DCPType;
    for (const dcp of toArray(legacyDcpValues ?? [])) {
      const http = OgcWfsLayerEntryConfig.#asRecord(OgcWfsLayerEntryConfig.#asRecord(dcp)?.HTTP);
      const href = OgcWfsLayerEntryConfig.#readBindingHref(http?.[method]);
      if (href) return href;
    }

    return undefined;
  }

  /**
   * Reads the endpoint href from a parsed HTTP binding.
   *
   * @param value - The parsed GET or POST binding
   * @returns The href, or undefined when none is present
   */
  static #readBindingHref(value: unknown): string | undefined {
    const values = Array.isArray(value) ? value : [value];
    for (const candidate of values) {
      const binding = OgcWfsLayerEntryConfig.#asRecord(candidate);
      const attributes = OgcWfsLayerEntryConfig.#asRecord(binding?.['@attributes']);
      const onlineResource = OgcWfsLayerEntryConfig.#asRecord(binding?.OnlineResource);
      const onlineResourceAttributes = OgcWfsLayerEntryConfig.#asRecord(onlineResource?.['@attributes']);
      const href =
        attributes?.['xlink:href'] ?? attributes?.href ?? onlineResourceAttributes?.['xlink:href'] ?? onlineResourceAttributes?.href;
      if (typeof href === 'string' && href.length > 0) return href;
    }
    return undefined;
  }

  /**
   * Narrows an unknown value to a plain record.
   *
   * @param value - The value to inspect
   * @returns The record, or undefined when the value is not a record
   */
  static #asRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    return value as Record<string, unknown>;
  }
}
