import type { OverviewMap as OLOverviewMap } from 'ol/control';
/** Properties for the overview map toggle. */
interface OverviewMapToggleProps {
    /** OpenLayers overview map control. */
    overviewMap: OLOverviewMap;
}
/**
 * Creates a toggle icon button for the overview map.
 *
 * @param props - The overview map toggle properties
 * @returns The toggle icon button or null if not yet mounted
 */
export declare function OverviewMapToggle(props: OverviewMapToggleProps): JSX.Element | null;
export {};
//# sourceMappingURL=overview-map-toggle.d.ts.map