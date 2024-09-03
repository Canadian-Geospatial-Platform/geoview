import { TypeJsonObject } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeDisplayLanguage, TypeStyleGeometry } from '@config/types/map-schema-types';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
/**
 * The ESRI dynamic geoview layer class.
 */
export declare abstract class AbstractGeoviewEsriLayerConfig extends AbstractGeoviewLayerConfig {
    #private;
    /**
     * The class constructor.
     *
     * @param {TypeJsonObject} geoviewLayerConfig The layer configuration we want to instanciate.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
     */
    constructor(geoviewLayerConfig: TypeJsonObject, language: TypeDisplayLanguage);
    /**
     * Get the service metadata from the metadataAccessPath and store it in a protected property of the geoview layer.
     * @override
     */
    fetchServiceMetadata(): Promise<void>;
    /**
     * Converts an esri geometry type string to a TypeStyleGeometry.
     * @param {string} esriGeometryType - The esri geometry type to convert
     * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
     * @protected @static
     */
    protected static convertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry;
    /**
     * Create the layer tree using the service metadata.
     *
     * @returns {TypeJsonObject[]} The layer tree created from the metadata.
     * @protected
     */
    protected createLayerTree(): EntryConfigBaseClass[];
}
