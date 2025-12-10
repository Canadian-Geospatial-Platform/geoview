import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeMetadataWFS,
  TypeMetadataWFSFeatureTypeListFeatureType,
} from '@/api/types/layer-schema-types';
import type { TypeOutfields } from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { type TypeWFSLayerConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { LayerEntryConfigLayerIdNotFoundError } from '@/core/exceptions/layer-entry-config-exceptions';
import { LayerServiceMetadataEmptyError } from '@/core/exceptions/layer-exceptions';

export interface OgcWfsLayerEntryConfigProps extends VectorLayerEntryConfigProps {}

export class OgcWfsLayerEntryConfig extends VectorLayerEntryConfig {
  /**
   * The class constructor.
   * @param {OgcWfsLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: OgcWfsLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.WFS);
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataWFS | undefined} The strongly-typed layer configuration specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataWFS | undefined {
    return super.getServiceMetadata() as TypeMetadataWFS | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeOutfields[] | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeOutfields[] | undefined {
    return super.getLayerMetadata() as TypeOutfields[] | undefined;
  }

  /**
   * Retrieves the WFS `FeatureType` metadata entry corresponding to this layer.
   * This method searches the WFS `FeatureTypeList` inside the service metadata and
   * finds the feature type whose `Name` matches the layer's `layerId`.
   * @throws {LayerServiceMetadataEmptyError}
   * Thrown when the WFS service metadata is missing or incomplete.
   * @throws {LayerEntryConfigLayerIdNotFoundError}
   * Thrown when no `FeatureType` entry matches this layer's `layerId`.
   * @returns {TypeMetadataWFSFeatureTypeListFeatureType}
   * The `FeatureType` metadata entry describing this layer, including supported
   * formats, bounding boxes, and feature schema.
   */
  getFeatureType(): TypeMetadataWFSFeatureTypeListFeatureType {
    // The metadata
    const metadata = this.getServiceMetadata();

    // If no metadata
    if (!metadata || !metadata.FeatureTypeList || !metadata.FeatureTypeList.FeatureType)
      throw new LayerServiceMetadataEmptyError(this.getGeoviewLayerId(), this.getLayerNameCascade());

    // If metadata FeatureType isn't an array
    let featureTypes: TypeMetadataWFSFeatureTypeListFeatureType[] = metadata.FeatureTypeList
      .FeatureType as TypeMetadataWFSFeatureTypeListFeatureType[];
    if (!Array.isArray(metadata.FeatureTypeList.FeatureType)) featureTypes = [metadata.FeatureTypeList.FeatureType];

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
   * This method reads the layer's feature type definition and returns the
   * default SRS/projection used by the WFS layer. If the `DefaultSRS` is
   * an object with a `#text` property (common in XML-parsed responses),
   * the method returns the value of that property. Otherwise, it returns
   * `DefaultSRS` directly.
   * @returns {string | undefined} The EPSG code or SRS string (e.g., 'EPSG:3857'),
   *          or `undefined` if the feature type or SRS cannot be determined.
   */
  getProjectionOfData(): string | undefined {
    // Get the feature type
    const featureType = this.getFeatureType();
    if (typeof featureType.DefaultSRS === 'object' && '#text' in featureType.DefaultSRS) {
      return featureType.DefaultSRS['#text'];
    }
    return featureType.DefaultSRS;
  }

  /**
   * Returns the list of supported mime output formats for this WFS layer.
   * Formats are extracted from the `OutputFormats` section of the layer's WFS
   * `FeatureType` metadata.
   * @param {string} [defaultWhenNone]
   * An optional default format to return if no supported formats are found
   * in the metadata. If provided, this value will be returned as a single-item
   * array when no formats are found.
   * @throws {LayerServiceMetadataEmptyError}
   * Propagated from `getFeatureType()` if the metadata is missing or incomplete.
   * @throws {LayerEntryConfigLayerIdNotFoundError}
   * Propagated from `getFeatureType()` if the layer's feature type is not found.
   * @returns {string[]}
   * An array of MIME types / format identifiers supported by the WFS service for GetFeature responses.
   */
  getSupportedFormats(defaultWhenNone?: string): string[] {
    // Get the feature type
    const featureType = this.getFeatureType();

    // Return the output formats supported
    const supportedFormats = featureType.OutputFormats?.Format.map((formatItem) => {
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
   * Gets the version. Defaults to 1.3.0.
   * @returns {string} The service version as read from the metadata attribute.
   */
  getVersion(): string {
    // Redirect
    return this.getServiceMetadata()?.['@attributes'].version || '1.3.0';
  }

  /**
   * Gets if the config has specified that we should fetch the styles from the WMS.
   * @returns {boolean} True when the styles should be fetched from the WMS. True by default.
   */
  getShouldFetchStylesFromWMS(): boolean {
    return (this.getGeoviewLayerConfig() as TypeWFSLayerConfig).fetchStylesOnWMS ?? true; // default: true
  }

  /**
   * Gets the WMS styles layer id associated with this WFS layer entry config if any.
   * @returns {string} The WMS styles layer id
   */
  getWmsStylesLayerId(): string {
    return this.layerEntryProps.wmsLayerId || this.layerId;
  }

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a WFS Feature layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a WFS Feature layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeWFSLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWFSLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.WFS);
  }
}
