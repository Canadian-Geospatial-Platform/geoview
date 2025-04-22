import _ from 'lodash';
import { darken, lighten, alpha } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';

// Can populate using https://www.htmlcsscolor.com/hex/F1F2F5
const ColorKeyValues = _.range(50, 1000, 50);
type ColorKey = (typeof ColorKeyValues)[number];
type ColorRecord = Record<ColorKey, string>;

export type SxStyles = Record<string, SxProps<Theme> | SxProps>;

export class GeoViewColorClass {
  main: string;

  isInverse: boolean;

  dark: ColorRecord = {};

  light: ColorRecord = {};

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

  static #isValidColor(color: string): boolean {
    // Implement a color validation logic, or use a library like chroma.js
    // For simplicity, you can check if it's a valid hex, rgb, or rgba color string
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgba?\(\d+,\s*\d+,\s*\d+(,\s*(0(\.\d+)?|1(\.0)?))?\)$/;
    return colorRegex.test(color);
  }

  // eslint-disable-next-line no-underscore-dangle
  _main(opacity = 1): string {
    return alpha(this.main, opacity);
  }

  opacity(opacity: number): string {
    return alpha(this.main, opacity);
  }

  lighten(coefficient: number, opacity = 1): string {
    if (this.isInverse) {
      return alpha(darken(this.main, coefficient), opacity);
    }
    return alpha(lighten(this.main, coefficient), opacity);
  }

  darken(coefficient: number, opacity = 1): string {
    if (this.isInverse) {
      return alpha(lighten(this.main, coefficient), opacity);
    }
    return alpha(darken(this.main, coefficient), opacity);
  }

  // returns black or white color depending on the contrast ratio
  contrastText(): string {
    const hex = this.main.slice(1); // removing the #

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // https://stackoverflow.com/a/3943023/112731
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF';
  }
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
