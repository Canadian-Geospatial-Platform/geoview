// Can populate using https://www.htmlcsscolor.com/hex/F1F2F5

import { darken, lighten, alpha } from "@mui/material";


export class GeoViewWCAGColor {
  mainColor: string;

  constructor(mainColor: string) {
    if (!this.isValidColor(mainColor)) {
      throw new Error('Invalid color format');
    }
    this.mainColor = mainColor;
  }

  private isValidColor(color: string): boolean {
    // Implement a color validation logic, or use a library like chroma.js
    // For simplicity, you can check if it's a valid hex, rgb, or rgba color string
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgba?\(\d+,\s*\d+,\s*\d+(,\s*(0(\.\d+)?|1(\.0)?))?\)$/;
    return colorRegex.test(color);
  }

  main(opacity: number = 1): string {
    return alpha(this.mainColor, opacity);
  }

  light(opacity: number = 1): string {
    return alpha(lighten(this.mainColor, 0.2), opacity);
  }

  lighter(opacity: number = 1): string {
    return alpha(lighten(this.mainColor, 0.4), opacity);
  }

  // returns color that is 70% lighter than the main color
  lightest(opacity: number = 1): string {
    return alpha(lighten(this.mainColor, 0.7), opacity);
  }

  lighten(coefficient: number, opacity: number = 1): string {
    return alpha(lighten(this.mainColor, coefficient), opacity);
  }

  //returns color that is 20% darker than the main color
  dark(opacity: number = 1): string {
    return alpha(darken(this.mainColor, 0.2), opacity);
  }

  //returns color that is 40% darker than the main color
  darker(opacity: number = 1): string {
    return alpha(darken(this.mainColor, 0.4), opacity);
  }

  // returns color that is 70% darker than the main color
  darkest(opacity: number = 1): string {
    return alpha(darken(this.mainColor, 0.7), opacity);
  }

  darken(coefficient: number, opacity: number = 1): string {
    return alpha(darken(this.mainColor, coefficient), opacity);
  }

  //returns black or white color depending on the contrast ratio
  contrastText(): string {
    let hex = this.mainColor.slice(1); //removing the #

    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);

      // https://stackoverflow.com/a/3943023/112731
      return (r * 0.299 + g * 0.587 + b * 0.114) > 186
          ? '#000000'
          : '#FFFFFF';
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

  primary: string;
  primaryLight: string;
  primaryLighter?: string;
  primaryLightest?: string;
  primaryDark?: string;
  primaryDarker?: string;
  primaryDarkest?: string;

  textColor: GeoViewWCAGColor,

  /*textColor?: string;
  textColorLight?: string;
  textColorLighter?: string;
  textColorLightest?: string;*/
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
