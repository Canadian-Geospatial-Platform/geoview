import { geoViewColors as defaultGeoViewColors } from '@/ui/style/default';
import type { IGeoViewColors } from '@/ui/style/types';
import { GeoViewColorClass } from '@/ui/style/types';

/**
 * Dark theme color palette for GeoView.
 *
 * Inverts background colors and adjusts primary/text colors for dark mode.
 *
 * @see https://mui.com/material-ui/customization/palette/
 */
export const darkThemeColors: IGeoViewColors = {
  ...defaultGeoViewColors,

  bgColor: new GeoViewColorClass('#3C3E42', true),
  primary: new GeoViewColorClass('#8ec4fa'),
  textColor: new GeoViewColorClass('#ffffff'),
};
