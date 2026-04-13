interface LayerSettingsPanelProps {
    /** The layer path to configure settings for. */
    layerPath: string;
}
/**
 * Panel view for layer settings content.
 *
 * Displays available settings (raster function, mosaic rule, WMS styles,
 * interaction toggles) as inline collapsible sections. The header and
 * back navigation are handled by the parent.
 *
 * @param layerPath - The layer path to configure.
 */
export declare function LayerSettingsPanel({ layerPath }: LayerSettingsPanelProps): JSX.Element;
export {};
//# sourceMappingURL=layer-settings.d.ts.map