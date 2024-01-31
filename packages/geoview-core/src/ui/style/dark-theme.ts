import { geoViewColors as defaultGeoViewColors } from './default';
import { GeoViewWCAGColor, IGeoViewColors } from './geoView.interface';

/**
 * Make changes to MUI default DARK theme/mode here
 * see https://mui.com/material-ui/customization/palette/
 */

export const darkThemeColors: IGeoViewColors = {
  ...defaultGeoViewColors,


  bgColor: new GeoViewWCAGColor('#3C3E42', true),
  primary: new GeoViewWCAGColor('#515BA5'),
  textColor: new GeoViewWCAGColor('#ffffff'),
};
