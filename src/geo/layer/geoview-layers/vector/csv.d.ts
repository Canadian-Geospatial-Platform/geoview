import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeBaseLayerEntryConfig } from '@/geo/map/map-schema-types';
export interface TypeSourceCSVInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
    format: 'CSV';
    separator?: ',';
}
export declare class TypeCsvLayerEntryConfig extends TypeVectorLayerEntryConfig {
    source: TypeSourceCSVInitialConfig;
    valueSeparator?: string | undefined;
    /**
     * The class constructor.
     * @param {TypeCsvLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
     */
    constructor(layerConfig: TypeCsvLayerEntryConfig);
}
export interface TypeCSVLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'CSV';
    listOfLayerEntryConfig: TypeCsvLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeCSVLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is CSV. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsCSV: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeCSVLayerConfig;
/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a CSV if the type attribute of the verifyIfGeoViewLayer
 * parameter is CSV. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsCSV: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is CSV;
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeCsvLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewLayerConfig attribute is CSV. The type ascention applies only to the true block of the if
 * clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsCSV: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeCsvLayerEntryConfig;
/** *****************************************************************************************************************************
 * Class used to add CSV layer to the map
 *
 * @exports
 * @class CSV
 */
export declare class CSV extends AbstractGeoViewVector {
    /** ***************************************************************************************************************************
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeCSVLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeCSVLayerConfig);
    /** ***************************************************************************************************************************
     * CSV has no metadata.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected fetchServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
     *
     * @param {string} fieldName field name for which we want to get the type.
     * @param {TypeLayerEntryConfig} layerConfig layer configuration.
     *
     * @returns {'string' | 'date' | 'number'} The type of the field.
     */
    protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number';
    /** ***************************************************************************************************************************
     * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
     * extra configuration may be done here.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * Metadata is processed when parsing the file.
     *
     * @param {TypeVectorLayerEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<TypeLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerConfig: TypeVectorLayerEntryConfig): Promise<TypeLayerEntryConfig>;
    /** ***************************************************************************************************************************
     * Converts csv to array of rows of separated values.
     *
     * @param {string} csvData The raw csv text.
     * @param {string} separator The character used to separate the values.
     *
     * @returns {string[][]} An array of the rows of the csv, split by separator.
     */
    private csvStringToArray;
    /** ***************************************************************************************************************************
     * This method sets the outfields and aliasFields of the source feature info.
     *
     * @param {string[]} headers An array of field names.
     * @param {string[]} firstRow The first row of data.
     * @param {number[]} lonLatIndices The index of lon and lat in the array.
     * @param {TypeVectorLayerEntryConfig} layerConfig The vector layer entry to configure.
     */
    private processFeatureInfoConfig;
    /** ***************************************************************************************************************************
     * Converts csv text to feature array.
     *
     * @param {string} csvData The data from the .csv file.
     * @param {TypeVectorLayerEntryConfig} layerConfig The config of the layer.
     *
     * @returns {Feature[]} The array of features.
     */
    convertCsv(csvData: string, layerConfig: TypeVectorLayerEntryConfig): Feature[] | null;
    /** ***************************************************************************************************************************
     * Create a source configuration for the vector layer.
     *
     * @param {TypeBaseLayerEntryConfig} layerConfig The layer entry configuration.
     * @param {SourceOptions} sourceOptions The source options (default: {}).
     * @param {ReadOptions} readOptions The read options (default: {}).
     *
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected createVectorSource(layerConfig: TypeBaseLayerEntryConfig, sourceOptions?: SourceOptions, readOptions?: ReadOptions): VectorSource<Feature>;
}
