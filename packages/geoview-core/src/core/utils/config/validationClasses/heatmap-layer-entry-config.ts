import { TypeLayerEntryType, TypeVectorSourceInitialConfig } from '@/geo/map/map-schema-types';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';

/** ******************************************************************************************************************************
 * Type used to identify a GeoView vector heamap layer to display on the map.
 */
export class VectorHeatmapLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Layer entry data type. */
  entryType = 'vector-heatmap' as TypeLayerEntryType;

  /** Initial settings to apply to the GeoView vector layer source at creation time. */
  declare source?: TypeVectorSourceInitialConfig;

  /**
   * Color gradient of the heatmap, specified as an array of CSS color strings.
   * Default = ["#00f", "#0ff", "#0f0", "#ff0", "#f00"].
   */
  gradient?: string[];

  /** Radius size in pixels. Default = 8px. */
  radius?: number;

  /** Blur size in pixels. Default = 15px. */
  blur?: number;

  /** Feature attribute to use for the weight or a function (ADD FORMAT) that returns a weight from a feature. */
  weight?: string;

  /**
   * The class constructor.
   * @param {VectorHeatmapLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: VectorHeatmapLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    super.loadedFunction();
  }
}
