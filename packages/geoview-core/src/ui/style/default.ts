import { ThemeOptions } from '@mui/material';
import { GeoViewWCAGColor, IGeoViewColors, IGeoViewText } from './geoView.interface';

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
  crosshairBg: 'rgba(228, 227, 227, 0.9)',

  buttonShadow: '#e0e0e0',

  overlayMapButtonBgColor: '#CCCCCC',

  bgColor: new GeoViewWCAGColor('#F1F2F5'),

  primary: new GeoViewWCAGColor('#515BA5'),
  secondary: new GeoViewWCAGColor('#1976d2'),
  textColor: new GeoViewWCAGColor('#393939'),
  success: new GeoViewWCAGColor('#2e7d32'),
  error: new GeoViewWCAGColor('#d32f2f'),
  warning: new GeoViewWCAGColor('#ed6c02'),
  info: new GeoViewWCAGColor('#2e7d32'),
};

export const geoViewText: IGeoViewText = {
  xxxl: '32px',
  xxl: '28px',
  xl: '22px',
  lg: '18px',
  md: '14px',
  sm: '12px',
  xs: '10px',
};
