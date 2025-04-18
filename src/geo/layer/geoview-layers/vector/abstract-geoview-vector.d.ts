import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { ReadOptions } from 'ol/format/Feature';
import BaseLayer from 'ol/layer/Base';
import { Geometry } from 'ol/geom';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
/**
 * The AbstractGeoViewVector class.
 */
export declare abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
    #private;
    /**
     * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
     * @returns {Promise<BaseLayer>} The GeoView base layer that has been created.
     */
    protected onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer>;
    /**
     * Create a source configuration for the vector layer.
     *
     * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
     * @param {SourceOptions} sourceOptions The source options (default: { strategy: all }).
     * @param {ReadOptions} readOptions The read options (default: {}).
     *
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected createVectorSource(layerConfig: AbstractBaseLayerEntryConfig, sourceOptions?: SourceOptions<Feature>, readOptions?: ReadOptions): VectorSource<Feature>;
    /**
     * Fetch features from ESRI Feature services with query and feature limits.
     *
     * @param {string} url - The base url for the service.
     * @param {number} featureCount - The number of features in the layer.
     * @param {number} maxRecordCount - The max features per query from the service.
     * @param {number} featureLimit - The maximum number of features to fetch per query.
     * @param {number} queryLimit - The maximum number of queries to run at once.
     * @returns {Promise<string[]>} An array of the response text for the features.
     * @private
     */
    getEsriFeatures(url: string, featureCount: number, maxRecordCount?: number, featureLimit?: number): Promise<string[]>;
    /**
     * Create a vector layer. The layer has in its properties a reference to the layer configuration used at creation time.
     * The layer entry configuration keeps a reference to the layer in the olLayer attribute.
     *
     * @param {VectorLayerEntryConfig} layerConfig The layer entry configuration used by the source.
     * @param {VectorSource} vectorSource The source configuration for the vector layer.
     *
     * @returns {VectorSource<Feature<Geometry>>} The vector layer created.
     */
    protected createVectorLayer(layerConfig: VectorLayerEntryConfig, vectorSource: VectorSource): VectorLayer<VectorSource<Feature<Geometry>>>;
    /**
     * Return the vector layer as a GeoJSON object
     * @param {string} layerPath - Layer path to get GeoJSON
     * @returns {JSON} Layer's features as GeoJSON
     */
    getFeaturesAsGeoJSON(layerPath: string): JSON;
    /**
     * Converts csv text to feature array.
     *
     * @param {string} csvData The data from the .csv file.
     * @param {VectorLayerEntryConfig} layerConfig The config of the layer.
     *
     * @returns {Feature[]} The array of features.
     */
    static convertCsv(mapId: string, csvData: string, layerConfig: VectorLayerEntryConfig): Feature[] | undefined;
}
