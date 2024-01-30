import { ThemeOptions } from '@mui/material';
import { GeoViewWCAGColor, IGeoViewColors, IGeoViewText } from './geoView.interface';

export const font = "'Roboto', 'Helvetica', 'Arial', sans-serif";

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
  enlargeBtnBg: '#F4F5FF',
  layersRoundButtonsBg: '#F6F6F6',

  overlayMapButtonBgColor: '#CCCCCC',

  /*bgColor: {
    darkest: '#3E3F41',
    darker: '#626365',
    dark: '#9A9B9D',
    main: '#F1F2F5',
    light: '#FFFFFF',
    lighter: '#FFFFFF',
    lightest: '#FFFFFF',
  },*/

  bgColor: new GeoViewWCAGColor('#F1F2F5'),

  /* primaryLight: '#c8cde4',
  primaryLighter: '#e0e3f1',
  primaryLightest: '#f4f5ff',
  primaryDark: '#2e2e6c',
  primaryDarker: '#1c1c4c',
  primaryDarkest: '#0f0f2e', */
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
