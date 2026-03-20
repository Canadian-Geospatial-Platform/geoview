import type { Vector as VectorSource } from 'ol/source';
import type { CsvLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';

/**
 * Manages a CSV Feature layer.
 */
export class GVCSV extends AbstractGVVector {
  /**
   * Constructs a GVCSV layer to manage an OpenLayer layer.
   *
   * @param olSource - The OpenLayer source.
   * @param layerConfig - The layer configuration.
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(olSource: VectorSource, layerConfig: CsvLayerEntryConfig) {
    super(olSource, layerConfig);
  }
}
