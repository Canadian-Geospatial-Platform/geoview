import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
/**
 * The AbstractGeoViewVector class.
 */
export declare abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
    #private;
    /**
     * Creates a VectorSource from a layer config.
     * @param {VectorTilesLayerEntryConfig} layerConfig - Configuration object for the vector tile layer.
     * @returns An initialized VectorSource ready for use in a layer.
     */
    createVectorSource(layerConfig: VectorLayerEntryConfig): VectorSource<Feature>;
    /**
     * Overridable function to create a source configuration for the vector layer.
     * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration.
     * @param {SourceOptions} sourceOptions - The source options (default: { strategy: all }).
     * @param {ReadOptions} readOptions - The read options (default: {}).
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected onCreateVectorSource(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>, readOptions: ReadOptions): VectorSource<Feature>;
}
