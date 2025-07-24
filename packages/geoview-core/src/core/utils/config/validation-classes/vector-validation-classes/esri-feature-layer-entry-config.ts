import { TypeJsonArray } from '@/api/config/types/config-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TimeDimensionESRI } from '@/core/utils/date-mgt';
import { TypeSourceEsriFeatureInitialConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { TypeProjection } from '@/geo/utils/projection';
import { EsriBaseRenderer } from '@/geo/utils/renderer/esri-renderer';

export class EsriFeatureLayerEntryConfig extends VectorLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.ESRI_FEATURE;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  declare source: TypeSourceEsriFeatureInitialConfig;

  /** Max number of records for query */
  maxRecordCount?: number;

  /**
   * The class constructor.
   * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriFeatureLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Write the default properties when not specified
    this.source ??= { format: 'EsriJSON' };
    this.source.format ??= 'EsriJSON';
    this.source.dataAccessPath ??= this.geoviewLayerConfig.metadataAccessPath;

    // Format the dataAccessPath correctly
    if (!this.source.dataAccessPath!.endsWith('/')) this.source.dataAccessPath += '/';

    // Remove ID from dataAccessPath
    const splitAccessPath = this.source.dataAccessPath!.split('/');
    if (
      splitAccessPath[splitAccessPath.length - 2].toLowerCase() !== 'featureserver' &&
      splitAccessPath[splitAccessPath.length - 2].toLowerCase() !== 'mapserver'
    ) {
      splitAccessPath.pop();
      splitAccessPath.pop();
      this.source.dataAccessPath = `${splitAccessPath.join('/')}/`;
    }
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeLayerMetadataEsri | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataEsri | undefined;
  }
}

export interface TypeMetadataEsriFeature {
  // TODO: Cleanup - Remove the any by specifying
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layers: any;
  id: string;
  name: string;
}

/**
 * Represents layer metadata as read from an Esri layer service.
 */
export interface TypeLayerMetadataEsri {
  type: string;
  capabilities: string;
  geometryField: TypeLayerMetadataEsriField;
  displayField: string;
  defaultVisibility: boolean;
  minScale: number;
  maxScale: number;
  maxRecordCount: number;
  spatialReference: TypeProjection;
  sourceSpatialReference: TypeProjection;
  extent: TypeLayerMetadataEsriExtent;
  drawingInfo: TypeLayerMetadataEsriDrawingInfo;
  timeInfo: TimeDimensionESRI;
  geometryType: unknown;
  fields: TypeJsonArray;
}

export interface TypeLayerMetadataEsriDrawingInfo {
  renderer: EsriBaseRenderer;
}

export interface TypeLayerMetadataEsriExtent {
  spatialReference: TypeProjection;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface TypeLayerMetadataEsriField {
  name: unknown;
}
