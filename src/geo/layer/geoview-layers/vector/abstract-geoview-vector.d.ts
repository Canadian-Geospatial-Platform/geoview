import type Feature from 'ol/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { ReadOptions } from 'ol/format/Feature';
import type { TypePostSettings } from '@/api/types/layer-schema-types';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { GVVectorSource } from '@/geo/layer/source/vector-source';
/**
 * The AbstractGeoViewVector class.
 */
export declare abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
    #private;
    /** The maximum delay to wait before we warn about the features fetch taking a long time */
    static readonly DEFAULT_WAIT_SLOW_FETCH_WARNING: number;
    static readonly EXCLUDED_HEADERS_LAT: string[];
    static readonly EXCLUDED_HEADERS_LNG: string[];
    static readonly EXCLUDED_HEADERS_GEN: string[];
    static readonly EXCLUDED_HEADERS_STYLE: string[];
    static readonly EXCLUDED_HEADERS: string[];
    static readonly NAME_FIELD_KEYWORDS: string[];
    static readonly MAX_ESRI_FEATURES = 200000;
    /**
     * Mustoverride function to load vector features for a layer during vector source creation.
     *
     * This abstract method defines the contract for retrieving and converting
     * raw vector data into OpenLayers {@link Feature} instances. Concrete subclasses
     * must implement the logic required to fetch data from the underlying service
     * (e.g. WFS, GeoJSON, CSV) and transform it into features compatible with the
     * vector source.
     * The returned features are typically added to the vector source as part of
     * its initialization or loading lifecycle.
     *
     * @param layerConfig - The configuration object describing the vector layer, including its data source and access parameters
     * @param sourceOptions - The OpenLayers vector source options associated with the layer
     * @param readOptions - Options controlling how features are read, including the target `featureProjection`
     * @returns A promise that resolves to an array of OpenLayers features created from the underlying data source
     */
    protected abstract onCreateVectorSourceLoadFeatures(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>, readOptions: ReadOptions): Promise<Feature[]>;
    /**
     * Overrides the way the metadata is fetched.
     *
     * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
     *
     * @returns A promise that resolves with the metadata or undefined when no metadata for the particular layer type
     */
    protected onFetchServiceMetadata<T>(): Promise<T>;
    /**
     * Overridable function to create a source configuration for the vector layer.
     *
     * @param layerConfig - The layer entry configuration
     * @param sourceOptions - The source options (default: { strategy: all })
     * @returns The source configuration that will be used to create the vector layer
     */
    protected onCreateVectorSource(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>): GVVectorSource;
    /**
     * Creates a VectorSource from a layer config.
     *
     * @param layerConfig - Configuration object for the vector tile layer
     * @returns An initialized VectorSource ready for use in a layer
     */
    createVectorSource(layerConfig: VectorLayerEntryConfig): GVVectorSource;
    /**
     * Fetches text data from the given URL using settings defined in the vector source configuration.
     *
     * Supports both GET and POST requests depending on the presence of `postSettings`.
     *
     * @param url - The URL to fetch data from
     * @param postSettings - Optional POST settings from the layer config
     * @returns A promise that resolves to the fetched text response
     */
    static fetchText(url: string, postSettings?: TypePostSettings): Promise<string>;
    /**
     * Fetches json data from the given URL using settings defined in the vector source configuration.
     *
     * Supports both GET and POST requests depending on the presence of `postSettings`.
     *
     * @param url - The URL to fetch data from
     * @param postSettings - Optional POST settings from the layer config
     * @returns A promise that resolves to the fetched JSON response
     */
    static fetchJson(url: string, postSettings?: TypePostSettings): Promise<unknown>;
    /**
     * This method sets the outfields and aliasFields of the source feature info.
     *
     * @param headers - An array of field names
     * @param firstRow - The first row of data
     * @param excludedHeaders - The headers to exclude from feature info
     * @param layerConfig - The vector layer entry to configure
     */
    protected static processFeatureInfoConfig(headers: string[], firstRow: string[], excludedHeaders: string[], layerConfig: VectorLayerEntryConfig): void;
}
//# sourceMappingURL=abstract-geoview-vector.d.ts.map