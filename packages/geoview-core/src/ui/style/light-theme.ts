import { geoViewColors as defaultGeoViewColors } from './default';
import { GeoViewWCAGColor, IGeoViewColors } from './geoView.interface';

export const lightThemeColors: IGeoViewColors = {
  ...defaultGeoViewColors,

  bgColor: new GeoViewWCAGColor('#F8F8F8'),
  primary: new GeoViewWCAGColor('#515BA5'),
  textColor: new GeoViewWCAGColor('#000000'),
};
