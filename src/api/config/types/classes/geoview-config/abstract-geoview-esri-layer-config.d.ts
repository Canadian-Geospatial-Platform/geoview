import { TypeJsonObject } from '@/api/config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeStyleGeometry } from '@/api/config/types/map-schema-types';
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
     */
    constructor(geoviewLayerConfig: TypeJsonObject);
    /**
     * Get the service metadata from the metadataAccessPath and store it in a protected property of the geoview layer.
     * Verify that all sublayers defined in the listOfLayerEntryConfig exist in the metadata and fetch all sublayers metadata.
     * If the metadata layer tree property is defined, build it using the service metadata.
     * @override @async
     */
    fetchServiceMetadata(): Promise<void>;
    /**
     * Create a layer entry node for a specific layerId using the service metadata. The node returned can be a
     * layer or a group layer.
     *
     * @param {string} layerId The layer id to use for the subLayer creation.
     * @param {EntryConfigBaseClass | undefined} parentNode The layer's parent node.
     *
     * @returns {EntryConfigBaseClass} The subLayer created from the metadata.
     * @protected @override
     */
    protected createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass;
    /**
     * Create the layer tree using the service metadata.
     *
     * @returns {TypeJsonObject[]} The layer tree created from the metadata.
     * @protected @override
     */
    protected createLayerTreeFromServiceMetadata(): EntryConfigBaseClass[];
    /**
     * Converts an esri geometry type string to a TypeStyleGeometry.
     * @param {string} esriGeometryType - The esri geometry type to convert
     * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
     * @static
     */
    static convertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry;
}
