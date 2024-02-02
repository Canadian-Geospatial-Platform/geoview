import { geoViewColors as defaultGeoViewColors } from './default';
import { GeoViewColorClass, IGeoViewColors } from './types';

/**
 * Make changes to MUI default DARK theme/mode here
 * see https://mui.com/material-ui/customization/palette/
 */

export const darkThemeColors: IGeoViewColors = {
  ...defaultGeoViewColors,

  bgColor: new GeoViewColorClass('#3C3E42', true),
  primary: new GeoViewColorClass('#8ec4fa'),
  textColor: new GeoViewColorClass('#ffffff'),
};
