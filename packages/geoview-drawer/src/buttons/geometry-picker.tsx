import ReactDOMServer from 'react-dom/server';
import type { TypeWindow } from 'geoview-core';
import { useStoreDrawerActiveGeom, useStoreDrawerIsDrawing, useStoreDrawerStyle } from 'geoview-core/core/stores/states/drawer-state';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useTheme } from '@mui/material/styles';

import { logger } from 'geoview-core/core/utils/logger';
import { useDrawerController } from 'geoview-core/core/controllers/use-controllers';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import type { SxStyles } from 'geoview-core/ui/style/types';

/** Props for the GeometryPickerPanel component. */
export interface GeometryPickerPanelProps {
  geomTypes: string[];
}

/** Props for the PointIcon component. */
export interface PointIconProps {
  IconComponent: React.ElementType;
}

/**
 * Renders a point icon with the current drawing style applied.
 *
 * @param props - The component props
 * @returns The styled point icon element
 */
export function PointIcon(props: PointIconProps): JSX.Element {
  logger.logTraceRender('geoview-drawer/buttons/geometry-picker > PointIcon');

  const { cgpv } = window as TypeWindow;
  const { useEffect } = cgpv.reactUtilities.react;
  const { IconComponent } = props;

  // Store
  const { fillColor, strokeColor, strokeWidth } = useStoreDrawerStyle();
  const drawerController = useDrawerController();

  useEffect(() => {
    logger.logTraceUseEffect('POINT ICON - Icon style sync', IconComponent, fillColor, strokeColor, strokeWidth);

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
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgStr)}`;

    // Store the URL
    drawerController.setDrawerIconSrc(dataUrl);

    // Clean up when component unmounts
    return () => URL.revokeObjectURL(dataUrl);
  }, [IconComponent, fillColor, drawerController, strokeColor, strokeWidth]);

  return <IconComponent sx={{ fill: fillColor, stroke: strokeColor, strokeWidth }} />;
}

/**
 * Renders the geometry picker button with the active geometry icon.
 *
 * @returns The geometry picker button element
 */
export function GeometryPickerButton(): JSX.Element {
  logger.logTraceRender('geoview-drawer/buttons/geometry-picker > GeometryPickerButton');

  const { cgpv } = window as TypeWindow;
  const { useMemo } = cgpv.reactUtilities.react;
  const { PlaceIcon, TextFieldsIcon, ShapeLineIcon, ShowChartIcon, HexagonIcon, RectangleIcon, CircleIcon, StarIcon } = cgpv.ui.elements;

  const geomType = useStoreDrawerActiveGeom();
  const style = useStoreDrawerStyle();

  /**
   * Builds icon style properties from the current drawing style.
   */
  const memoIconStyle = useMemo(() => {
    logger.logTraceUseMemo('GEOMETRY-PICKER - GeomIcon - memoIconStyle', style);
    return {
      fillColor: style.fillColor,
      strokeColor: style.strokeColor,
      textColor: style.textColor,
      textHaloColor: style.textHaloColor,
    };
  }, [style]);

  if (geomType === 'Point') return <PointIcon IconComponent={PlaceIcon} />;
  if (geomType === 'Text') return <TextFieldsIcon sx={{ color: memoIconStyle.textColor }} stroke={memoIconStyle.textHaloColor} />;
  if (geomType === 'LineString') return <ShowChartIcon sx={{ color: memoIconStyle.strokeColor }} />;
  if (geomType === 'Polygon') return <HexagonIcon sx={{ color: memoIconStyle.fillColor }} stroke={memoIconStyle.strokeColor} />;
  if (geomType === 'Rectangle') return <RectangleIcon sx={{ color: memoIconStyle.fillColor }} stroke={memoIconStyle.strokeColor} />;
  if (geomType === 'Circle') return <CircleIcon sx={{ color: memoIconStyle.fillColor }} stroke={memoIconStyle.strokeColor} />;
  if (geomType === 'Star') return <StarIcon sx={{ color: memoIconStyle.fillColor }} stroke={memoIconStyle.strokeColor} />;
  return <ShapeLineIcon sx={{ color: memoIconStyle.fillColor }} stroke={memoIconStyle.strokeColor} />;
}

/**
 * Creates a geometry picker panel for changing the geometry type for the draw tool.
 *
 * Uses Button component with aria-pressed for WCAG-compliant toggle semantics,
 * matching the basemap select pattern.
 *
 * @param props - The component props
 * @returns The geometry picker panel element
 */
export function GeometryPickerPanel(props: GeometryPickerPanelProps): JSX.Element {
  logger.logTraceRender('geoview-drawer/buttons/geometry-picker > GeometryPickerPanel');

  // const { geomTypes } = props;
  const { cgpv } = window as TypeWindow;
  const { useCallback, useMemo } = cgpv.reactUtilities.react;
  const { Button, List, ListItem } = cgpv.ui.elements;
  const { PlaceIcon, TextFieldsIcon, ShowChartIcon, HexagonIcon, RectangleIcon, CircleIcon, StarIcon } = cgpv.ui.elements;

  const { geomTypes } = props;
  const theme = useTheme();

  // Store
  const { t } = useTranslation<string>();
  const style = useStoreDrawerStyle();
  const activeGeom = useStoreDrawerActiveGeom();
  const isDrawing = useStoreDrawerIsDrawing();
  const drawerController = useDrawerController();

  /**
   * Builds custom sx classes for the geometry picker panel.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    return getSxClasses(theme);
  }, [theme]);

  /**
   * Builds icon style properties from the current drawing style.
   */
  const memoIconStyle = useMemo(() => {
    logger.logTraceUseMemo('GEOMETRY-PICKER - GeometryPickerPanel - memoIconStyle', style);
    return {
      color: style.fillColor,
      stroke: style.strokeColor,
      textColor: style.textColor,
      textHaloColor: style.textHaloColor,
    };
  }, [style]);

  // Styles
  const sxClasses = {
    list: {
      p: 1,
    },
    listItem: {
      p: 0.5,
    },
  };

  // #region Handlers

  /**
   * Checks if drawing is active and starts drawing if not.
   */
  const safeStartDrawing = useCallback((): void => {
    if (!isDrawing) {
      drawerController.toggleDrawing();
    }
  }, [isDrawing, drawerController]);

  /**
   * Sets the current geometry type to Point
   */
  const handleGeometrySelectPoint = useCallback((): void => {
    drawerController.setActiveGeom('Point');
    safeStartDrawing();
  }, [drawerController, safeStartDrawing]);

  /**
   * Sets the current geometry type to Text
   */
  const handleGeometrySelectText = useCallback((): void => {
    drawerController.setActiveGeom('Text');
    safeStartDrawing();
  }, [drawerController, safeStartDrawing]);

  /**
   * Sets the current geometry type to LineString
   */
  const handleGeometrySelectLineString = useCallback((): void => {
    drawerController.setActiveGeom('LineString');
    safeStartDrawing();
  }, [drawerController, safeStartDrawing]);

  /**
   * Sets the current geometry type to Polygon
   */
  const handleGeometrySelectPolygon = useCallback((): void => {
    drawerController.setActiveGeom('Polygon');
    safeStartDrawing();
  }, [drawerController, safeStartDrawing]);

  /**
   * Sets the current geometry type to Rectangle
   */
  const handleGeometrySelectRectangle = useCallback((): void => {
    drawerController.setActiveGeom('Rectangle');
    safeStartDrawing();
  }, [drawerController, safeStartDrawing]);

  /**
   * Sets the current geometry type to Circle
   */
  const handleGeometrySelectCircle = useCallback((): void => {
    drawerController.setActiveGeom('Circle');
    safeStartDrawing();
  }, [drawerController, safeStartDrawing]);

  /**
   * Sets the current geometry type to Star
   */
  const handleGeometrySelectStar = useCallback((): void => {
    drawerController.setActiveGeom('Star');
    safeStartDrawing();
  }, [drawerController, safeStartDrawing]);

  // #endregion

  return (
    <List sx={sxClasses.list}>
      {geomTypes?.includes('Point') && (
        <ListItem sx={sxClasses.listItem}>
          <Button
            id="button-point"
            type="textWithIcon"
            startIcon={<PointIcon IconComponent={PlaceIcon} />}
            aria-label={t('drawer.point')}
            aria-pressed={activeGeom === 'Point'}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectPoint}
            fullWidth
            sx={memoSxClasses.button}
          >
            {t('drawer.point')}
          </Button>
        </ListItem>
      )}
      {geomTypes?.includes('Text') && (
        <ListItem sx={sxClasses.listItem}>
          <Button
            id="button-text"
            type="textWithIcon"
            startIcon={<TextFieldsIcon sx={{ color: memoIconStyle.textColor }} stroke={memoIconStyle.textHaloColor} />}
            aria-label={t('drawer.text')}
            aria-pressed={activeGeom === 'Text'}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectText}
            fullWidth
            sx={memoSxClasses.button}
          >
            {t('drawer.text')}
          </Button>
        </ListItem>
      )}
      {geomTypes?.includes('LineString') && (
        <ListItem sx={sxClasses.listItem}>
          <Button
            id="button-linestring"
            type="textWithIcon"
            startIcon={<ShowChartIcon sx={{ color: memoIconStyle.stroke }} />}
            aria-label={t('drawer.linestring')}
            aria-pressed={activeGeom === 'LineString'}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectLineString}
            fullWidth
            sx={memoSxClasses.button}
          >
            {t('drawer.linestring')}
          </Button>
        </ListItem>
      )}
      {geomTypes?.includes('Polygon') && (
        <ListItem sx={sxClasses.listItem}>
          <Button
            id="button-polygon"
            type="textWithIcon"
            startIcon={<HexagonIcon sx={{ color: memoIconStyle.color }} stroke={memoIconStyle.stroke} />}
            aria-label={t('drawer.polygon')}
            aria-pressed={activeGeom === 'Polygon'}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectPolygon}
            fullWidth
            sx={memoSxClasses.button}
          >
            {t('drawer.polygon')}
          </Button>
        </ListItem>
      )}
      {geomTypes?.includes('Rectangle') && (
        <ListItem sx={sxClasses.listItem}>
          <Button
            id="button-rectangle"
            type="textWithIcon"
            startIcon={<RectangleIcon sx={{ color: memoIconStyle.color }} stroke={memoIconStyle.stroke} />}
            aria-label={t('drawer.rectangle')}
            aria-pressed={activeGeom === 'Rectangle'}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectRectangle}
            fullWidth
            sx={memoSxClasses.button}
          >
            {t('drawer.rectangle')}
          </Button>
        </ListItem>
      )}
      {geomTypes?.includes('Circle') && (
        <ListItem sx={sxClasses.listItem}>
          <Button
            id="button-circle"
            type="textWithIcon"
            startIcon={<CircleIcon sx={{ color: memoIconStyle.color }} stroke={memoIconStyle.stroke} />}
            aria-label={t('drawer.circle')}
            aria-pressed={activeGeom === 'Circle'}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectCircle}
            fullWidth
            sx={memoSxClasses.button}
          >
            {t('drawer.circle')}
          </Button>
        </ListItem>
      )}
      {geomTypes?.includes('Star') && (
        <ListItem sx={sxClasses.listItem}>
          <Button
            id="button-star"
            type="textWithIcon"
            startIcon={<StarIcon sx={{ color: memoIconStyle.color }} stroke={memoIconStyle.stroke} />}
            aria-label={t('drawer.star')}
            aria-pressed={activeGeom === 'Star'}
            tooltipPlacement="left"
            size="small"
            onClick={handleGeometrySelectStar}
            fullWidth
            sx={memoSxClasses.button}
          >
            {t('drawer.star')}
          </Button>
        </ListItem>
      )}
    </List>
  );
}
