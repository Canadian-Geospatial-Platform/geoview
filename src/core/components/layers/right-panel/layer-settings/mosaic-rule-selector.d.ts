/** Properties for the mosaic rule settings panel. */
interface MosaicRulePanelProps {
    /** The layer path to configure mosaic rules for. */
    layerPath: string;
}
/**
 * Creates the inline mosaic rule settings panel for ArcGIS ImageServer layers.
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
 *
 * @param props - Properties defined in MosaicRulePanelProps interface
 * @returns The mosaic rule panel
 */
export declare function MosaicRulePanel({ layerPath }: MosaicRulePanelProps): JSX.Element;
export {};
//# sourceMappingURL=mosaic-rule-selector.d.ts.map