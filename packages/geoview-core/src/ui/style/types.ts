import { darken, lighten, alpha } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';
import { range } from '@/core/utils/utilities';

// Can populate using https://www.htmlcsscolor.com/hex/F1F2F5
const ColorKeyValues = range(50, 1000, 50);
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
export class GeoViewColorClass {
  main: string;

  isInverse: boolean;

  dark: ColorRecord = {};

  light: ColorRecord = {};

  /**
   * Creates a new color variation generator.
   *
   * @param mainColor - Valid hex, rgb, or rgba color string
   * @param isInverse - Whether to invert lighten/darken operations
   */
  constructor(mainColor: string, isInverse = false) {
    if (!GeoViewColorClass.#isValidColor(mainColor)) {
      throw new NotSupportedError(`Invalid color format '${mainColor}'`);
    }
    this.main = mainColor;
    this.isInverse = isInverse;

    ColorKeyValues.forEach((i) => {
      this.dark[i] = this.darken(i / 1000);
      this.light[i] = this.lighten(i / 1000);
    });
  }

  /**
   * Validates whether a color string is a valid hex, rgb, or rgba format.
   */
  static #isValidColor(color: string): boolean {
    // Implement a color validation logic, or use a library like chroma.js
    // For simplicity, you can check if it's a valid hex, rgb, or rgba color string
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgba?\(\d+,\s*\d+,\s*\d+(,\s*(0(\.\d+)?|1(\.0)?))?\)$/;
    return colorRegex.test(color);
  }

  /**
   * Returns the main color with optional opacity.
   *
   * @param opacity - Alpha value between 0 and 1
   * @returns Color string with applied opacity
   */
  // eslint-disable-next-line no-underscore-dangle
  _main(opacity = 1): string {
    return alpha(this.main, opacity);
  }

  /**
   * Returns the main color with the specified opacity.
   *
   * @param opacity - Alpha value between 0 and 1
   * @returns Color string with applied opacity
   */
  opacity(opacity: number): string {
    return alpha(this.main, opacity);
  }

  /**
   * Lightens the main color by a coefficient (inverted in inverse mode).
   *
   * @param coefficient - Lighten intensity between 0 and 1
   * @param opacity - Optional alpha value between 0 and 1
   * @returns Lightened color string
   */
  lighten(coefficient: number, opacity = 1): string {
    if (this.isInverse) {
      return alpha(darken(this.main, coefficient), opacity);
    }
    return alpha(lighten(this.main, coefficient), opacity);
  }

  /**
   * Darkens the main color by a coefficient (inverted in inverse mode).
   *
   * @param coefficient - Darken intensity between 0 and 1
   * @param opacity - Optional alpha value between 0 and 1
   * @returns Darkened color string
   */
  darken(coefficient: number, opacity = 1): string {
    if (this.isInverse) {
      return alpha(lighten(this.main, coefficient), opacity);
    }
    return alpha(darken(this.main, coefficient), opacity);
  }

  /**
   * Returns black or white text color based on contrast ratio with the main color.
   *
   * @returns '#000000' for light backgrounds, '#FFFFFF' for dark backgrounds
   */
  contrastText(): string {
    const hex = this.main.slice(1); // removing the #

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // https://stackoverflow.com/a/3943023/112731
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF';
  }
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
