import type { TypeLegendLayer } from '../../types';
interface LayerSettingsPanelProps {
    layerDetails: TypeLegendLayer;
}
/**
 * Panel view for layer settings content.
 *
 * Displays available settings (raster function, mosaic rule, WMS styles,
 * interaction toggles) as inline collapsible sections. The header and
 * back navigation are handled by the parent.
 *
 * @param layerDetails - The legend layer to configure.
 */
export declare function LayerSettingsPanel({ layerDetails }: LayerSettingsPanelProps): JSX.Element;
export {};
//# sourceMappingURL=layer-settings.d.ts.map