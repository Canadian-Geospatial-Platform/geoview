import type { TypeLegendLayer } from '../../types';
interface MosaicRuleSelectorProps {
    layerDetails: TypeLegendLayer;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onClickOutside: (event: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void;
}
/**
 * An ArcGIS ImageServer mosaicRule defines how multiple raster datasets within a mosaic dataset
 * are ordered, mosaicked, and displayed on-the-fly when viewed or queried.
 * It specifies which rasters are included (e.g., by ID or attribute), their sorting order,
 * and how overlapping pixels are resolved (e.g., via blending, maximum, or minimum values)
 * @link https://developers.arcgis.com/javascript/latest/references/core/layers/support/MosaicRule
 * @param props - The properties for the MosaicRuleSelector component.
 * @returns A JSX element representing the MosaicRuleSelector component.
 */
export declare function MosaicRuleSelector(props: MosaicRuleSelectorProps): JSX.Element;
export {};
//# sourceMappingURL=mosaic-rule-selector.d.ts.map