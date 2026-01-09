import type { ReactNode } from 'react';
import { createElement, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { LineString, Polygon } from 'ol/geom';
import { Overlay } from 'ol';
import type { DrawEvent as OLDrawEvent } from 'ol/interaction/Draw';
import { Style, Stroke, Fill, Text } from 'ol/style';
import type { StyleFunction } from 'ol/style/Style';
import type { FeatureLike } from 'ol/Feature';
import type Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';

import { logger } from '@/core/utils/logger';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { IconButton } from '@/ui/icon-button/icon-button';
import { Box, Switch, ToggleButtonGroup, ToggleButton } from '@/ui';
import { ShowChartIcon, DeleteIcon, StraightenIcon } from '@/ui/icons';
import { HexagonOutlined as HexagonOutlinedIcon } from '@mui/icons-material';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import { GeoUtilities } from '@/geo/utils/utilities';
import { formatLength, formatArea } from '@/core/utils/utilities';
import type { Draw } from '@/geo/interaction/draw';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';

const MEASURE_GROUP_KEY = 'geoview-measurement';

// Style constants
const STROKE_COLORS = {
  drawing: '#ff0000',
  completed: '#FF1493',
} as const;

const FILL_COLORS = {
  drawing: 'rgba(255, 0, 0, 0.2)',
  completed: 'rgba(255, 20, 147, 0.2)',
} as const;

const STROKE_WIDTH = 2;

const LABEL_STYLE_CONFIG = {
  font: '12px sans-serif',
  textColor: '#fff',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  padding: [2, 4, 2, 4] as [number, number, number, number],
} as const;

// Reusable Fill objects for labels
const LABEL_TEXT_FILL = new Fill({ color: LABEL_STYLE_CONFIG.textColor });
const LABEL_BACKGROUND_FILL = new Fill({ color: LABEL_STYLE_CONFIG.backgroundColor });

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '2px 4px',
  borderRadius: '4px',
  fontSize: '12px',
  whiteSpace: 'nowrap',
} as const;

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

  // Stores
  const displayLanguage = useAppDisplayLanguage();

  // States
  const [activeMeasurement, setActiveMeasurement] = useState<MeasureType>(null);
  const [drawInstance, setDrawInstance] = useState<Draw | null>(null);
  const [measureOverlays, setMeasureOverlays] = useState<Overlay[]>([]);
  const [showSegmentLabels, setShowSegmentLabels] = useState<boolean>(true);
  const [measurementFeatures, setMeasurementFeatures] = useState<Feature<Geometry>[]>([]);

  /**
   * Creates a style function that shows segment lengths
   */
  const createSegmentStyle = useCallback(
    (isDrawing: boolean = false, includeSegmentLabels: boolean = true): StyleFunction => {
      // Log
      logger.logTraceUseCallback('MEASUREMENT, createSegmentStyle');

      return (feature: FeatureLike) => {
        const styles: Style[] = [];
        const geometry = feature.getGeometry();

        if (!geometry) return styles;

        // Base stroke style
        const stroke = new Stroke({
          color: isDrawing ? STROKE_COLORS.drawing : STROKE_COLORS.completed,
          width: STROKE_WIDTH,
        });

        // Add base geometry style
        if (geometry instanceof Polygon) {
          const fill = new Fill({
            color: isDrawing ? FILL_COLORS.drawing : FILL_COLORS.completed,
          });
          styles.push(new Style({ stroke, fill }));
        } else {
          styles.push(new Style({ stroke }));
        }

        // Add segment labels
        let coordinates: number[][];
        if (geometry instanceof LineString) {
          coordinates = geometry.getCoordinates();
        } else if (geometry instanceof Polygon) {
          coordinates = geometry.getCoordinates()[0];
        } else {
          return styles;
        }

        // Skip segment labels if disabled
        if (!includeSegmentLabels) {
          return styles;
        }

        // Create labels for each segment with smart positioning
        for (let i = 0; i < coordinates.length - 1; i++) {
          const segment = new LineString([coordinates[i], coordinates[i + 1]]);
          const segmentLength = GeoUtilities.getLength(segment);
          const segmentLabel = formatLength(segmentLength, displayLanguage);

          // Get midpoint of segment for label placement
          const midpoint = [(coordinates[i][0] + coordinates[i + 1][0]) / 2, (coordinates[i][1] + coordinates[i + 1][1]) / 2];

          // Center labels on segment for both lines and polygons
          const offsetX = 0;
          const offsetY = 0;
          const textBaseline: 'top' | 'middle' | 'bottom' = 'middle';

          styles.push(
            new Style({
              geometry: new LineString([midpoint]),
              text: new Text({
                text: segmentLabel,
                font: LABEL_STYLE_CONFIG.font,
                fill: LABEL_TEXT_FILL,
                backgroundFill: LABEL_BACKGROUND_FILL,
                padding: LABEL_STYLE_CONFIG.padding,
                offsetY,
                offsetX,
                textAlign: 'center',
                textBaseline,
                overflow: true,
              }),
            })
          );
        }

        return styles;
      };
    },
    [displayLanguage]
  );

  /**
   * Creates a measurement tooltip overlay
   */
  const createMeasureTooltip = useCallback(
    (geometry: LineString | Polygon, coord: number[]): Overlay => {
      // Log
      logger.logTraceUseCallback('MEASUREMENT, createMeasureTooltip', geometry);

      const measureTooltipElement = document.createElement('div');
      measureTooltipElement.className = 'measurement-tooltip';
      Object.assign(measureTooltipElement.style, TOOLTIP_STYLE);

      let output = '';
      if (geometry instanceof LineString) {
        const length = GeoUtilities.getLength(geometry);
        output = `Total: ${formatLength(length, displayLanguage)}`;
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
    [displayLanguage]
  );

  /**
   * Starts a measurement operation
   */
  const startMeasurement = useCallback(
    (type: MeasureType): void => {
      // Log
      logger.logTraceUseCallback('MEASUREMENT, startMeasurement', type);

      // Early return if no type
      if (!type) return;

      // Stop existing measurement if any
      if (drawInstance) {
        drawInstance.stopInteraction();
      }

      // Create or get the geometry group for measurements
      const viewer = MapEventProcessor.getMapViewer(mapId);
      if (!viewer.layer.geometry.hasGeometryGroup(MEASURE_GROUP_KEY)) {
        viewer.layer.geometry.createGeometryGroup(MEASURE_GROUP_KEY);
      }

      // Start drawing interaction
      const geomType = type === 'line' ? 'LineString' : 'Polygon';
      const draw = viewer.initDrawInteractions(MEASURE_GROUP_KEY, geomType, {
        strokeColor: STROKE_COLORS.drawing,
        strokeWidth: STROKE_WIDTH,
        fillColor: FILL_COLORS.drawing,
      });

      // Handle draw end
      draw.onDrawEnd((_sender: unknown, event: OLDrawEvent) => {
        const { feature } = event;
        const geometry = feature.getGeometry();

        if (geometry && (geometry instanceof LineString || geometry instanceof Polygon)) {
          // Apply final style with segment labels
          feature.setStyle(createSegmentStyle(false, showSegmentLabels));

          // Store feature reference
          setMeasurementFeatures((prev) => [...prev, feature]);

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
    [mapId, drawInstance, createMeasureTooltip, createSegmentStyle, showSegmentLabels]
  );

  /**
   * Stops the current measurement
   */
  const stopMeasurement = useCallback((): void => {
    // Log
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
    // Log
    logger.logTraceUseCallback('MEASUREMENT, clearMeasurements');

    const viewer = MapEventProcessor.getMapViewer(mapId);

    // Remove all overlays
    measureOverlays.forEach((overlay) => {
      overlay.getElement()?.remove();
      viewer.map.removeOverlay(overlay);
    });
    setMeasureOverlays([]);

    // Clear stored feature references
    setMeasurementFeatures([]);

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
      // Log
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
   * Handles segment labels visibility toggle
   */
  const handleSegmentLabelsToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      // Log
      logger.logTraceUseCallback('MEASUREMENT, handleSegmentLabelsToggle', event.target.checked);

      // Set the segments hook state
      setShowSegmentLabels(event.target.checked);

      // Update all stored measurement features
      measurementFeatures.forEach((feature) => {
        feature.setStyle(createSegmentStyle(false, event.target.checked));
      });

      // Force map to re-render
      const viewer = MapEventProcessor.getMapViewer(mapId);
      viewer.map.render();
    },
    [mapId, createSegmentStyle, measurementFeatures]
  );

  /**
   * Handles measurement type selection
   */
  const handleTypeChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newType: MeasureType): void => {
      // Log
      logger.logTraceUseCallback('MEASUREMENT, handleTypeChange', newType);

      if (newType !== null) {
        startMeasurement(newType);
      }
    },
    [startMeasurement]
  );

  // Cleanup on unmount
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MEASUREMENT, Clean up on mount');

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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* On/Off Switch */}
        <Switch
          label={!isMeasurementActive ? t('general.enable')! : t('general.disable')!}
          checked={isMeasurementActive}
          onChange={handleMeasurementToggle}
          size="small"
        />
        {/* Segment Labels Toggle */}
        <Switch
          label={t('measurement.segmentLabels')!}
          checked={showSegmentLabels}
          onChange={handleSegmentLabelsToggle}
          size="small"
          disabled={!isMeasurementActive}
        />
        {/* Line/Polygon Selection */}
        <Box>
          <ToggleButtonGroup
            value={activeMeasurement}
            exclusive
            onChange={handleTypeChange}
            aria-label={t('measurement.title')!}
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
            <ToggleButton value="line" aria-label={t('measurement.line')!}>
              <ShowChartIcon fontSize="small" />
              {t('measurement.line')}
            </ToggleButton>
            <ToggleButton value="area" aria-label={t('measurement.area')!}>
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
      </Box>
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
