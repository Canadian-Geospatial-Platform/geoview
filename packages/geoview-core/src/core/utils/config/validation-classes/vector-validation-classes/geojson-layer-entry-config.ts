import { TypeSourceGeoJSONInitialConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { CONST_LAYER_ENTRY_TYPES } from '@/geo/map/map-schema-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';

export class GeoJSONLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceGeoJSONInitialConfig;

  /**
   * The class constructor.
   * @param {GeoJSONLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GeoJSONLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    if (!layerConfig.geoviewLayerConfig.metadataAccessPath && !layerConfig.source?.dataAccessPath) {
      throw new Error(
        `dataAccessPath is mandatory for GeoView layer ${this.geoviewLayerConfig.geoviewLayerId} of type GeoJSON when the metadataAccessPath is undefined.`
      );
    }
    // Default value for this.entryType is vector
    if (layerConfig.entryType === undefined) this.entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

    // Attribute 'style' must exist in layerConfig even if it is undefined
    if (!('style' in layerConfig)) this.style = undefined;

    // Value for this.source.format can only be GeoJSON.
    this.source = { format: 'GeoJSON' };
    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it
    // and place the layerId at the end of it.

    let { en, fr } = layerConfig.geoviewLayerConfig.metadataAccessPath!;
    // Remove the metadata file name and keep only the path to the directory where the metadata resides
    en = en!.split('/').length > 1 ? en!.split('/').slice(0, -1).join('/') : './';
    fr = fr!.split('/').length > 1 ? fr!.split('/').slice(0, -1).join('/') : './';
    this.source.dataAccessPath = { en, fr };

    if (
      !(this.source.dataAccessPath!.en?.startsWith('blob') && !this.source.dataAccessPath!.en?.endsWith('/')) &&
      !this.source.dataAccessPath!.en?.toUpperCase().endsWith('.JSON' || '.GEOJSON') &&
      !this.source.dataAccessPath!.en?.toUpperCase().endsWith('=JSON') // Doesn't work if included in above line
    ) {
      this.source.dataAccessPath!.en = this.source.dataAccessPath!.en!.endsWith('/')
        ? `${this.source.dataAccessPath!.en}${this.layerId}`
        : `${this.source.dataAccessPath!.en}/${this.layerId}`;
      this.source.dataAccessPath!.fr = this.source.dataAccessPath!.fr!.endsWith('/')
        ? `${this.source.dataAccessPath!.fr}${this.layerId}`
        : `${this.source.dataAccessPath!.fr}/${this.layerId}`;
    }

    this.source.dataProjection = 'EPSG:4326';
  }
}
