import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { ConfigClassOrType, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import type { TypeKmlLayerConfig } from '@/geo/layer/geoview-layers/vector/kml';
export interface KmlLayerEntryConfigProps extends VectorLayerEntryConfigProps {
}
export declare class KmlLayerEntryConfig extends VectorLayerEntryConfig {
    /**
     * Creates an instance of KmlLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: KmlLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeKmlLayerConfig;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object) represents a KML Feature layer type.
     *
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
     * @returns `true` if the config is for a KML Feature layer; otherwise `false`
     */
    static isClassOrTypeKMLLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeKmlLayerConfig;
}
//# sourceMappingURL=kml-layer-entry-config.d.ts.map