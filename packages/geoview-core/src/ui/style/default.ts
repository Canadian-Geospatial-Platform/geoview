import { GeoViewColorClass, IGeoViewColors, IGeoViewFontSizes } from './types';

export const font = "'Roboto', 'Helvetica', 'Arial', sans-serif";

export const defaultFontSize = 16;

export const headingStyles = {
  fontFamily: font,
  fontWeight: 700,
};

export const opacity = {
  hoverOpacity: 0.08,
  selectedOpacity: 0.16,
  disabledOpacity: 0.38,
  focusOpacity: 0.12,
  activatedOpacity: 0.24,
};

export const geoViewColors: IGeoViewColors = {
  white: '#FFFFFF',

  bgColor: new GeoViewColorClass('#F1F2F5'),
  primary: new GeoViewColorClass('#515BA5'),
  secondary: new GeoViewColorClass('#1976d2'),
  textColor: new GeoViewColorClass('#393939'),
  success: new GeoViewColorClass('#2e7d32'),
  error: new GeoViewColorClass('#d32f2f'),
  warning: new GeoViewColorClass('#ed6c02'),
  info: new GeoViewColorClass('#2e7d32'),
  grey: new GeoViewColorClass('#9e9e9e'),
};

const fontSizes: IGeoViewFontSizes = {
  xs: `${defaultFontSize * 0.8}px`,
  sm: `${defaultFontSize * 1}px`,
  md: `${defaultFontSize * 1.2}px`,
  lg: `${defaultFontSize * 1.6}px`,
  xl: `${defaultFontSize * 2}px`,
  xxl: `${defaultFontSize * 3}px`,
};

for (let multiplier = 0.2; multiplier <= 10; multiplier += 0.1) {
  const key = `${multiplier}x`;
  fontSizes[key] = `${defaultFontSize * multiplier}px`;
}

export const geoViewFontSizes = fontSizes;
