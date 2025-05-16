import { Vector as VectorSource } from 'ol/source';
import { CsvLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
/**
 * Manages a CSV Feature layer.
 *
 * @exports
 * @class GVCSV
 */
export declare class GVCSV extends AbstractGVVector {
    /**
     * Constructs a GVCSV layer to manage an OpenLayer layer.
     * @param {VectorSource} olSource - The OpenLayer source.
     * @param {CsvLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: VectorSource, layerConfig: CsvLayerEntryConfig);
}
