import { geoViewColors as defaultGeoViewColors } from './default';
import { GeoViewWCAGColor, IGeoViewColors } from './geoView.interface';

export const lightThemeColors: IGeoViewColors = {
  ...defaultGeoViewColors,

  bgColor: new GeoViewWCAGColor('#3C3E42', true),
  primary: new GeoViewWCAGColor('#000000'),
  textColor: new GeoViewWCAGColor('#000000'),
};
