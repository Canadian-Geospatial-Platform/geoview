import { TypeWindow } from 'geoview-core';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import {
  useDrawerActions,
  useDrawerActiveGeom,
  useDrawerStyle,
} from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';

// import { logger } from 'geoview-core/core/utils/logger';

export interface GeometryPickerPanelProps {
  geomTypes: string[];
}

export function GeometryPickerButton(): JSX.Element {
  const { cgpv } = window as TypeWindow;
  const { useMemo } = cgpv.reactUtilities.react;
  const { ShapeLineIcon, PlaceIcon, ShowChartIcon, RectangleIcon, CircleIcon } = cgpv.ui.elements;

  const geomType = useDrawerActiveGeom();
  const style = useDrawerStyle();
  const iconStyle = useMemo(
    () => ({
      color: style.fillColor,
      stroke: style.strokeColor,
    }),
    [style]
  );

  if (geomType === 'Point') return <PlaceIcon sx={{ color: iconStyle.color }} stroke={iconStyle.stroke} />;
  if (geomType === 'LineString') return <ShowChartIcon sx={{ color: iconStyle.stroke }} />;
  if (geomType === 'Polygon') return <RectangleIcon sx={{ color: iconStyle.color }} stroke={iconStyle.stroke} />;
  if (geomType === 'Circle') return <CircleIcon sx={{ color: iconStyle.color }} stroke={iconStyle.stroke} />;
  return <ShapeLineIcon sx={{ color: iconStyle.color }} stroke={iconStyle.stroke} />;
}

/**
 * Create a geometry picker panel for changing the geometry type for the draw tool
 *
 * @returns {JSX.Element} the created geometry picker panel
 */
export default function GeometryPickerPanel(props: GeometryPickerPanelProps): JSX.Element {
  // const { geomTypes } = props;
  const { cgpv } = window as TypeWindow;
  const { useCallback, useMemo } = cgpv.reactUtilities.react;
  const { IconButton, List, ListItem } = cgpv.ui.elements;
  const { PlaceIcon, ShowChartIcon, RectangleIcon, CircleIcon } = cgpv.ui.elements;

  const { geomTypes } = props;

  // Get store values
  const displayLanguage = useAppDisplayLanguage();

  // Store actions
  const { setActiveGeom } = useDrawerActions();
  const style = useDrawerStyle();

  const iconStyle = useMemo(
    () => ({
      color: style.fillColor,
      stroke: style.strokeColor,
    }),
    [style]
  );

  // Styles
  const sxClasses = {
    list: {
      p: 1,
    },
    listItem: {
      p: 0.5,
      justifyContent: 'center',
    },
    iconButton: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5,
      minWidth: '80px',
      textAlign: 'center',
    },
  };

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
    <List sx={sxClasses.list}>
      {geomTypes?.includes('Point') && (
        <ListItem sx={sxClasses.listItem}>
          <IconButton
            id="button-point"
            tooltip={getLocalizedMessage(displayLanguage, 'drawer.point')}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectPoint}
            sx={sxClasses.iconButton}
          >
            <PlaceIcon sx={{ color: iconStyle.color }} stroke={iconStyle.stroke} />
            {getLocalizedMessage(displayLanguage, 'drawer.point')}
          </IconButton>
        </ListItem>
      )}
      {geomTypes?.includes('LineString') && (
        <ListItem sx={sxClasses.listItem}>
          <IconButton
            id="button-linestring"
            tooltip={getLocalizedMessage(displayLanguage, 'drawer.linestring')}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectLineString}
            sx={sxClasses.iconButton}
          >
            <ShowChartIcon sx={{ color: iconStyle.stroke }} />
            {getLocalizedMessage(displayLanguage, 'drawer.linestring')}
          </IconButton>
        </ListItem>
      )}
      {geomTypes?.includes('Polygon') && (
        <ListItem sx={sxClasses.listItem}>
          <IconButton
            id="button-polygon"
            tooltip={getLocalizedMessage(displayLanguage, 'drawer.polygon')}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectPolygon}
            sx={sxClasses.iconButton}
          >
            <RectangleIcon sx={{ color: iconStyle.color }} stroke={iconStyle.stroke} />
            {getLocalizedMessage(displayLanguage, 'drawer.polygon')}
          </IconButton>
        </ListItem>
      )}
      {geomTypes?.includes('Circle') && (
        <ListItem sx={sxClasses.listItem}>
          <IconButton
            id="button-circle"
            tooltip={getLocalizedMessage(displayLanguage, 'drawer.circle')}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectCircle}
            sx={sxClasses.iconButton}
          >
            <CircleIcon sx={{ color: iconStyle.color }} stroke={iconStyle.stroke} />
            {getLocalizedMessage(displayLanguage, 'drawer.circle')}
          </IconButton>
        </ListItem>
      )}
    </List>
  );
}
