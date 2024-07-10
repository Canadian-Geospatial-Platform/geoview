import { TypeBaseSourceVectorInitialConfig, TypeSourceImageEsriInitialConfig, TypeSourceImageInitialConfig, TypeSourceImageStaticInitialConfig, TypeSourceImageWmsInitialConfig, TypeSourceTileInitialConfig, TypeStyleConfig, TypeStyleGeometry, TypeStyleSettings, TypeVectorSourceInitialConfig, TypeVectorTileSourceInitialConfig } from '@/geo/map/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeJsonObject } from '@/core/types/global-types';
import { FilterNodeArrayType } from '@/geo/utils/renderer/geoview-renderer-types';
/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map.
 */
export declare abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
    #private;
    /** The ending element of the layer configuration path. */
    layerIdExtension?: string | undefined;
    /** The calculated filter equation */
    filterEquation?: FilterNodeArrayType;
    /** Indicates if filter is on/off */
    legendFilterIsOff: boolean;
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeBaseSourceVectorInitialConfig | TypeSourceTileInitialConfig | TypeVectorSourceInitialConfig | TypeVectorTileSourceInitialConfig | TypeSourceImageInitialConfig | TypeSourceImageWmsInitialConfig | TypeSourceImageEsriInitialConfig | TypeSourceImageStaticInitialConfig;
    /** Style to apply to the vector layer. */
    style?: TypeStyleConfig;
    /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
    listOfLayerEntryConfig: never;
    /**
     * The class constructor.
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    protected constructor(layerConfig: AbstractBaseLayerEntryConfig);
    /**
     * Gets the metadata that is associated to the layer.
     * @returns {TypeJsonObject} The layer metadata.
     */
    getMetadata(): TypeJsonObject | undefined;
    /**
     * Sets the layer metadata for the layer.
     * @param {TypeJsonObject} layerMetadata - The layer metadata to set
     */
    setMetadata(layerMetadata: TypeJsonObject): void;
    /**
     * The TypeStyleGeometries associated with the style as could be read from the layer config metadata.
     * @returns {TypeStyleGeometry[]} The array of TypeStyleGeometry
     */
    getTypeGeometries(): TypeStyleGeometry[];
    /**
     * The first TypeStyleSetting associated with the TypeStyleGeometry associated with the style as could be read from the layer config metadata.
     * @returns {TypeStyleSettings[]} The array of TypeStyleSettings
     */
    getFirstStyleSettings(): TypeStyleSettings | undefined;
    /**
     * Overrides the serialization of the mother class
     * @returns {TypeJsonValue} The serialized TypeBaseLayerEntryConfig
     */
    onSerialize(): TypeJsonObject;
}
