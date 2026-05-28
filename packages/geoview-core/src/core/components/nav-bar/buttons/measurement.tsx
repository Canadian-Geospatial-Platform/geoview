import type { ReactNode } from 'react';
import { createElement, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { LineString, Polygon, Point } from 'ol/geom';
import type { DrawEvent as OLDrawEvent } from 'ol/interaction/Draw';
import { Style, Stroke, Fill, Text } from 'ol/style';
import type { StyleFunction } from 'ol/style/Style';
import type { FeatureLike } from 'ol/Feature';
import type Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';

import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { IconButton } from '@/ui/icon-button/icon-button';
import { Box, Switch, ToggleButtonGroup, ToggleButton, Typography } from '@/ui';
import { ShowChartIcon, DeleteIcon, StraightenIcon, HexagonOutlinedIcon } from '@/ui/icons';
import { visuallyHidden } from '@/ui/style/default';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from '@/core/components/nav-bar/nav-bar-panel-button';
import { formatLength, formatArea } from '@/core/utils/utilities';
import type { Draw } from '@/geo/interaction/draw';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useStoreAppDisplayLanguage } from '@/core/stores/states/app-state';
import { GeoUtilities } from '@/geo/utils/utilities';
import { useMapController } from '@/core/controllers/use-controllers';

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

  // Stores
  const mapId = useStoreGeoViewMapId();
  const displayLanguage = useStoreAppDisplayLanguage();
  const mapController = useMapController();

  // States
  const [activeMeasurement, setActiveMeasurement] = useState<MeasureType>(null);
  const [drawInstance, setDrawInstance] = useState<Draw | null>(null);
  const [showSegmentLabels, setShowSegmentLabels] = useState<boolean>(true);
  const [measurementFeatures, setMeasurementFeatures] = useState<Feature<Geometry>[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // #region Handlers

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

      // Stop existing measurement if any
      if (drawInstance) {
        drawInstance.stopInteraction();
      }

      // Create or get the geometry group for measurements
      mapController.createGeometryGroup(MEASURE_GROUP_KEY);

      // Start drawing interaction
      const geomType = type === 'line' ? 'LineString' : 'Polygon';
      const draw = mapController.initDrawInteractions(MEASURE_GROUP_KEY, geomType, {
        strokeColor: STROKE_COLORS,
        strokeWidth: STROKE_WIDTH,
        fillColor: FILL_COLORS,
      });

      // Handle draw end
      draw.onDrawEnd((_sender: unknown, event: OLDrawEvent) => {
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

      setDrawInstance(draw);
      setActiveMeasurement(type);

      // Register the draw instance for keyboard accessibility via crosshair
      // This also suppresses hover and click-marker handlers (like drawer does)
      mapController.setActiveMeasurementDraw(draw);

      // Announce measurement mode started
      const measurementType = type === 'line' ? t('measurement.line') : t('measurement.area');
      setStatusMessage(t('measurement.status.started', { type: measurementType }));
    },
    [drawInstance, createSegmentStyle, mapController, displayLanguage, t]
  );

  /**
   * Stops the current measurement.
   */
  const stopMeasurement = useCallback((): void => {
    if (drawInstance) {
      drawInstance.stopInteraction();
      setDrawInstance(null);
    }
    setActiveMeasurement(null);

    // Unregister the draw instance for keyboard accessibility
    mapController.setActiveMeasurementDraw(null);

    // Announce measurement stopped
    setStatusMessage(t('measurement.status.stopped'));
  }, [drawInstance, mapController, t]);

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
    stopMeasurement();

    // Announce cleared with count
    if (featureCount > 0) {
      setStatusMessage(t('measurement.status.cleared', { count: featureCount }));
    }
  }, [stopMeasurement, mapController, measurementFeatures.length, t]);

  /**
   * Handles the measurement enable/disable toggle switch.
   */
  const handleMeasurementToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* WCAG - Screen reader status announcements */}
        <Typography role="status" aria-live="polite" aria-atomic="true" sx={visuallyHidden}>
          {statusMessage}
        </Typography>

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
            sx={{
              '& .MuiToggleButton-root': {
                gap: 6, // Adds 8px spacing between icon and text
              },
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
          id={`${mapId}-button-clear-measurements`}
          aria-label={t('measurement.clear')}
          onClick={clearMeasurements}
          className="buttonOutline"
          disabled={measurementFeatures.length === 0}
          size="small"
          sx={{ alignSelf: 'center' }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>

        {/* Keyboard accessibility hint */}
        <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.8 }}>
          {t('measurement.keyboardHint')}
        </Typography>
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
