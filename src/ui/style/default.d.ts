import type { IGeoViewColors, IGeoViewFontSizes } from '@/ui/style/types';
/** Default font family stack for GeoView UI components */
export declare const font = "'Roboto', 'Helvetica', 'Arial', sans-serif";
/** Default base font size multiplier in rem units */
export declare const defaultFontSize = 1;
/** Heading typography styles with bold weight */
export declare const headingStyles: {
    fontFamily: string;
    fontWeight: number;
};
/**
 * Visually hidden style pattern for screen reader-only content.
 *
 * This CSS pattern hides content visually while keeping it accessible
 * to screen readers, following WCAG best practices.
 *
 * @see https://www.w3.org/WAI/WCAG21/Techniques/css/C7
 */
export declare const visuallyHidden: {
    readonly position: "absolute";
    readonly width: "1px";
    readonly height: "1px";
    readonly padding: 0;
    readonly margin: "-1px";
    readonly overflow: "hidden";
    readonly clip: "rect(0, 0, 0, 0)";
    readonly whiteSpace: "nowrap";
    readonly border: 0;
};
/** Opacity values for interactive states (hover, selected, disabled, focus, activated) */
export declare const opacity: {
    hoverOpacity: number;
    selectedOpacity: number;
    disabledOpacity: number;
    focusOpacity: number;
    activatedOpacity: number;
};
/** Default GeoView color palette with primary, secondary, and semantic colors */
export declare const geoViewColors: IGeoViewColors;
/** GeoView font size scale from xs to xxl with dynamic multiplier entries */
export declare const geoViewFontSizes: IGeoViewFontSizes;
//# sourceMappingURL=default.d.ts.map