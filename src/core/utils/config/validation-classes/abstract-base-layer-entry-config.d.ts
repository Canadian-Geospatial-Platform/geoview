import { TypeBaseVectorSourceInitialConfig, TypeSourceImageEsriInitialConfig, TypeSourceImageInitialConfig, TypeSourceImageStaticInitialConfig, TypeSourceWmsInitialConfig, TypeSourceTileInitialConfig, TypeLayerStyleConfig, TypeStyleGeometry, TypeLayerStyleSettings, TypeVectorSourceInitialConfig, TypeVectorTileSourceInitialConfig } from '@/api/config/types/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { TimeDimension } from '@/app';
/**
 * Base type used to define a GeoView layer to display on the map.
 */
export declare abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
    #private;
    /** The ending element of the layer configuration path. */
    layerIdExtension?: string | undefined;
    /** The calculated filter equation */
    filterEquation?: FilterNodeType[];
    /** Indicates if filter is on/off */
    legendFilterIsOff: boolean;
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeBaseVectorSourceInitialConfig | TypeSourceTileInitialConfig | TypeVectorSourceInitialConfig | TypeVectorTileSourceInitialConfig | TypeSourceImageInitialConfig | TypeSourceWmsInitialConfig | TypeSourceImageEsriInitialConfig | TypeSourceImageStaticInitialConfig;
    /** Style to apply to the vector layer. */
    layerStyle?: TypeLayerStyleConfig;
    /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
    listOfLayerEntryConfig: never;
    /**
     * Gets the service metadata that is associated to the service.
     * @returns {TypeJsonObject} The service metadata.
     */
    getServiceMetadata(): TypeJsonObject | undefined;
    /**
     * Sets the service metadata for the layer.
     * @param {TypeJsonObject} metadata - The service metadata to set
     */
    setServiceMetadata(metadata: TypeJsonObject): void;
    /**
     * Gets the metadata that is associated to the layer.
     * @returns {TypeJsonObject} The layer metadata.
     */
    getLayerMetadata(): TypeJsonObject | undefined;
    /**
     * Sets the layer metadata for the layer.
     * @param {TypeJsonObject} layerMetadata - The layer metadata to set
     */
    setLayerMetadata(layerMetadata: TypeJsonObject): void;
    /**
     * Gets the temporal dimension, if any, that is associated to the layer.
     * @returns {TimeDimension | undefined} The temporal dimension.
     */
    getTemporalDimension(): TimeDimension | undefined;
    /**
     * Sets the temporal dimension that is associated to the layer.
     * @param {TimeDimension} temporalDimension - The temporal dimension.
     */
    setTemporalDimension(temporalDimension: TimeDimension): void;
    /**
     * Gets the layer attributions
     * @returns {string[]} The layer attributions
     */
    getAttributions(): string[];
    /**
     * Sets the layer attributions
     * @param {string[]} attributions - The layer attributions
     */
    setAttributions(attributions: string[]): void;
    /**
     * The TypeStyleGeometries associated with the style as could be read from the layer config metadata.
     * @returns {TypeStyleGeometry[]} The array of TypeStyleGeometry
     */
    getTypeGeometries(): TypeStyleGeometry[];
    /**
     * The first TypeStyleSetting associated with the TypeStyleGeometry associated with the style as could be read from the layer config metadata.
     * @returns {TypeStyleSettings[]} The array of TypeStyleSettings
     */
    getFirstStyleSettings(): TypeLayerStyleSettings | undefined;
    /**
     * Overrides the serialization of the mother class
     * @returns {TypeJsonValue} The serialized TypeBaseLayerEntryConfig
     */
    onSerialize(): TypeJsonObject;
}
