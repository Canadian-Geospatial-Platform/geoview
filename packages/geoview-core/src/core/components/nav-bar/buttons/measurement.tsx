import type { ReactNode } from 'react';
import { createElement, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { LineString, Polygon } from 'ol/geom';
import { Overlay } from 'ol';
import type { DrawEvent as OLDrawEvent } from 'ol/interaction/Draw';
import { Style, Stroke, Fill } from 'ol/style';

import { ToggleButtonGroup, ToggleButton } from '@mui/material';

import { logger } from '@/core/utils/logger';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { IconButton } from '@/ui/icon-button/icon-button';
import { Box, Stack, Switch } from '@/ui';
import { ShowChartIcon, DeleteIcon, StraightenIcon } from '@/ui/icons';
import { HexagonOutlined as HexagonOutlinedIcon } from '@mui/icons-material';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import { GeoUtilities } from '@/geo/utils/utilities';
import { formatLength, formatArea } from '@/core/utils/utilities';
import type { Draw } from '@/geo/interaction/draw';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

const MEASURE_GROUP_KEY = 'geoview-measurement';

type MeasureType = 'line' | 'area' | null;

/**
 * Create a measurement button to open the measurement panel
 * @returns {JSX.Element} the created measurement button
 */
export default function Measurement(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/measurement');

  // Hooks
  const { t } = useTranslation<string>();
  const mapId = useGeoViewMapId();

  // States
  const [activeMeasurement, setActiveMeasurement] = useState<MeasureType>(null);
  const [drawInstance, setDrawInstance] = useState<Draw | null>(null);
  const [measureOverlays, setMeasureOverlays] = useState<Overlay[]>([]);

  /**
   * Creates a measurement tooltip overlay
   */
  const createMeasureTooltip = useCallback(
    (geometry: LineString | Polygon, coord: number[]): Overlay => {
      const displayLanguage = AppEventProcessor.getDisplayLanguage(mapId);
      const measureTooltipElement = document.createElement('div');
      measureTooltipElement.className = 'measurement-tooltip';
      measureTooltipElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      measureTooltipElement.style.color = 'white';
      measureTooltipElement.style.padding = '4px 8px';
      measureTooltipElement.style.borderRadius = '4px';
      measureTooltipElement.style.fontSize = '12px';
      measureTooltipElement.style.whiteSpace = 'nowrap';

      let output = '';
      if (geometry instanceof LineString) {
        const length = GeoUtilities.getLength(geometry);
        output = formatLength(length, displayLanguage);
      } else if (geometry instanceof Polygon) {
        const area = GeoUtilities.getArea(geometry);
        const length = GeoUtilities.getLength(geometry);
        output = `${formatLength(length, displayLanguage)}<br>${formatArea(area, displayLanguage)}`;
      }

      measureTooltipElement.innerHTML = output;

      const overlay = new Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center',
        stopEvent: false,
        insertFirst: false,
      });
      overlay.setPosition(coord);

      return overlay;
    },
    [mapId]
  );

  /**
   * Starts a measurement operation
   */
  const startMeasurement = useCallback(
    (type: MeasureType): void => {
      logger.logTraceUseCallback('MEASUREMENT, startMeasurement', type);

      if (!type) return;

      const viewer = MapEventProcessor.getMapViewer(mapId);

      // Stop existing measurement if any
      if (drawInstance) {
        drawInstance.stopInteraction();
      }

      // Create or get the geometry group for measurements
      if (!viewer.layer.geometry.hasGeometryGroup(MEASURE_GROUP_KEY)) {
        viewer.layer.geometry.createGeometryGroup(MEASURE_GROUP_KEY);
      }

      // Start drawing interaction
      const geomType = type === 'line' ? 'LineString' : 'Polygon';
      const draw = viewer.initDrawInteractions(MEASURE_GROUP_KEY, geomType, {
        strokeColor: '#ff0000',
        strokeWidth: 2,
        fillColor: 'rgba(255, 0, 0, 0.2)',
      });

      // Handle draw end
      draw.onDrawEnd((_sender: unknown, event: OLDrawEvent) => {
        const { feature } = event;
        const geometry = feature.getGeometry();

        if (geometry && (geometry instanceof LineString || geometry instanceof Polygon)) {
          // Apply final style with flashy magenta stroke and width 2
          const stroke = new Stroke({
            color: '#FF1493',
            width: 2,
          });

          const fill = new Fill({
            color: 'rgba(255, 20, 147, 0.2)',
          });

          feature.setStyle(
            new Style({
              stroke,
              fill: geometry instanceof Polygon ? fill : undefined,
            })
          );

          let tooltipCoord: number[];

          if (geometry instanceof LineString) {
            tooltipCoord = geometry.getLastCoordinate();
          } else {
            tooltipCoord = geometry.getInteriorPoint().getCoordinates();
            tooltipCoord.pop(); // Remove the third coordinate
          }

          const overlay = createMeasureTooltip(geometry, tooltipCoord);
          viewer.map.addOverlay(overlay);
          setMeasureOverlays((prev) => [...prev, overlay]);
        }
      });

      setDrawInstance(draw);
      setActiveMeasurement(type);

      // Set focus to map for WCAG keyboard interaction
      const mapElement = viewer.map.getTargetElement();
      if (mapElement) {
        mapElement.focus();
      }
    },
    [mapId, drawInstance, createMeasureTooltip]
  );

  /**
   * Stops the current measurement
   */
  const stopMeasurement = useCallback((): void => {
    logger.logTraceUseCallback('MEASUREMENT, stopMeasurement');

    if (drawInstance) {
      drawInstance.stopInteraction();
      setDrawInstance(null);
    }
    setActiveMeasurement(null);
  }, [drawInstance]);

  /**
   * Clears all measurements
   */
  const clearMeasurements = useCallback((): void => {
    logger.logTraceUseCallback('MEASUREMENT, clearMeasurements');

    const viewer = MapEventProcessor.getMapViewer(mapId);

    // Remove all overlays
    measureOverlays.forEach((overlay) => {
      overlay.getElement()?.remove();
      viewer.map.removeOverlay(overlay);
    });
    setMeasureOverlays([]);

    // Delete all geometries from the group
    if (viewer.layer.geometry.hasGeometryGroup(MEASURE_GROUP_KEY)) {
      viewer.layer.geometry.deleteGeometriesFromGroup(MEASURE_GROUP_KEY);
    }

    // Stop current drawing
    stopMeasurement();
  }, [mapId, measureOverlays, stopMeasurement]);

  /**
   * Handles measurement mode toggle
   */
  const handleMeasurementToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      logger.logTraceUseCallback('MEASUREMENT, handleMeasurementToggle', event.target.checked);

      if (event.target.checked) {
        // Default to line when enabling
        startMeasurement('line');
      } else {
        stopMeasurement();
      }
    },
    [startMeasurement, stopMeasurement]
  );

  /**
   * Handles measurement type selection
   */
  const handleTypeChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newType: MeasureType): void => {
      logger.logTraceUseCallback('MEASUREMENT, handleTypeChange', newType);

      if (newType !== null) {
        startMeasurement(newType);
      }
    },
    [startMeasurement]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMeasurements();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Render buttons in navbar panel
   */
  const renderButtons = (): ReactNode => {
    const isMeasurementActive = activeMeasurement !== null;

    return (
      <Stack spacing={2} sx={{ p: 2, minWidth: 200 }}>
        {/* On/Off Switch */}
        <Switch
          label={!isMeasurementActive ? t('general.enable')! : t('general.disable')!}
          checked={isMeasurementActive}
          onChange={handleMeasurementToggle}
          size="small"
        />
        {/* Line/Polygon Selection */}
        <Box>
          <ToggleButtonGroup
            value={activeMeasurement}
            exclusive
            onChange={handleTypeChange}
            aria-label={t('measurement.title')}
            fullWidth
            size="small"
            disabled={!isMeasurementActive}
            sx={{
              '& .MuiToggleButton-root.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            }}
          >
            <ToggleButton value="line" aria-label={t('measurement.line')}>
              <ShowChartIcon fontSize="small" />
              {t('measurement.line')}
            </ToggleButton>
            <ToggleButton value="area" aria-label={t('measurement.area')}>
              <HexagonOutlinedIcon fontSize="small" />
              {t('measurement.area')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Clear Button */}
        <IconButton
          id="button-clear-measurements"
          aria-label={t('measurement.clear')}
          onClick={clearMeasurements}
          disabled={measureOverlays.length === 0}
          size="small"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Stack>
    );
  };

  // Set up props for nav bar panel button
  const button: IconButtonPropsExtend = {
    'aria-label': t('mapnav.measurement'),
    children: createElement(StraightenIcon),
    tooltipPlacement: 'left',
  };

  const panel: TypePanelProps = {
    title: 'measurement.title',
    icon: createElement(StraightenIcon),
    content: renderButtons(),
    width: 'flex',
  };

  return <NavbarPanelButton buttonPanel={{ buttonPanelId: 'measurement', button, panel }} isActive={activeMeasurement !== null} />;
}
