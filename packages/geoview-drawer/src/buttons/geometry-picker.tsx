import { TypeWindow } from 'geoview-core';
import { useDrawerGeomType } from 'geoview-core/src/core/stores/store-interface-and-intial-values/drawer-state';

// import { logger } from 'geoview-core/src/core/utils/logger';

/**
 * Create a geometry button to toggle the geometry picker panel
 *
 * @returns {JSX.Element} the created Geometry picker button
 */
export default function GeometryPicker(): JSX.Element {
  const { cgpv } = window as TypeWindow;
  const { IconButton, Button } = cgpv.ui.elements;
  // const { RadioButtonUncheckedIcon, LinearScaleIcon, PolygonIcon, CircleIcon } = cgpv.ui.elements;

  // Get store values
  const geomType = useDrawerGeomType();

  // Create the icon element based on geomType
  // let iconElement;
  // switch (geomType) {
  //   case 'Point':
  //     iconElement = <RadioButtonUncheckedIcon />;
  //     break;
  //   case 'LineString':
  //     iconElement = <LinearScaleIcon />;
  //     break;
  //   case 'Polygon':
  //     iconElement = <PolygonIcon />;
  //     break;
  //   case 'Circle':
  //     iconElement = <CircleIcon />;
  //     break;
  //   default:
  //     iconElement = <RadioButtonUncheckedIcon />;
  // }

  return <Button id="draw">{geomType}</Button>;
}
