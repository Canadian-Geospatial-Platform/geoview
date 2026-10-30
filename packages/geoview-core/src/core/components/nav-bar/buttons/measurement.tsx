import type { ReactNode } from 'react';
import { createElement, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { LineString, Polygon, Point } from 'ol/geom';
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
import { formatLength, formatArea, isEditableElement } from '@/core/utils/utilities';
import { buildGVElementId, GV_DOM_SUFFIX } from '@/core/utils/dom-helper';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { getStoreAppGeoviewHTMLElement } from '@/core/stores/states/app-state';
import { useStoreAppDisplayLanguage } from '@/core/stores/states/app-state';
import { GeoUtilities } from '@/geo/utils/utilities';
import { useMapController, useUIController } from '@/core/controllers/use-controllers';

/** The geometry group key for measurement features. */
const MEASURE_GROUP_KEY = 'geoview-measurement';

/** Stroke color for measurement lines. */
const STROKE_COLORS = '#ff0000';

/** Fill color for measurement areas. */
const FILL_COLORS = 'rgba(255, 0, 0, 0.2)';

/** Stroke width for measurement lines. */
const STROKE_WIDTH = 2;

/** Base style values for measurement tooltips and labels. */
const TOOLTIP_BASE_STYLE = {
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  textColor: '#fff',
  fontSize: '13px',
  fontWeight: 'bold',
  padding: { top: 4, right: 8, bottom: 4, left: 8 },
} as const;

/** OpenLayers canvas text style configuration for segment labels. */
const LABEL_STYLE_CONFIG = {
  font: `${TOOLTIP_BASE_STYLE.fontWeight} ${TOOLTIP_BASE_STYLE.fontSize} sans-serif`,
  textColor: TOOLTIP_BASE_STYLE.textColor,
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
   * Creates a style function that shows segment lengths.
   *
   * @param includeSegmentLabels - Optional whether to include segment length labels on the geometry
   * @returns OpenLayers style function that applies measurement styles
   */
  const createSegmentStyle = useCallback(
    (includeSegmentLabels = true): StyleFunction => {
      return (feature: FeatureLike) => {
        const styles: Style[] = [];
        const geometry = feature.getGeometry();

        if (!geometry) return styles;

        // Base stroke style
        const stroke = new Stroke({
          color: STROKE_COLORS,
          width: STROKE_WIDTH,
        });

        // Add base geometry style
        if (geometry instanceof Polygon) {
          const fill = new Fill({
            color: FILL_COLORS,
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

        // Create segment labels using canvas Text
        if (includeSegmentLabels) {
          for (let i = 0; i < coordinates.length - 1; i++) {
            const segment = new LineString([coordinates[i], coordinates[i + 1]]);
            const segmentLength = GeoUtilities.getLength(segment);
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

        // Add total measurement label for map exports (canvas-based) so we can add to export
        // Overlays are not exportable
        let labelCoord: number[];
        let totalLabel = '';
        let labelOffsetY = -15; // Default offset for line (above end point)

        if (geometry instanceof LineString) {
          labelCoord = coordinates[coordinates.length - 1];
          const length = GeoUtilities.getLength(geometry);
          totalLabel = formatLength(length, displayLanguage);
        } else if (geometry instanceof Polygon) {
          // Position at polygon centroid
          labelCoord = geometry.getInteriorPoint().getCoordinates();
          labelCoord.pop(); // Remove the third coordinate
          labelOffsetY = 0; // No offset for polygon - keep label inside
          const area = GeoUtilities.getArea(geometry);
          const length = GeoUtilities.getLength(geometry);
          // Convert HTML <sup> tags to Unicode superscript for canvas rendering
          const areaText = formatArea(area, displayLanguage).replace(/<sup>2<\/sup>/g, '²');
          totalLabel = `${formatLength(length, displayLanguage)}\n${areaText}`;
        } else {
          return styles;
        }

        styles.push(
          new Style({
            geometry: new Point(labelCoord),
            text: new Text({
              text: totalLabel,
              font: `bold 14px sans-serif`, // Slightly larger for prominence
              fill: new Fill({ color: TOOLTIP_BASE_STYLE.textColor }),
              backgroundFill: new Fill({ color: TOOLTIP_BASE_STYLE.backgroundColor }),
              padding: [
                TOOLTIP_BASE_STYLE.padding.top,
                TOOLTIP_BASE_STYLE.padding.right,
                TOOLTIP_BASE_STYLE.padding.bottom,
                TOOLTIP_BASE_STYLE.padding.left,
              ],
              offsetY: labelOffsetY,
              textAlign: 'center',
              textBaseline: 'middle',
              overflow: true,
            }),
          })
        );

        return styles;
      };
    },
    [displayLanguage]
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
          // Use current state value for segment labels visibility
          setShowSegmentLabels((currentShowSegments) => {
            // Apply final style with segment labels (canvas-based)
            feature.setStyle(createSegmentStyle(currentShowSegments));
            return currentShowSegments;
          });

          // Store feature reference
          setMeasurementFeatures((prev) => [...prev, feature]);

          // Announce measurement completion with actual values
          if (geometry instanceof LineString) {
            const length = GeoUtilities.getLength(geometry);
            const distance = formatLength(length, displayLanguage);
            setStatusMessage(t('measurement.status.completedLine', { distance }));
          } else if (geometry instanceof Polygon) {
            const perimeter = GeoUtilities.getLength(geometry);
            const area = GeoUtilities.getArea(geometry);
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
    [clearSketchListener, createSegmentStyle, mapController, uiController, displayLanguage, t]
  );

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
      const { activeElement } = document;
      const geoViewElement = getStoreAppGeoviewHTMLElement(mapId);
      if (!activeElement || !geoViewElement?.contains(activeElement) || isEditableElement(activeElement)) return;

      // Capture phase: this sees the sketch before the Draw interaction cancels it, so one Escape never does both.
      if (event.key === 'Escape') {
        if (sketchVertexCount.current === 0) uiController.focusToolButton(GV_DOM_SUFFIX.measureButton);
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
  }, [activeMeasurement, mapController, uiController, mapId, t]);

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
          id={`${mapId}-button-clear-measurements`}
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
    id: buildGVElementId(mapId, GV_DOM_SUFFIX.measureButton),
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
