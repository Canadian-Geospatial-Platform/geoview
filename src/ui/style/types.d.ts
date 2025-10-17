import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';
declare const ColorKeyValues: number[];
type ColorKey = (typeof ColorKeyValues)[number];
type ColorRecord = Record<ColorKey, string>;
export type SxStyles = Record<string, SxProps<Theme> | SxProps>;
export declare class GeoViewColorClass {
    #private;
    main: string;
    isInverse: boolean;
    dark: ColorRecord;
    light: ColorRecord;
    constructor(mainColor: string, isInverse?: boolean);
    _main(opacity?: number): string;
    opacity(opacity: number): string;
    lighten(coefficient: number, opacity?: number): string;
    darken(coefficient: number, opacity?: number): string;
    contrastText(): string;
}
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
export interface IGeoViewSpacingAndSizing {
    layersTitleHeight?: string;
}
export {};
//# sourceMappingURL=types.d.ts.map