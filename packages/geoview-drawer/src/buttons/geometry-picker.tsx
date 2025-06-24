import { TypeWindow } from 'geoview-core';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerActiveGeom } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';

// import { logger } from 'geoview-core/core/utils/logger';

export interface GeometryPickerPanelProps {
  geomTypes: string[];
}

export function GeometryPickerButton(): JSX.Element {
  const { cgpv } = window as TypeWindow;
  const { ShapeLineIcon, PlaceIcon, ShowChartIcon, RectangleIcon, CircleIcon } = cgpv.ui.elements;

  const geomType = useDrawerActiveGeom();

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
export default function GeometryPickerPanel(props: GeometryPickerPanelProps): JSX.Element {
  // const { geomTypes } = props;
  const { cgpv } = window as TypeWindow;
  const { useCallback } = cgpv.reactUtilities.react;
  const { IconButton, List, ListItem } = cgpv.ui.elements;
  const { PlaceIcon, ShowChartIcon, RectangleIcon, CircleIcon } = cgpv.ui.elements;

  const { geomTypes } = props;

  // Get store values
  const displayLanguage = useAppDisplayLanguage();

  // Store actions
  const { setActiveGeom } = useDrawerActions();

  /**
   * Sets the current geometry type to Point
   */
  const handleGeometrySelectPoint = useCallback((): void => {
    setActiveGeom('Point');
  }, [setActiveGeom]);

  /**
   * Sets the current geometry type to LineString
   */
  const handleGeometrySelectLineString = useCallback((): void => {
    setActiveGeom('LineString');
  }, [setActiveGeom]);

  /**
   * Sets the current geometry type to Polygon
   */
  const handleGeometrySelectPolygon = useCallback((): void => {
    setActiveGeom('Polygon');
  }, [setActiveGeom]);

  /**
   * Sets the current geometry type to Circle
   */
  const handleGeometrySelectCircle = useCallback((): void => {
    setActiveGeom('Circle');
  }, [setActiveGeom]);

  return (
    <List>
      {geomTypes?.includes('Point') && (
        <ListItem>
          <IconButton
            id="button-point"
            tooltip={getLocalizedMessage(displayLanguage, 'drawer.point')}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectPoint}
          >
            <PlaceIcon />
            {getLocalizedMessage(displayLanguage, 'drawer.point')}
          </IconButton>
        </ListItem>
      )}
      {geomTypes?.includes('LineString') && (
        <ListItem>
          <IconButton
            id="button-linestring"
            tooltip={getLocalizedMessage(displayLanguage, 'drawer.linestring')}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectLineString}
          >
            <ShowChartIcon />
            {getLocalizedMessage(displayLanguage, 'drawer.linestring')}
          </IconButton>
        </ListItem>
      )}
      {geomTypes?.includes('Polygon') && (
        <ListItem>
          <IconButton
            id="button-polygon"
            tooltip={getLocalizedMessage(displayLanguage, 'drawer.polygon')}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectPolygon}
          >
            <RectangleIcon />
            {getLocalizedMessage(displayLanguage, 'drawer.polygon')}
          </IconButton>
        </ListItem>
      )}
      {geomTypes?.includes('Circle') && (
        <ListItem>
          <IconButton
            id="button-circle"
            tooltip={getLocalizedMessage(displayLanguage, 'drawer.circle')}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectCircle}
          >
            <CircleIcon />
            {getLocalizedMessage(displayLanguage, 'drawer.circle')}
          </IconButton>
        </ListItem>
      )}
    </List>
  );
}
