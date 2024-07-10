import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
/**
 * Class used to add geoCore layer to the map
 *
 * @exports
 * @class GeoCore
 */
export declare class GeoCore {
    #private;
    /**
     * Constructor
     * @param {string} mapId the id of the map
     */
    constructor(mapId: string, displayLanguage: TypeDisplayLanguage);
    /**
     * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
     *
     * @param {GeoCoreLayerEntryConfig} geocoreLayerConfig the layer configuration
     * @returns {Promise<TypeGeoviewLayerConfig[]>} list of layer configurations to add to the map
     */
    createLayersFromUUID(uuid: string): Promise<TypeGeoviewLayerConfig[]>;
}
