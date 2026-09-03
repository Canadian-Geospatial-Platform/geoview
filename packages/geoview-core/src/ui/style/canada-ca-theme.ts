import { geoViewColors as defaultGeoViewColors } from '@/ui/style/default';
import type { IGeoViewColors } from '@/ui/style/types';
import { GeoViewColorClass } from '@/ui/style/types';

/** Canada.ca theme font stack based on Federal Identity Program typography guidance. */
export const canadaCaThemeFont = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Canada.ca theme color palette based on Government of Canada web and Federal Identity Program colors. */
export const canadaCaThemeColors: IGeoViewColors = {
  ...defaultGeoViewColors,

  bgColor: new GeoViewColorClass('#F8F8F8'),
  primary: new GeoViewColorClass('#26374A'),
  secondary: new GeoViewColorClass('#5b7592'),
  textColor: new GeoViewColorClass('#000000'),
  grey: new GeoViewColorClass('#969696'),
};
