import type { ReactNode } from 'react';
import { createElement, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { LineString, Polygon } from 'ol/geom';
import type { DrawEvent as OLDrawEvent } from 'ol/interaction/Draw';
import type { EventsKey } from 'ol/events';
import { unByKey } from 'ol/Observable';
import { Style, Stroke, Fill, Text } from 'ol/style';
import type { StyleFunction } from 'ol/style/Style';
import type { FeatureLike } from 'ol/Feature';
import type Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';

import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { SxStyles } from '@/ui/style/types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { IconButton } from '@/ui/icon-button/icon-button';
import { Box, ToggleButtonGroup, ToggleButton } from '@/ui/layout';
import { Switch } from '@/ui/switch/switch';
import { Typography } from '@/ui/typography/typography';
import { ShowChartIcon, DeleteIcon, StraightenIcon, HexagonOutlinedIcon } from '@/ui/icons';
import { visuallyHidden } from '@/ui/style/default';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { createMeasurementLabelStyles } from '@/core/components/nav-bar/buttons/measurement-label-style';
import { formatLength, formatArea } from '@/core/utils/utilities';
import { DomHelper } from '@/core/utils/dom-helper';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useStoreAppDisplayLanguage } from '@/core/stores/states/app-state';
import { useStoreMapCurrentProjectionEPSG } from '@/core/stores/states/map-state';
import { useShellContainer } from '@/core/containers/shell-container-context';
import { GeoUtilities } from '@/geo/utils/utilities';
import { useMapController, useUIController } from '@/core/controllers/use-controllers';
import { MEASURE_GROUP_KEY } from '@/core/utils/constant';

/** Stroke color for measurement lines. */
const STROKE_COLORS = '#ff0000';

/** Fill color for measurement areas. */
const FILL_COLORS = 'rgba(255, 0, 0, 0.2)';

/** Stroke width for measurement lines. */
const STROKE_WIDTH = 2;

/** Base geometry style for measurement lines. */
const LINE_BASE_STYLE = new Style({ stroke: new Stroke({ color: STROKE_COLORS, width: STROKE_WIDTH }) });

/** Base geometry style for measurement areas. */
const POLYGON_BASE_STYLE = new Style({
  stroke: new Stroke({ color: STROKE_COLORS, width: STROKE_WIDTH }),
  fill: new Fill({ color: FILL_COLORS }),
});

/** Minimum number of placed vertices before a polygon sketch shows its live total. */
const POLYGON_SKETCH_MIN_VERTICES = 3;

/** Base style values for measurement segment labels. */
const SEGMENT_LABEL_BASE_STYLE = {
  textColor: '#fff',
  // eslint-disable-next-line no-restricted-syntax -- OpenLayers/canvas measurement text, not viewer UI.
  fontSize: '13px',
  // eslint-disable-next-line no-restricted-syntax -- OpenLayers/canvas measurement text, not viewer UI.
  fontWeight: 'bold',
} as const;

/** OpenLayers canvas text style configuration for segment labels. */
const LABEL_STYLE_CONFIG = {
  font: `${SEGMENT_LABEL_BASE_STYLE.fontWeight} ${SEGMENT_LABEL_BASE_STYLE.fontSize} sans-serif`,
  textColor: SEGMENT_LABEL_BASE_STYLE.textColor,
  haloColor: 'rgba(0, 0, 0, 0.7)',
  haloWidth: 9,
} as const;

/** Reusable fill for label text. */
const LABEL_TEXT_FILL = new Fill({ color: LABEL_STYLE_CONFIG.textColor });
/** Reusable stroke for label halo. */
const LABEL_HALO_STROKE = new Stroke({ color: LABEL_STYLE_CONFIG.haloColor, width: LABEL_STYLE_CONFIG.haloWidth });

/** The type of measurement operation. */
type MeasureType = 'line' | 'area' | null;

/**
 * Creates the style function for an in-progress measurement sketch, which shows only the live total.
 *
 * A polygon sketch ring is [vertices..., cursor, first vertex], so its total waits for the minimum placed vertices.
 *
 * @param geometry - The sketch geometry
 * @param totalStyle - The style function that renders the geometry and its total
 * @returns The sketch style function
 */
