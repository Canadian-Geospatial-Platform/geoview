/** Describes layer entry configs that record the WMS GetStyles URL used to generate their style. */
export interface WmsGetStylesUrlAware {
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
}
//# sourceMappingURL=wms-get-styles-url-aware.d.ts.map