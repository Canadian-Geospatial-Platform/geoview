import type { TypeGeoviewLayerType, TypeBaseVectorSourceInitialConfig } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { WmsGetStylesUrlAware } from '@/api/config/validation-classes/wms-get-styles-url-aware';
export interface VectorLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Max number of records for query */
    maxRecordCount?: number;
}
/**
 * Type used to define a GeoView vector layer to display on the map.
 */
export declare abstract class VectorLayerEntryConfig extends AbstractBaseLayerEntryConfig implements WmsGetStylesUrlAware {
    #private;
    /** Max number of records for query */
    maxRecordCount?: number;
    /**
     * Creates an instance of VectorLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     * @param schemaTag - The GeoView layer type schema tag
     */
    protected constructor(layerConfig: VectorLayerEntryConfigProps | VectorLayerEntryConfig, schemaTag: TypeGeoviewLayerType);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed source configuration specific to this layer entry config
     */
    getSource(): TypeBaseVectorSourceInitialConfig;
    /**
     * Gets if the config has specified that we should fetch the styles from the WMS.
     *
     * @returns True when the styles should be fetched from the WMS. True by default
     */
    getShouldFetchStylesFromWMS(): boolean;
    /**
     * Gets the full WMS GetStyles URL used to generate the style.
     *
     * @returns The recorded WMS GetStyles URL, or undefined if none was recorded
     */
    getWmsGetStylesFullUrl(): string | undefined;
    /**
     * Stores the full WMS GetStyles URL used to generate the style.
     *
     * @param wmsGetStylesFullUrl - Full URL of the WMS GetStyles request
     */
    setWmsGetStylesFullUrl(wmsGetStylesFullUrl: string | undefined): void;
    /**
     * Gets the WMS styles URL associated with this OGC Feature layer entry config if any.
     *
     * @returns The WMS styles URL
     */
    getWmsStylesUrl(): string | undefined;
    /**
     * Gets the WMS styles URL associated with this OGC Feature layer entry config if any. Returns the DataAccessPath if not specified.
     *
     * @returns The WMS styles URL
     */
    getWmsStylesUrlOrDefault(): string;
    /**
     * Gets the WMS styles layer id associated with this WFS layer entry config if any.
     *
     * @returns The WMS styles layer id
     */
    getWmsStylesLayerId(): string | undefined;
    /**
     * Gets the WMS styles layer id associated with this WFS layer entry config if any. Returns the layerId if not specified.
     *
     * @returns The WMS styles layer id
     */
    getWmsStylesLayerIdOrDefault(): string;
}
//# sourceMappingURL=vector-layer-entry-config.d.ts.map