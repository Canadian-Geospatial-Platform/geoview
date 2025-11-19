import type { Vector as VectorSource } from 'ol/source';
import type { CsvLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';

/**
 * Manages a CSV Feature layer.
 *
 * @exports
 * @class GVCSV
 */
export class GVCSV extends AbstractGVVector {
  /**
   * Constructs a GVCSV layer to manage an OpenLayer layer.
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {CsvLayerEntryConfig} layerConfig - The layer configuration.
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(olSource: VectorSource, layerConfig: CsvLayerEntryConfig) {
    super(olSource, layerConfig);
  }
}
