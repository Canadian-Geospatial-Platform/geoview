import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES, TypeSourceWFSVectorInitialConfig } from '@/api/config/types/map-schema-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { Projection } from '@/geo/utils/projection';

export class WfsLayerEntryConfig extends VectorLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.WFS;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  declare source: TypeSourceWFSVectorInitialConfig;

  /**
   * The class constructor.
   * @param {WfsLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: WfsLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Value for this.source.format can only be WFS.
    this.source ??= { format: 'WFS' };
    this.source.format ??= 'WFS';
    this.source.dataProjection ??= Projection.PROJECTION_NAMES.LONLAT;
    this.source.dataAccessPath ??= this.geoviewLayerConfig.metadataAccessPath;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeLayerMetadataWfs[] | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeLayerMetadataWfs[] | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataWfs[] | undefined;
  }
}

export interface TypeMetadataWFS {
  FeatureTypeList: TypeMetadataWFSFeatureTypeList;
  '@attributes': TypeMetadataWFSAttributes;
  'ows:OperationsMetadata': TypeMetadataWFSOperationMetadata;
}

export interface TypeMetadataWFSFeatureTypeList {
  FeatureType: TypeMetadataWFSFeatureTypeListFeatureType | TypeMetadataWFSFeatureTypeListFeatureType[];
}

export interface TypeMetadataWFSFeatureTypeListFeatureType {
  Name: string | TypeMetadataWFSFeatureTypeListFeatureTypeText;
  Title: string | TypeMetadataWFSFeatureTypeListFeatureTypeText;
  'ows:WGS84BoundingBox': TypeMetadataWFSFeatureTypeListFeatureTypeBBox;
}

export interface TypeMetadataWFSFeatureTypeListFeatureTypeBBox {
  'ows:LowerCorner': TypeMetadataWFSFeatureTypeListFeatureTypeBBoxCorner;
  'ows:UpperCorner': TypeMetadataWFSFeatureTypeListFeatureTypeBBoxCorner;
}

export interface TypeMetadataWFSFeatureTypeListFeatureTypeBBoxCorner {
  '#text': string;
}

export interface TypeMetadataWFSFeatureTypeListFeatureTypeText {
  '#text': string;
}

export interface TypeMetadataWFSAttributes {
  version?: string;
}

export interface TypeMetadataWFSOperationMetadata {
  'ows:Operation': TypeMetadataWFSOperationMetadataOperation[];
}

export interface TypeMetadataWFSOperationMetadataOperation {
  'ows:Parameter': TypeMetadataWFSOperationMetadataOperationParameter | TypeMetadataWFSOperationMetadataOperationParameter[];
}

export interface TypeMetadataWFSOperationMetadataOperationParameter {
  'ows:Value': TypeMetadataWFSOperationMetadataOperationParameterValue;
}

export interface TypeMetadataWFSOperationMetadataOperationParameterValue {
  '#text': string;
}

export interface TypeLayerMetadataWfs {
  name: string;
  type: string;
}
