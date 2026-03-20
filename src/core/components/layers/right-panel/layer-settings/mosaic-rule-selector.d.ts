import type { TypeLegendLayer } from '../../types';
interface MosaicRulePanelProps {
    layerDetails: TypeLegendLayer;
}
/**
 * Inline panel section for configuring mosaic rules on ArcGIS ImageServer layers.
 *
 * Displays method, operation, and ascending controls directly within
 * the settings panel instead of a floating menu.
 *
 * An ArcGIS ImageServer mosaicRule defines how multiple raster datasets within a mosaic dataset
 * are ordered, mosaicked, and displayed on-the-fly when viewed or queried.
 * It specifies which rasters are included (e.g., by ID or attribute), their sorting order,
 * and how overlapping pixels are resolved (e.g., via blending, maximum, or minimum values).
 *
 * @see {@link https://developers.arcgis.com/javascript/latest/references/core/layers/support/MosaicRule}
 * @param layerDetails - The legend layer to configure mosaic rules for.
 * @returns A JSX element representing the MosaicRulePanel component.
 */
export declare function MosaicRulePanel({ layerDetails }: MosaicRulePanelProps): JSX.Element;
export {};
//# sourceMappingURL=mosaic-rule-selector.d.ts.map