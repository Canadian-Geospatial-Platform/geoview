import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { CsvLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
export interface TypeSourceCSVInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
    format: 'CSV';
    separator?: ',';
}
export interface TypeCSVLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.CSV;
    listOfLayerEntryConfig: CsvLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * type guard function that redefines a CsvLayerEntryConfig as a TypeCSVLayerConfig if the geoviewLayerType attribute of the
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
export declare const geoviewEntryIsCSV: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is CsvLayerEntryConfig;
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
     * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
     * extra configuration may be done here.
     *
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void;
    /** ***************************************************************************************************************************
     * Metadata is processed when parsing the file.
     *
     * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig>;
    /** ***************************************************************************************************************************
     * Create a source configuration for the vector layer.
     *
     * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
     * @param {SourceOptions} sourceOptions The source options (default: {}).
     * @param {ReadOptions} readOptions The read options (default: {}).
     *
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected createVectorSource(layerConfig: AbstractBaseLayerEntryConfig, sourceOptions?: SourceOptions<Feature>, readOptions?: ReadOptions): VectorSource<Feature>;
}
