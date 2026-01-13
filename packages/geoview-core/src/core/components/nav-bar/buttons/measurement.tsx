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
import { useAppDisplayLanguage, useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

const MEASURE_GROUP_KEY = 'geoview-measurement';

// Style constants
const STROKE_COLORS = '#ff0000';

const FILL_COLORS = 'rgba(255, 0, 0, 0.2)';

const STROKE_WIDTH = 2;

// Shared tooltip/label style values (drawer-tooltip style)
const TOOLTIP_BASE_STYLE = {
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  textColor: '#fff',
  fontSize: '13px',
  fontWeight: 'bold',
  padding: { top: 4, right: 8, bottom: 4, left: 8 },
} as const;

// OpenLayers canvas Text style config (for segment labels)
const LABEL_STYLE_CONFIG = {
  font: `${TOOLTIP_BASE_STYLE.fontWeight} ${TOOLTIP_BASE_STYLE.fontSize} sans-serif`,
  textColor: TOOLTIP_BASE_STYLE.textColor,
  haloColor: 'rgba(0, 0, 0, 0.7)',
  haloWidth: 9,
} as const;

// Reusable Fill and Stroke objects for labels
const LABEL_TEXT_FILL = new Fill({ color: LABEL_STYLE_CONFIG.textColor });
const LABEL_HALO_STROKE = new Stroke({ color: LABEL_STYLE_CONFIG.haloColor, width: LABEL_STYLE_CONFIG.haloWidth });

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

  // Stores
  const displayLanguage = useAppDisplayLanguage();
  const { createGeometryGroup, deleteGeometriesFromGroup, forceMapToRender, initDrawInteractions } = useMapStoreActions();
  const mapElement = useAppGeoviewHTMLElement().querySelector(`[id^="mapTargetElement-${useGeoViewMapId()}"]`) as HTMLElement;

  // States
  const [activeMeasurement, setActiveMeasurement] = useState<MeasureType>(null);
  const [drawInstance, setDrawInstance] = useState<Draw | null>(null);
  const [showSegmentLabels, setShowSegmentLabels] = useState<boolean>(true);
  const [measurementFeatures, setMeasurementFeatures] = useState<Feature<Geometry>[]>([]);

  /**
   * Creates a style function that shows segment lengths
   * @param {boolean} [includeSegmentLabels=true] - Whether to include segment length labels on the geometry
   * @returns {StyleFunction} OpenLayers style function that applies measurement styles
   */
  const createSegmentStyle = useCallback(
    (includeSegmentLabels: boolean = true): StyleFunction => {
      // Log
      logger.logTraceUseCallback('MEASUREMENT, createSegmentStyle');

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
   * Starts a measurement operation
   * @param {MeasureType} type - The type of measurement to start ('line' for distance, 'area' for area, null to clear)
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
      createGeometryGroup(MEASURE_GROUP_KEY);

      // Start drawing interaction
      const geomType = type === 'line' ? 'LineString' : 'Polygon';
      const draw = initDrawInteractions(MEASURE_GROUP_KEY, geomType, {
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
        }
      });

      setDrawInstance(draw);
      setActiveMeasurement(type);

      // Set focus to map for WCAG keyboard interaction
      if (mapElement) {
        mapElement.focus();
      }
    },
    [mapElement, drawInstance, initDrawInteractions, createGeometryGroup, createSegmentStyle]
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

    // Clear stored feature references
    setMeasurementFeatures([]);

    // Delete all geometries from the group
    deleteGeometriesFromGroup(MEASURE_GROUP_KEY);

    // Stop current drawing
    stopMeasurement();
  }, [stopMeasurement, deleteGeometriesFromGroup]);

  /**
   * Handles measurement mode toggle
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event from the switch toggle
   * @param {boolean} event.target.checked - Whether the measurement mode is enabled or disabled
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
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event from the segment labels switch toggle
   * @param {boolean} event.target.checked - Whether segment labels should be shown or hidden
   */
  const handleSegmentLabelsToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      // Log
      logger.logTraceUseCallback('MEASUREMENT, handleSegmentLabelsToggle', event.target.checked);

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
      forceMapToRender();
    },
    [createSegmentStyle, forceMapToRender]
  );

  /**
   * Handles measurement type selection
   * @param {React.MouseEvent<HTMLElement>} _event - The mouse event from the toggle button (unused)
   * @param {MeasureType} newType - The newly selected measurement type ('line' or 'area')
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
    // We use the empty array to avoid the rerender for clear measurement trigger on enable toggle
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
          disabled={measurementFeatures.length === 0}
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
