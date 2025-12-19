import type { ReactNode } from 'react';
import { createElement, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { LineString, Polygon } from 'ol/geom';
import { Overlay } from 'ol';
import type { DrawEvent as OLDrawEvent } from 'ol/interaction/Draw';

import { logger } from '@/core/utils/logger';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { IconButton } from '@/ui/icon-button/icon-button';
import { List, ListItem } from '@/ui/list';
import { StraightenIcon, TableChartOutlinedIcon, DeleteIcon } from '@/ui/icons';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { Draw } from '@/geo/interaction/draw';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

const MEASURE_GROUP_KEY = 'geoview-measurement';

type MeasureType = 'line' | 'area' | null;

/**
 * Formats a numeric value according to the display language
 * @param {number} value - The value to format
 * @param {string} displayLanguage - The display language ('en' or 'fr')
 * @returns {string} The formatted value
 */
function formatMeasurementValue(value: number, displayLanguage: string): string {
  return displayLanguage === 'fr'
    ? value.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formats a length measurement with appropriate units
 * @param {number} length - The length in meters
 * @param {string} displayLanguage - The display language
 * @returns {string} The formatted length string
 */
function formatLength(length: number, displayLanguage: string): string {
  if (length > 100) {
    const value = Math.round((length / 1000) * 100) / 100;
    return `${formatMeasurementValue(value, displayLanguage)} km`;
  }
  const value = Math.round(length * 100) / 100;
  return `${formatMeasurementValue(value, displayLanguage)} m`;
}

/**
 * Formats an area measurement with appropriate units
 * @param {number} area - The area in square meters
 * @param {string} displayLanguage - The display language
 * @returns {string} The formatted area string
 */
function formatArea(area: number, displayLanguage: string): string {
  if (area > 10000) {
    const value = Math.round((area / 1000000) * 100) / 100;
    return `${formatMeasurementValue(value, displayLanguage)} km<sup>2</sup>`;
  }
  const value = Math.round(area * 100) / 100;
  return `${formatMeasurementValue(value, displayLanguage)} m<sup>2</sup>`;
}

/**
 * Create a measurement button to open the measurement panel
 * @returns {JSX.Element} the created measurement button
 */
export default function Measurement(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/measurement');

  const { t } = useTranslation<string>();
  const mapId = useGeoViewMapId();

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
   * Handles measurement selection
   */
  const handleMeasurementChoice = useCallback(
    (type: MeasureType): void => {
      logger.logTraceUseCallback('MEASUREMENT, handleMeasurementChoice', type);

      if (activeMeasurement === type) {
        // Toggle off if clicking the same type
        stopMeasurement();
      } else {
        // Start new measurement
        startMeasurement(type);
      }
    },
    [activeMeasurement, startMeasurement, stopMeasurement]
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
    return (
      <List key="measurementButtons">
        <ListItem>
          <IconButton
            id="button-measure-line"
            aria-label={t('measurement.line')}
            tooltipPlacement="left"
            size="small"
            onClick={() => handleMeasurementChoice('line')}
            disabled={activeMeasurement === 'line'}
          >
            <StraightenIcon />
            {t('measurement.line')}
          </IconButton>
        </ListItem>
        <ListItem>
          <IconButton
            id="button-measure-area"
            aria-label={t('measurement.area')}
            tooltipPlacement="left"
            size="small"
            onClick={() => handleMeasurementChoice('area')}
            disabled={activeMeasurement === 'area'}
          >
            <TableChartOutlinedIcon />
            {t('measurement.area')}
          </IconButton>
        </ListItem>
        <ListItem>
          <IconButton
            id="button-clear-measurements"
            aria-label={t('measurement.clear')}
            tooltipPlacement="left"
            size="small"
            onClick={clearMeasurements}
            disabled={measureOverlays.length === 0}
          >
            <DeleteIcon />
            {t('measurement.clear')}
          </IconButton>
        </ListItem>
      </List>
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

  return <NavbarPanelButton buttonPanel={{ buttonPanelId: 'measurement', button, panel }} />;
}
