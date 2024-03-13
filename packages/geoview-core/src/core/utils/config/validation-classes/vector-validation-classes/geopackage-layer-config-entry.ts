import { TypeSourceGeoPackageInitialConfig } from '@/geo/layer/geoview-layers/vector/geopackage';
import { CONST_LAYER_ENTRY_TYPES, TypeLocalizedString } from '@/geo/map/map-schema-types';
import { VectorLayerEntryConfig } from '../vector-layer-entry-config';

export class GeoPackageLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceGeoPackageInitialConfig;

  /**
   * The class constructor.
   * @param {GeoPackageLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GeoPackageLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Default value for this.entryType is vector
    if (this.entryType === undefined) this.entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;
    // Attribute 'style' must exist in layerConfig even if it is undefined
    if (!('style' in this)) this.style = undefined;
    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    // Value for this.source.format can only be GeoPackage.
    if (!this.source) this.source = { format: 'GeoPackage' };
    if (!this.source.format) this.source.format = 'GeoPackage';
    if (!this.source.dataAccessPath) {
      let { en, fr } = this.geoviewLayerConfig.metadataAccessPath!;
      en = en!.split('/').length > 1 ? en!.split('/').slice(0, -1).join('/') : './';
      fr = fr!.split('/').length > 1 ? fr!.split('/').slice(0, -1).join('/') : './';
      this.source.dataAccessPath = { en, fr } as TypeLocalizedString;
    }
    if (
      !(this.source.dataAccessPath!.en?.startsWith('blob') && !this.source.dataAccessPath!.en?.endsWith('/')) &&
      !this.source.dataAccessPath!.en?.toLowerCase().endsWith('.gpkg')
    ) {
      this.source.dataAccessPath!.en = this.source.dataAccessPath!.en!.endsWith('/')
        ? `${this.source.dataAccessPath!.en}${this.layerId}`
        : `${this.source.dataAccessPath!.en}/${this.layerId}`;
      this.source.dataAccessPath!.fr = this.source.dataAccessPath!.fr!.endsWith('/')
        ? `${this.source.dataAccessPath!.fr}${this.layerId}`
        : `${this.source.dataAccessPath!.fr}/${this.layerId}`;
    }
    if (!this?.source?.dataProjection) this.source.dataProjection = 'EPSG:4326';
  }
}
