import { TypeJsonObject } from '@config/types/config-types';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeStyleGeometry } from '@config/types/map-schema-types';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
/** The ESRI dynamic geoview layer class. */
export declare abstract class AbstractGeoviewEsriLayerConfig extends AbstractGeoviewLayerConfig {
    #private;
    /**
     * Get the service metadata from the metadataAccessPath and store it in a protected property of the geoview layer.
     */
    fetchServiceMetadata(): Promise<void>;
    /**
     * Create the layer tree from the service metadata.
     *
     * @param {TypeJsonObject[]} layersFromMetadata The layers found in the metadata.
     * @param {number} layerId An optional layer id to use for the tree creation.
     *
     * @returns {EntryConfigBaseClass[]} The layer tree created from the metadata.
     * @protected
     */
    protected createLayerTree(layers: TypeJsonObject[], layerId?: number): EntryConfigBaseClass[];
    /** ***************************************************************************************************************************
     * This method is used to process the metadata of the sub-layers. It will fill the empty properties of the configuration
     * (renderer, initial settings, fields and aliases).
     *
     * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<TypeJsonObject>} A promise that resolve when the JSON metadata are read..
     */
    fetchEsriLayerMetadata(subLayerConfig: AbstractBaseLayerEntryConfig): Promise<TypeJsonObject>;
    /**
     * Converts an esri geometry type string to a TypeStyleGeometry.
     * @param {string} esriGeometryType - The esri geometry type to convert
     * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
     */
    protected static convertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry;
}