function createSketchStyle(geometry: LineString | Polygon, totalStyle: StyleFunction): StyleFunction {
  if (geometry instanceof LineString) return totalStyle;

  return (feature: FeatureLike, resolution: number): ReturnType<StyleFunction> =>
    (geometry.getCoordinates()[0]?.length ?? 0) - 2 >= POLYGON_SKETCH_MIN_VERTICES ? totalStyle(feature, resolution) : POLYGON_BASE_STYLE;
}

/**
 * Creates a measurement button to open the measurement panel.
 *
 * @returns The measurement button
 */
export default function Measurement(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/measurement');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  // Stores
  const mapId = useStoreGeoViewMapId();
  const displayLanguage = useStoreAppDisplayLanguage();
  const mapProjection = useStoreMapCurrentProjectionEPSG();
  const shellContainer = useShellContainer();
  const mapController = useMapController();
  const uiController = useUIController();

  // States
  const [activeMeasurement, setActiveMeasurement] = useState<MeasureType>(null);
  const [showSegmentLabels, setShowSegmentLabels] = useState<boolean>(true);
  const [measurementFeatures, setMeasurementFeatures] = useState<Feature<Geometry>[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');

  /** Number of committed points in the current measurement sketch. */
  const sketchVertexCount = useRef(0);

  /** Listener for point-count changes in the active sketch. */
  const sketchGeometryChangeKey = useRef<EventsKey | undefined>(undefined);

  /** Current segment-label visibility, read when a measurement completes. */
  const showSegmentLabelsRef = useRef<boolean>(showSegmentLabels);

  /**
   * Builds custom sx classes for the measurement component.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    // Log
    logger.logTraceUseMemo('MEASUREMENT - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // #region Handlers

  /**
   * Releases the active sketch listener and resets its point count.
   */
  const clearSketchListener = useCallback((): void => {
    if (sketchGeometryChangeKey.current) unByKey(sketchGeometryChangeKey.current);
    sketchGeometryChangeKey.current = undefined;
    sketchVertexCount.current = 0;
  }, []);

  /**
   * Creates a style function for measurement geometry, totals and optional segment lengths.
   *
   * @param includeSegmentLabels - Optional whether to include segment length labels on the geometry
   * @returns OpenLayers style function that applies measurement styles
   */
  const createSegmentStyle = useCallback(
    (includeSegmentLabels = true): StyleFunction => {
      return (feature: FeatureLike): Style[] => {
        const geometry = feature.getGeometry();

        if (!geometry) return [];

        // Add base geometry style
        const styles: Style[] = [geometry instanceof Polygon ? POLYGON_BASE_STYLE : LINE_BASE_STYLE];

        // Add segment labels
        let coordinates: number[][];
        if (geometry instanceof LineString) {
          coordinates = geometry.getCoordinates();
        } else if (geometry instanceof Polygon) {
          coordinates = geometry.getCoordinates()[0] ?? [];
        } else {
          return styles;
        }

        // Create segment labels using canvas Text
        if (includeSegmentLabels) {
          for (let i = 0; i < coordinates.length - 1; i++) {
            const segment = new LineString([coordinates[i], coordinates[i + 1]]);
            const segmentLength = GeoUtilities.getLength(segment, mapProjection);
            const segmentLabel = formatLength(segmentLength, displayLanguage);

            // Get midpoint of segment
            const midpoint = [(coordinates[i][0] + coordinates[i + 1][0]) / 2, (coordinates[i][1] + coordinates[i + 1][1]) / 2];

            // Calculate rotation angle
            const dx = coordinates[i + 1][0] - coordinates[i][0];
            const dy = coordinates[i + 1][1] - coordinates[i][1];
            let angleRadians = -Math.atan2(dy, dx);

            // Normalize angle to keep text readable
            if (angleRadians > Math.PI / 2) {
              angleRadians -= Math.PI;
            } else if (angleRadians < -Math.PI / 2) {
              angleRadians += Math.PI;
            }

            styles.push(
              new Style({
                geometry: new LineString([midpoint]),
                text: new Text({
                  text: segmentLabel,
                  font: LABEL_STYLE_CONFIG.font,
                  fill: LABEL_TEXT_FILL,
                  stroke: LABEL_HALO_STROKE,
                  rotation: angleRadians,
                  rotateWithView: true,
                  textAlign: 'center',
                  textBaseline: 'middle',
                  overflow: true,
                }),
              })
            );
          }
        }

        // Keep totals canvas-based so the text, rounded backing and pointer appear in map exports.
        let labelCoord: number[];
        let totalLabel = '';
        // Line total sits above the end point: half the 29px label + 6px pointer + a 6px gap keeps the vertex and cursor visible
        let labelOffsetY = -26;

        if (geometry instanceof LineString) {
          labelCoord = coordinates[coordinates.length - 1];
          const length = GeoUtilities.getLength(geometry, mapProjection);
          totalLabel = formatLength(length, displayLanguage);
        } else if (geometry instanceof Polygon) {
          // Position at an interior point so the total stays inside the polygon.
          labelCoord = geometry.getInteriorPoint().getCoordinates();
          labelCoord.pop(); // Remove the third coordinate
          labelOffsetY = 0; // No offset for polygon - keep label inside
          const area = GeoUtilities.getArea(geometry, mapProjection);
          const length = GeoUtilities.getLength(geometry, mapProjection);
          // Convert HTML <sup> tags to Unicode superscript for canvas rendering
          const areaText = formatArea(area, displayLanguage).replace(/<sup>2<\/sup>/g, '²');
          totalLabel = `${formatLength(length, displayLanguage)}\n${areaText}`;
        } else {
          return styles;
        }

        // A collinear polygon sketch has no interior point, skip its total until the polygon has an area
        if (!labelCoord.every(Number.isFinite)) return styles;

        styles.push(...createMeasurementLabelStyles(feature, labelCoord, totalLabel, labelOffsetY));

        return styles;
      };
    },
    [displayLanguage, mapProjection]
  );

  /**
   * Starts a measurement operation.
   *
   * @param type - The type of measurement to start
   */
  const startMeasurement = useCallback(
    (type: MeasureType): void => {
      // Early return if no type
      if (!type) return;

      mapController.stopActiveMeasurement();

      // Create or get the geometry group for measurements
      mapController.createGeometryGroup(MEASURE_GROUP_KEY);

      // Start drawing interaction
      const geomType = type === 'line' ? 'LineString' : 'Polygon';
      const draw = mapController.initDrawInteractions(MEASURE_GROUP_KEY, geomType, {
        strokeColor: STROKE_COLORS,
        strokeWidth: STROKE_WIDTH,
        fillColor: FILL_COLORS,
      });

      mapController.setActiveMeasurementDraw(draw);

      /** Updates the on-map hint for this measurement type. */
      const setHint = (started: boolean): void => uiController.setDrawingHint({ tool: 'measurement', geometry: geomType, started });
      setHint(false);

      // Announce added vertices without repeating announcements for pointer movement.
      draw.onDrawStart((_sender: unknown, event: OLDrawEvent): void => {
        clearSketchListener();
        const geometry = event.feature.getGeometry();
        if (!(geometry instanceof LineString || geometry instanceof Polygon)) return;

        // Show only the live total while drawing, segment labels would overlap it near the cursor
        event.feature.setStyle(createSketchStyle(geometry, createSegmentStyle(false)));

        setHint(true);

        sketchVertexCount.current = 1;
        setStatusMessage(t('measurement.status.vertexAdded', { count: sketchVertexCount.current }));

        sketchGeometryChangeKey.current = geometry.on('change', (): void => {
          // Exclude the cursor coordinate and, for polygons, the closing coordinate.
          const vertexCount = Math.max(
            1,
            geometry instanceof LineString ? geometry.getCoordinates().length - 1 : (geometry.getCoordinates()[0]?.length ?? 0) - 2
          );
          const previousVertexCount = sketchVertexCount.current;
          sketchVertexCount.current = vertexCount;
          if (vertexCount > previousVertexCount) {
            setStatusMessage(t('measurement.status.vertexAdded', { count: vertexCount }));
          }
        });
      });

      // Handle draw end
      draw.onDrawEnd((_sender: unknown, event: OLDrawEvent): void => {
        clearSketchListener();
        setHint(false);
        const { feature } = event;
        const geometry = feature.getGeometry();

        if (geometry && (geometry instanceof LineString || geometry instanceof Polygon)) {
          // Apply final style with segment labels (canvas-based)
          feature.setStyle(createSegmentStyle(showSegmentLabelsRef.current));

          // Store feature reference
          setMeasurementFeatures((prev) => [...prev, feature]);

          // Announce measurement completion with actual values
          if (geometry instanceof LineString) {
            const length = GeoUtilities.getLength(geometry, mapProjection);
            const distance = formatLength(length, displayLanguage);
            setStatusMessage(t('measurement.status.completedLine', { distance }));
          } else if (geometry instanceof Polygon) {
            const perimeter = GeoUtilities.getLength(geometry, mapProjection);
            const area = GeoUtilities.getArea(geometry, mapProjection);
            const perimeterFormatted = formatLength(perimeter, displayLanguage);
            const areaFormatted = formatArea(area, displayLanguage);
            setStatusMessage(
              t('measurement.status.completedArea', {
                perimeter: perimeterFormatted,
                area: areaFormatted,
              })
            );
          }
        }
      });

      draw.onDrawAbort((): void => {
        clearSketchListener();
        setHint(false);
        setStatusMessage(t('measurement.status.cancelled'));
      });

      setActiveMeasurement(type);

      // Announce measurement mode started
      const measurementType = type === 'line' ? t('measurement.line') : t('measurement.area');
      setStatusMessage(t('measurement.status.started', { type: measurementType }));
    },
    [clearSketchListener, createSegmentStyle, mapController, uiController, displayLanguage, mapProjection, t]
  );

  /**
   * Reapplies measurement styles when the projection or language changes, so existing labels use the current values.
   */
  useEffect(() => {
    logger.logTraceUseEffect('MEASUREMENT - refresh measurement styles', mapProjection, displayLanguage);
    measurementFeatures.forEach((feature) => feature.setStyle(createSegmentStyle(showSegmentLabels)));
    // Only refresh when the style inputs change, feature additions and label toggles already apply their own style
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSegmentStyle]);

  /**
   * Synchronizes the measurement controls when measurement stops, including when drawer drawing or editing takes over.
   */
  useEffect(() => {
    logger.logTraceUseEffect('MEASUREMENT - measurement stopped subscription');
    const handler = mapController.onMeasurementStopped((_sender, _event): void => {
      clearSketchListener();
      setActiveMeasurement(null);
      setStatusMessage(t('measurement.status.stopped'));
    });
    return (): void => mapController.offMeasurementStopped(handler);
  }, [clearSketchListener, mapController, t]);

  /**
   * Registers measurement keyboard shortcuts: undo/redo, and Escape returning focus to the Measure button.
   */
  useEffect(() => {
    logger.logTraceUseEffect('MEASUREMENT - keyboard shortcuts', activeMeasurement);

    if (!activeMeasurement) return undefined;

    const handleShortcut = (event: KeyboardEvent): void => {
      if (
        !DomHelper.getActiveElement() ||
        !DomHelper.getActiveElementWithinMap(mapId) ||
        DomHelper.isActiveElementInputOrContentEditableElement() ||
        DomHelper.hasOpenModal(mapId)
      )
        return;

      // Capture phase: this sees the sketch before the Draw interaction cancels it, so one Escape never does both.
      if (event.key === 'Escape') {
        if (sketchVertexCount.current === 0) uiController.focusMeasurementButton();
        return;
      }

      const isUndoShortcut =
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) ||
        (event.key === 'Backspace' && !event.ctrlKey && !event.metaKey && !event.altKey);
      const isRedoShortcut =
        (event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey));
      if (!isUndoShortcut && !isRedoShortcut) return;

      event.preventDefault();
      event.stopPropagation();
      if (isRedoShortcut) {
        setStatusMessage(t('measurement.status.redoUnavailable'));
      } else {
        setStatusMessage(
          mapController.undoActiveMeasurement()
            ? t('measurement.status.vertexUndone', { count: sketchVertexCount.current })
            : t('measurement.status.nothingToUndo')
        );
      }
    };

    document.addEventListener('keydown', handleShortcut, true);
    return (): void => {
      document.removeEventListener('keydown', handleShortcut, true);
    };
  }, [activeMeasurement, mapController, uiController, mapId, shellContainer, t]);

  /**
   * Clears all measurements.
   */
  const clearMeasurements = useCallback((): void => {
    const featureCount = measurementFeatures.length;

    // Clear stored feature references
    setMeasurementFeatures([]);

    // Delete all geometries from the group
    mapController.deleteGeometriesFromGroup(MEASURE_GROUP_KEY);

    // Stop current drawing
    mapController.stopActiveMeasurement();

    // Announce cleared with count
    if (featureCount > 0) {
      setStatusMessage(t('measurement.status.cleared', { count: featureCount }));
    }
  }, [mapController, measurementFeatures.length, t]);

  /**
   * Handles the measurement enable/disable toggle switch.
   */
  const handleMeasurementToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      if (event.target.checked) {
        // Default to line when enabling
        startMeasurement('line');
      } else {
        mapController.stopActiveMeasurement();
      }
    },
    [startMeasurement, mapController]
  );

  /**
   * Handles segment labels visibility toggle.
   */
  const handleSegmentLabelsToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const shouldShow = event.target.checked;

      // Set the segments hook state
      setShowSegmentLabels(shouldShow);
      showSegmentLabelsRef.current = shouldShow;

      // Update all stored measurement features with new style
      setMeasurementFeatures((currentFeatures) => {
        currentFeatures.forEach((feature) => {
          feature.setStyle(createSegmentStyle(shouldShow));
        });
        return currentFeatures;
      });

      // Force map to re-render
      mapController.forceMapToRender();
    },
    [createSegmentStyle, mapController]
  );

  /**
   * Handles measurement type selection.
   */
  const handleTypeChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newType: MeasureType): void => {
      if (newType !== null) {
        startMeasurement(newType);
      }
    },
    [startMeasurement]
  );

  // #endregion Handlers

  /**
   * Cleans up measurement resources on unmount.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MEASUREMENT, Clean up on mount');

    return () => {
      clearSketchListener();
      // GV IMPORTANT: This method may be called during React cleanup effects after a map has been deleted.
      // GV Wrap in try-catch to silently handle this expected race condition without throwing errors.
      try {
        clearMeasurements();
      } catch {
        // GV Silently handle MapViewerNotFoundError - map was already deleted during cleanup
        logger.logDebug(`deleteGeometriesFromGroup: Map not found (expected during cleanup)`);
      }
    };
    // We use the empty array to avoid the rerender for clear measurement trigger on enable toggle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Renders the measurement control panel content.
   *
   * @returns The measurement panel content
   */
  const renderButtons = (): ReactNode => {
    const isMeasurementActive = activeMeasurement !== null;

    return (
      <Box sx={memoSxClasses.measurementPanel}>
        {/* Enable/Disable Toggle */}
        <Switch
          label={!isMeasurementActive ? t('general.enable') : t('general.disable')}
          checked={isMeasurementActive}
          onChange={handleMeasurementToggle}
          size="small"
        />

        {/* Segment Labels Toggle */}
        <Switch
          label={t('measurement.segmentLabels')}
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
            aria-label={t('measurement.title')}
            fullWidth
            size="small"
            disabled={!isMeasurementActive}
            sx={memoSxClasses.measurementToggleGroup}
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
          id={DomHelper.buildButtonClearMeasurementsId(mapId)}
          aria-label={t('measurement.clear')}
          onClick={clearMeasurements}
          className="buttonOutline"
          disabled={measurementFeatures.length === 0}
          size="small"
          sx={memoSxClasses.measurementClearButton}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  // Set up props for nav bar panel button
  const button: IconButtonPropsExtend = {
    id: DomHelper.buildButtonMeasurementId(mapId),
    'aria-label': 'mapnav.measurement',
    children: createElement(StraightenIcon),
    tooltipPlacement: 'left',
  };

  const panel: TypePanelProps = {
    title: 'measurement.title',
    icon: createElement(StraightenIcon),
    content: renderButtons(),
  };

  return (
    <NavbarPanelButton
      buttonPanel={{ buttonPanelId: 'measurement', button, panel }}
      isActive={activeMeasurement !== null}
      keepPanelMounted
      liveRegionContent={
        /* WCAG - Screen reader status announcements */
        <Typography role="status" sx={visuallyHidden}>
          {statusMessage}
        </Typography>
      }
    />
  );
}
