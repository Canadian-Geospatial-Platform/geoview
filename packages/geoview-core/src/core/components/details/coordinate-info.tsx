import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import { getSxClasses } from './details-style';

import { List, ListItem, Box, Typography, Switch, Tooltip } from '@/ui';
import { CircularProgressBase } from '@/ui/circular-progress/circular-progress-base';
import {
  useStoreDetailsLayerDataArrayFeature,
  useStoreDetailsCoordinateInfoEnabled,
  useStoreDetailsQueryStatus,
  LAYER_PATH_COORDINATE_INFO,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { useStoreMapClickCoordinates } from '@/core/stores/store-interface-and-intial-values/map-state';
import { GeoUtilities } from '@/geo/utils/utilities';
import { logger } from '@/core/utils/logger';
import { useMapController } from '@/core/controllers/use-controllers';

/** Coordinate data extracted from the feature info. */
type CoordinateData = {
  /** The latitude value. */
  lat: number;
  /** The longitude value. */
  lng: number;
  /** Optional UTM zone string. */
  utmZone?: string;
  /** Optional easting value. */
  easting?: string;
  /** Optional northing value. */
  northing?: string;
  /** Optional NTS mapsheet identifier. */
  ntsMapsheet?: string;
  /** Optional elevation value. */
  elevation?: string;
};

/** Properties for the CoordinateInfoSwitch component. */
interface CoordinateInfoSwitchProps {
  /** Optional flag to disable the switch. */
  disabled?: boolean;
}

/**
 * Creates the coordinate info toggle switch component.
 *
 * @param props - Properties defined in CoordinateInfoSwitchProps interface
 * @returns The coordinate info switch
 */
export function CoordinateInfoSwitch({ disabled }: CoordinateInfoSwitchProps): JSX.Element {
  // Log
  logger.logTraceRender('components/details/coordinate-info');

  const { t } = useTranslation();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Store
  const coordinateInfoEnabled = useStoreDetailsCoordinateInfoEnabled();
  const mapController = useMapController();

  // AbortController ref — aborts any in-flight coordinate info fetch on unmount or re-toggle
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Handles toggling the coordinate info switch.
   */
  const handleCoordinateInfoToggle = useCallback((): void => {
    // Abort any in-flight request
    abortControllerRef.current?.abort();

    // Create a new AbortController for this toggle
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Toggle the state
    mapController.toggleCoordinateInfoEnabled(controller.signal);
  }, [mapController]);

  /**
   * Aborts the previous coordinate info request on unmount.
   */
  useEffect(() => {
    return (): void => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <Tooltip title={t('details.toggleCoordinateInfo')} placement="top">
      <span>
        <Switch
          size={isSmallScreen ? 'small' : 'medium'}
          checked={coordinateInfoEnabled}
          onChange={handleCoordinateInfoToggle}
          label={t('details.showCoordinateInfo')}
          disabled={disabled}
        />
      </span>
    </Tooltip>
  );
}

/**
 * Creates the coordinate info panel component.
 *
 * @returns The coordinate info panel
 */
export function CoordinateInfo(): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const clickCoordinates = useStoreMapClickCoordinates();
  const feature = useStoreDetailsLayerDataArrayFeature();
  const layerQueryStatus = useStoreDetailsQueryStatus(LAYER_PATH_COORDINATE_INFO);
  const spinning = layerQueryStatus === 'processing';

  /**
   * Memoizes the parsed coordinate data from the feature.
   */
  const memoCoordinateData = useMemo((): CoordinateData => {
    return {
      lat: parseFloat(clickCoordinates?.lonlat[1]?.toString() || '0'),
      lng: parseFloat(clickCoordinates?.lonlat[0]?.toString() || '0'),
      utmZone: feature?.fieldInfo.utmZone?.value?.toString(),
      easting: feature?.fieldInfo.easting?.value?.toString(),
      northing: feature?.fieldInfo.northing?.value?.toString(),
      ntsMapsheet: feature?.fieldInfo.ntsMapsheet?.value?.toString(),
      elevation: feature?.fieldInfo.elevation?.value?.toString(),
    };
  }, [feature, clickCoordinates]);

  const { lat, lng, utmZone, easting, northing, ntsMapsheet, elevation } = memoCoordinateData;

  return (
    <Box sx={sxClasses.rightPanelContainer} className="guide-content-container">
      <Box sx={sxClasses.coordinateInfoContainer}>
        <Typography variant="h6" sx={sxClasses.coordinateInfoTitle}>
          {t('details.coordinateInfoTitle')}
        </Typography>

        <List>
          <ListItem sx={sxClasses.coordinateInfoSection} disablePadding>
            <Typography variant="subtitle1" sx={sxClasses.coordinateInfoSectionTitle}>
              {t('details.geographicCoordinates')}
            </Typography>
            <Box sx={sxClasses.coordinateInfoContent}>
              <Typography>{t('details.degreesDecimal')}:</Typography>
              <Box sx={sxClasses.coordinateInfoSubContent}>
                <Typography>
                  {t('details.latitude')}: {lat.toFixed(6)}° {lat >= 0 ? 'N' : 'S'}
                </Typography>
                <Typography>
                  {t('details.longitude')}: {Math.abs(lng).toFixed(6)}° {lng >= 0 ? 'E' : 'W'}
                </Typography>
              </Box>
              <Typography>{t('details.degreesMinutesSeconds')}:</Typography>
              <Box sx={sxClasses.coordinateInfoSubContent}>
                <Typography>
                  {t('details.latitude')}: {GeoUtilities.coordFormatDMS(lat)}
                </Typography>
                <Typography>
                  {t('details.longitude')}: {GeoUtilities.coordFormatDMS(lng)}
                </Typography>
              </Box>
            </Box>
          </ListItem>

          <ListItem sx={sxClasses.coordinateInfoSection} disablePadding>
            <Typography variant="subtitle1" sx={sxClasses.coordinateInfoSectionTitle}>
              {t('details.utmCoordinates')}
            </Typography>
            {spinning && <CircularProgressBase size={20} />}
            {!spinning && utmZone && (
              <Box sx={sxClasses.coordinateInfoContent}>
                <Typography>
                  {t('details.zone')}: {utmZone}
                </Typography>
                <Typography>
                  {t('details.easting')}: {easting}
                </Typography>
                <Typography>
                  {t('details.northing')}: {northing}
                </Typography>
              </Box>
            )}
          </ListItem>

          <ListItem sx={sxClasses.coordinateInfoSection} disablePadding>
            <Typography variant="subtitle1" sx={sxClasses.coordinateInfoSectionTitle}>
              {t('details.ntsMapsheet')}
            </Typography>
            {spinning && <CircularProgressBase size={20} />}
            {!spinning && ntsMapsheet && (
              <Box sx={sxClasses.coordinateInfoContent}>
                {ntsMapsheet.split('\n').map((line) => (
                  <Typography key={line}>{line}</Typography>
                ))}
              </Box>
            )}
          </ListItem>

          <ListItem sx={sxClasses.coordinateInfoSection} disablePadding>
            <Typography variant="subtitle1" sx={sxClasses.coordinateInfoSectionTitle}>
              {t('details.elevation')}
            </Typography>
            {spinning && <CircularProgressBase size={20} />}
            {!spinning && elevation && (
              <Box sx={sxClasses.coordinateInfoContent}>
                <Typography>{elevation}</Typography>
              </Box>
            )}
          </ListItem>

          {/* {declination && (
            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {t('details.declination')}
              </Typography>
              <Box sx={{ ml: 2 }}>
                <Typography>{declination}</Typography>
              </Box>
            </ListItem>
          )} */}
        </List>
      </Box>
    </Box>
  );
}
