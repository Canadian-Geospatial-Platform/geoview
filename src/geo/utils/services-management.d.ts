import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
/** Handles known service-specific quirks that require special treatment. */
export declare class ServicesManagement {
    /**
     * Checks if the WFS service at the given URL supports the application/json output format.
     *
     * @param url - The URL of the WFS service
     * @param outputFormats - The output formats to check for support when necessary to check
     * @returns The output formats that are supported, or an empty array if none are supported
     */
    static checkWFSOutputFormats(url: string, outputFormats: string[]): string[];
    /**
     * Converts a WMS service URL to its WFS equivalent by replacing the CGI-bin path segment.
     *
     * @param url - The WMS service URL to convert
     * @returns The URL with 'cgi-bin/wms' replaced by 'cgi-bin/wfs'
     */
    static checkUrlSwitchWMSToWFS(url: string): string;
    /**
     * Converts a WFS service URL to its WMS equivalent by replacing the CGI-bin path segment.
     *
     * @param url - The WFS service URL to convert
     * @returns The URL with 'cgi-bin/wfs' replaced by 'cgi-bin/wms'
     */
    static checkUrlSwitchWFSToWMS(url: string): string;
    /**
     * Toggles the MapServer `ms:` prefix on a WFS/WMS layer identifier.
     *
     * @param layerId - The layer identifier to transform
     * @returns The layer identifier with its `ms:` prefix added or removed
     */
    static toggleMsLayerIdPrefix(layerId: string): string;
    /**
     * If no primary-key outfield is configured, marks the first `pk_lyr_id` outfield as type `oid`, falling back to `id`.
     * Field-name matching is case-insensitive; `pk_lyr_id` is preferred for CDTK layers.
     *
     * @param layerConfig - The layer configuration whose outfields are checked and may be modified
     */
    static guessAssignationOfPrimaryKeyField(layerConfig: AbstractBaseLayerEntryConfig): void;
}
//# sourceMappingURL=services-management.d.ts.map