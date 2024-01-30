// Can populate using https://www.htmlcsscolor.com/hex/F1F2F5

interface DualColor {
  bg: string;
  color: string;
}


export interface IGeoViewColors {
  white: string;
  subtleText: string;
  buttonShadow: string;
  enlargeBtnBg: string;
  layersRoundButtonsBg: string; // buttons on the right side of the layer details item

  crosshairBg: string;

  bgColor: string;
  bgColorLight?: string;
  bgColorLighter?: string;
  bgColorLightest?: string;
  bgColorDark?: string;
  bgColorDarker: string;
  bgColorDarkest?: string;

  primary: string;
  primaryLight: string;
  primaryLighter?: string;
  primaryLightest?: string;
  primaryDark?: string;
  primaryDarker?: string;
  primaryDarkest?: string;

  secondary?: string;
  secondaryLight?: string;
  secondaryLighter?: string;
  secondaryLightest?: string;
  secondaryDark?: string;
  secondaryDarker?: string;
  secondaryDarkest?: string;

  textColor?: string;
  textColorLight?: string;
  textColorLighter?: string;
  textColorLightest?: string;
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
