import { TypeJsonArray, TypeJsonValue } from '@/api/config/types/config-types';
export declare class GeoViewError extends Error {
    mapId: string;
    /**
     * Constructor to initialize the GeoViewError with a map ID.
     * @param mapId - The map ID associated with the error
     */
    constructor(mapId: string, localizedKeyOrMessage: string, params?: TypeJsonValue[] | TypeJsonArray | string[]);
}
