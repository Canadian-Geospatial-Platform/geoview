import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';
declare const ColorKeyValues: number[];
type ColorKey = (typeof ColorKeyValues)[number];
type ColorRecord = Record<ColorKey, string>;
/** Record mapping sx property names to MUI SxProps values */
export type SxStyles = Record<string, SxProps<Theme> | SxProps>;
/**
 * Generates color shades and variants from a base color.
 *
 * Creates dark and light variations at intensity levels 50-1000 using MUI's
 * darken/lighten functions. Supports inverse mode where lighten/darken are swapped.
 *
 * @throws {NotSupportedError} When color format is invalid
 */
export declare class GeoViewColorClass {
    #private;
    main: string;
    isInverse: boolean;
    dark: ColorRecord;
    light: ColorRecord;
    /**
     * Creates a new color variation generator.
     *
     * @param mainColor - Valid hex, rgb, or rgba color string
     * @param isInverse - Whether to invert lighten/darken operations
     */
    constructor(mainColor: string, isInverse?: boolean);
    /**
     * Returns the main color with optional opacity.
     *
     * @param opacity - Alpha value between 0 and 1
     * @returns Color string with applied opacity
     */
    _main(opacity?: number): string;
    /**
     * Returns the main color with the specified opacity.
     *
     * @param opacity - Alpha value between 0 and 1
     * @returns Color string with applied opacity
     */
    opacity(opacity: number): string;
    /**
     * Lightens the main color by a coefficient (inverted in inverse mode).
     *
     * @param coefficient - Lighten intensity between 0 and 1
     * @param opacity - Optional alpha value between 0 and 1
     * @returns Lightened color string
     */
    lighten(coefficient: number, opacity?: number): string;
    /**
     * Darkens the main color by a coefficient (inverted in inverse mode).
     *
     * @param coefficient - Darken intensity between 0 and 1
     * @param opacity - Optional alpha value between 0 and 1
     * @returns Darkened color string
     */
    darken(coefficient: number, opacity?: number): string;
    /**
     * Returns black or white text color based on contrast ratio with the main color.
     *
     * @returns '#000000' for light backgrounds, '#FFFFFF' for dark backgrounds
     */
    contrastText(): string;
}
/** GeoView color palette interface with semantic color categories */
export interface IGeoViewColors {
    white: string;
    bgColor: GeoViewColorClass;
    textColor: GeoViewColorClass;
    grey: GeoViewColorClass;
    primary: GeoViewColorClass;
    secondary: GeoViewColorClass;
    success: GeoViewColorClass;
    error: GeoViewColorClass;
    info: GeoViewColorClass;
    warning: GeoViewColorClass;
}
/** GeoView font size scale interface from xs to xxl with dynamic key support */
export interface IGeoViewFontSizes {
    xxl: string;
    xl: string;
    lg: string;
    md: string;
    sm: string;
    xs: string;
    default: string;
    [key: string]: string;
}
/** GeoView spacing and sizing configuration for UI layout */
export interface IGeoViewSpacingAndSizing {
    layersTitleHeight?: string;
}
export {};
//# sourceMappingURL=types.d.ts.map