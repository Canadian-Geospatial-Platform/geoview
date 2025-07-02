import { TypeWindow } from 'geoview-core';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import {
  useDrawerActions,
  useDrawerActiveGeom,
  useDrawerStyle,
} from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import ReactDOMServer from 'react-dom/server';

// import { logger } from 'geoview-core/core/utils/logger';

export interface GeometryPickerPanelProps {
  geomTypes: string[];
}

export interface PointIconProps {
  IconComponent: React.ElementType;
}

export function PointIcon(props: PointIconProps): JSX.Element {
  const { cgpv } = window as TypeWindow;
  const { useEffect } = cgpv.reactUtilities.react;
  const { IconComponent } = props;

  const { setIconSrc } = useDrawerActions();
  const { fillColor, strokeColor, strokeWidth } = useDrawerStyle();

  useEffect(() => {
    // Extract SVG path from the icon
    const iconString = ReactDOMServer.renderToString(<IconComponent />);
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(iconString, 'image/svg+xml');
    const svgPath = svgDoc.querySelector('path')?.getAttribute('d');

    if (!svgPath) {
      throw new Error('SVG path not found');
    }

    // Create SVG element
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');

    // Create path element
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', svgPath);
    path.setAttribute('fill', fillColor);
    path.setAttribute('stroke', strokeColor);
    path.setAttribute('stroke-width', strokeWidth.toString());

    // Add path to SVG
    svg.appendChild(path);

    // Convert SVG to data URL
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    // Store the URL
    setIconSrc(url);

    // Clean up when component unmounts
    return () => URL.revokeObjectURL(url);
  }, [IconComponent, fillColor, setIconSrc, strokeColor, strokeWidth]);

  return <IconComponent sx={{ fill: fillColor, stroke: strokeColor, strokeWidth }} />;
}

export function GeometryPickerButton(): JSX.Element {
  const { cgpv } = window as TypeWindow;
  const { useMemo } = cgpv.reactUtilities.react;
  const { PlaceIcon, ShapeLineIcon, ShowChartIcon, HexagonIcon, RectangleIcon, CircleIcon, StarIcon } = cgpv.ui.elements;

  const geomType = useDrawerActiveGeom();
  const style = useDrawerStyle();
  const iconStyle = useMemo(
    () => ({
      fillColor: style.fillColor,
      strokeColor: style.strokeColor,
      strokeWidth: style.strokeWidth,
    }),
    [style]
  );

  if (geomType === 'Point') return <PointIcon IconComponent={PlaceIcon} />;
  if (geomType === 'LineString') return <ShowChartIcon sx={{ color: iconStyle.strokeColor }} />;
  if (geomType === 'Polygon') return <HexagonIcon sx={{ color: iconStyle.fillColor }} stroke={iconStyle.strokeColor} />;
  if (geomType === 'Rectangle') return <RectangleIcon sx={{ color: iconStyle.fillColor }} stroke={iconStyle.strokeColor} />;
  if (geomType === 'Circle') return <CircleIcon sx={{ color: iconStyle.fillColor }} stroke={iconStyle.strokeColor} />;
  if (geomType === 'Star') return <StarIcon sx={{ color: iconStyle.fillColor }} stroke={iconStyle.strokeColor} />;
  return <ShapeLineIcon sx={{ color: iconStyle.fillColor }} stroke={iconStyle.strokeColor} />;
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
  const { PlaceIcon, ShowChartIcon, HexagonIcon, RectangleIcon, CircleIcon, StarIcon } = cgpv.ui.elements;

  const { geomTypes } = props;

  // Get store values
  const displayLanguage = useAppDisplayLanguage();

  // Store actions
  const { setActiveGeom } = useDrawerActions();
  const style = useDrawerStyle();
  const activeGeom = useDrawerActiveGeom();

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
    activeButton: {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: 1,
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
   * Sets the current geometry type to Rectangle
   */
  const handleGeometrySelectRectangle = useCallback((): void => {
    setActiveGeom('Rectangle');
  }, [setActiveGeom]);

  /**
   * Sets the current geometry type to Circle
   */
  const handleGeometrySelectCircle = useCallback((): void => {
    setActiveGeom('Circle');
  }, [setActiveGeom]);

  /**
   * Sets the current geometry type to Star
   */
  const handleGeometrySelectStar = useCallback((): void => {
    setActiveGeom('Star');
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
            sx={{ ...sxClasses.iconButton, ...(activeGeom === 'Point' && sxClasses.activeButton) }}
          >
            <PointIcon IconComponent={PlaceIcon} />
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
            sx={{ ...sxClasses.iconButton, ...(activeGeom === 'LineString' && sxClasses.activeButton) }}
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
            sx={{ ...sxClasses.iconButton, ...(activeGeom === 'Polygon' && sxClasses.activeButton) }}
          >
            <HexagonIcon sx={{ color: iconStyle.color }} stroke={iconStyle.stroke} />
            {getLocalizedMessage(displayLanguage, 'drawer.polygon')}
          </IconButton>
        </ListItem>
      )}
      {geomTypes?.includes('Rectangle') && (
        <ListItem sx={sxClasses.listItem}>
          <IconButton
            id="button-rectangle"
            tooltip={getLocalizedMessage(displayLanguage, 'drawer.rectangle')}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectRectangle}
            sx={{ ...sxClasses.iconButton, ...(activeGeom === 'Rectangle' && sxClasses.activeButton) }}
          >
            <RectangleIcon sx={{ color: iconStyle.color }} stroke={iconStyle.stroke} />
            {getLocalizedMessage(displayLanguage, 'drawer.rectangle')}
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
            sx={{ ...sxClasses.iconButton, ...(activeGeom === 'Circle' && sxClasses.activeButton) }}
          >
            <CircleIcon sx={{ color: iconStyle.color }} stroke={iconStyle.stroke} />
            {getLocalizedMessage(displayLanguage, 'drawer.circle')}
          </IconButton>
        </ListItem>
      )}
      {geomTypes?.includes('Star') && (
        <ListItem sx={sxClasses.listItem}>
          <IconButton
            id="button-star"
            tooltip={getLocalizedMessage(displayLanguage, 'drawer.star')}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectStar}
            sx={{ ...sxClasses.iconButton, ...(activeGeom === 'Star' && sxClasses.activeButton) }}
          >
            <StarIcon sx={{ color: iconStyle.color }} stroke={iconStyle.stroke} />
            {getLocalizedMessage(displayLanguage, 'drawer.star')}
          </IconButton>
        </ListItem>
      )}
    </List>
  );
}
