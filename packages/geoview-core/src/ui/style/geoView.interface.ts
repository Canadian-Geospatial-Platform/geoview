// Can populate using https://www.htmlcsscolor.com/hex/F1F2F5
/* eslint-disable no-underscore-dangle */
import { darken, lighten, alpha } from '@mui/material';

export class GeoViewWCAGColor {
  main: string;

  light: string;

  lighter: string;

  lightest: string;

  dark: string;

  darker: string;

  darkest: string;

  constructor(mainColor: string) {
    if (!this.isValidColor(mainColor)) {
      throw new Error('Invalid color format');
    }
    this.main = mainColor;

    this.light = this._light();
    this.lighter = this._lighter();
    this.lightest = this._lightest();
    this.dark = this._dark();
    this.darker = this._darker();
    this.darkest = this._darkest();
  }

  private isValidColor(color: string): boolean {
    // Implement a color validation logic, or use a library like chroma.js
    // For simplicity, you can check if it's a valid hex, rgb, or rgba color string
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgba?\(\d+,\s*\d+,\s*\d+(,\s*(0(\.\d+)?|1(\.0)?))?\)$/;
    return colorRegex.test(color);
  }

  _main(opacity = 1): string {
    return alpha(this.main, opacity);
  }

  _light(opacity = 1): string {
    return alpha(lighten(this.main, 0.2), opacity);
  }

  _lighter(opacity = 1): string {
    return alpha(lighten(this.main, 0.4), opacity);
  }

  // returns color that is 70% lighter than the main color
  _lightest(opacity = 1): string {
    return alpha(lighten(this.main, 0.7), opacity);
  }

  _lighten(coefficient: number, opacity = 1): string {
    return alpha(lighten(this.main, coefficient), opacity);
  }

  // returns color that is 20% darker than the main color
  _dark(opacity = 1): string {
    return alpha(darken(this.main, 0.2), opacity);
  }

  // returns color that is 40% darker than the main color
  _darker(opacity = 1): string {
    return alpha(darken(this.main, 0.4), opacity);
  }

  // returns color that is 70% darker than the main color
  _darkest(opacity = 1): string {
    return alpha(darken(this.main, 0.7), opacity);
  }

  _darken(coefficient: number, opacity = 1): string {
    return alpha(darken(this.main, coefficient), opacity);
  }

  // returns black or white color depending on the contrast ratio
  _contrastText(): string {
    const hex = this.main.slice(1); // removing the #

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // https://stackoverflow.com/a/3943023/112731
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF';
  }
}

interface IGeoViewShadedColor {
  main: string;
  light: string;
  lighter?: string;
  lightest?: string;
  dark?: string;
  darker?: string;
  darkest?: string;
}

export interface IGeoViewColors {
  white: string;
  subtleText: string;
  buttonShadow: string;
  enlargeBtnBg: string;

  layersRoundButtonsBg: string; // buttons on the right side of the layer details item

  overlayMapButtonBgColor: string;

  crosshairBg: string;

  bgColor: IGeoViewShadedColor;

  textColor: GeoViewWCAGColor;

  primary: GeoViewWCAGColor;
}

export interface IGeoViewText {
  xxxl: string;
  xxl: string;
  xl: string;
  lg: string;
  md: string;
  sm: string;
  xs: string;
}

export interface IGeoViewSpacingAndSizing {
  layersTitleHeight?: string;
}
