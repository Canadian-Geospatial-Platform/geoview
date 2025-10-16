import { geoViewColors as defaultGeoViewColors } from '@/ui/style/default';
import type { IGeoViewColors } from '@/ui/style/types';
import { GeoViewColorClass } from '@/ui/style/types';

export const lightThemeColors: IGeoViewColors = {
  ...defaultGeoViewColors,

  bgColor: new GeoViewColorClass('#F9F9F9'),
  primary: new GeoViewColorClass('#0066CC'),
  textColor: new GeoViewColorClass('#000000'),
};
