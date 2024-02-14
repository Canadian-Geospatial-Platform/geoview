import { geoViewColors as defaultGeoViewColors } from './default';
import { GeoViewColorClass, IGeoViewColors } from './types';

export const lightThemeColors: IGeoViewColors = {
  ...defaultGeoViewColors,

  bgColor: new GeoViewColorClass('#F9F9F9'),
  primary: new GeoViewColorClass('#AA4A44'),
  textColor: new GeoViewColorClass('#000000'),
};
