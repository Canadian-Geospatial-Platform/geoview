import { Vector as VectorSource } from 'ol/source';
import { CsvLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { AbstractGVVector } from './abstract-gv-vector';

/**
 * Manages a CSV Feature layer.
 *
 * @exports
 * @class GVCSV
 */
export class GVCSV extends AbstractGVVector {
  /**
   * Constructs a GVCSV layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {CsvLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olSource: VectorSource, layerConfig: CsvLayerEntryConfig) {
    super(mapId, olSource, layerConfig);
  }
}
