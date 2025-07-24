import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceWFSVectorInitialConfig } from '@/geo/layer/geoview-layers/vector/wfs';
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
}

export interface TypeMetadataWFS {
  FeatureTypeList: TypeMetadataWFSFeatureTypeList;
  '@attributes': TypeMetadataWFSAttributes;
  'ows:OperationsMetadata': TypeMetadataWFSOperationMetadata;
}

export interface TypeMetadataWFSFeatureTypeList {
  FeatureType: unknown;
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
  'ows:Value': TypeMetadataWFSOperationMetadataOperationParameterValue[];
}

export interface TypeMetadataWFSOperationMetadataOperationParameterValue {
  '#text': string;
}
