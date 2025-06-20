import { TypeWindow } from 'geoview-core';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerGeomType } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';

// import { logger } from 'geoview-core/core/utils/logger';

export interface GeometryPickerPanelProps {
  geomTypes?: string[];
}

export function GeometryPickerButton(): JSX.Element {
  const { cgpv } = window as TypeWindow;
  const { ShapeLineIcon, PlaceIcon, ShowChartIcon, RectangleIcon, CircleIcon } = cgpv.ui.elements;

  const geomType = useDrawerGeomType();

  if (geomType === 'Point') return <PlaceIcon />;
  if (geomType === 'LineString') return <ShowChartIcon />;
  if (geomType === 'Polygon') return <RectangleIcon />;
  if (geomType === 'Circle') return <CircleIcon />;
  return <ShapeLineIcon />;
}

/**
 * Create a geometry picker panel for changing the geometry type for the draw tool
 *
 * @returns {JSX.Element} the created geometry picker panel
 */
export default function GeometryPickerPanel(): JSX.Element {
  // const { geomTypes } = props;
  const { cgpv } = window as TypeWindow;
  const { useCallback } = cgpv.reactUtilities.react;
  const { IconButton, List, ListItem } = cgpv.ui.elements;
  const { PlaceIcon, ShowChartIcon, RectangleIcon, CircleIcon } = cgpv.ui.elements;

  // Get store values
  const displayLanguage = useAppDisplayLanguage();

  // Store actions
  const { setGeomType } = useDrawerActions();

  /**
   * Handles a click on the draw button
   */
  const handleGeometrySelect = useCallback(
    (geomType: string): void => {
      setGeomType(geomType);
    },
    [setGeomType]
  );

  return (
    <List>
      <ListItem>
        <IconButton
          id="button-point"
          tooltip={getLocalizedMessage(displayLanguage, 'drawer.point')}
          tooltipPlacement="left"
          size="small"
          onClick={() => handleGeometrySelect('Point')}
        >
          <PlaceIcon />
          {getLocalizedMessage(displayLanguage, 'drawer.point')}
        </IconButton>
      </ListItem>
      <ListItem>
        <IconButton
          id="button-linestring"
          tooltip={getLocalizedMessage(displayLanguage, 'drawer.linestring')}
          tooltipPlacement="left"
          size="small"
          onClick={() => handleGeometrySelect('LineString')}
        >
          <ShowChartIcon />
          {getLocalizedMessage(displayLanguage, 'drawer.linestring')}
        </IconButton>
      </ListItem>
      <ListItem>
        <IconButton
          id="button-polygon"
          tooltip={getLocalizedMessage(displayLanguage, 'drawer.polygon')}
          tooltipPlacement="left"
          size="small"
          onClick={() => handleGeometrySelect('Polygon')}
        >
          <RectangleIcon />
          {getLocalizedMessage(displayLanguage, 'drawer.polygon')}
        </IconButton>
      </ListItem>
      <ListItem>
        <IconButton
          id="button-circle"
          tooltip={getLocalizedMessage(displayLanguage, 'drawer.circle')}
          tooltipPlacement="left"
          size="small"
          onClick={() => handleGeometrySelect('Circle')}
        >
          <CircleIcon />
          {getLocalizedMessage(displayLanguage, 'drawer.circle')}
        </IconButton>
      </ListItem>
    </List>
  );
}
