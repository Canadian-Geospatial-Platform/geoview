import type { IGeoViewColors, IGeoViewFontSizes } from '@/ui/style/types';
import { GeoViewColorClass } from '@/ui/style/types';

export const font = "'Roboto', 'Helvetica', 'Arial', sans-serif";

export const defaultFontSize = 1;

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
  xs: `${defaultFontSize * 0.7}rem`,
  sm: `${defaultFontSize * 0.875}rem`,
  md: `${defaultFontSize * 1.125}rem`,
  lg: `${defaultFontSize * 1.3}rem`,
  xl: `${defaultFontSize * 1.6}rem`,
  xxl: `${defaultFontSize * 2}rem`,
  default: `${defaultFontSize}rem`,
};

for (let multiplier = 0.2; multiplier <= 10; multiplier += 0.1) {
  const key = `${multiplier}x`;
  fontSizes[key] = `${defaultFontSize * multiplier}rem`;
}

export const geoViewFontSizes = fontSizes;
