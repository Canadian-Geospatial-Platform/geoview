import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import { getSxClasses } from './details-style';

import { List, ListItem, Box, Typography, Switch, Tooltip } from '@/ui';
import {
  useDetailsLayerDataArray,
  useDetailsCoordinateInfoEnabled,
  toggleStoreDetailsCoordinateInfoEnabled,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { GeoUtilities } from '@/geo/utils/utilities';
import { logger } from '@/core/utils/logger';

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
  const mapId = useGeoViewMapId();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const coordinateInfoEnabled = useDetailsCoordinateInfoEnabled();

  /**
   * Handles toggling the coordinate info switch.
   */
  const handleCoordinateInfoToggle = useCallback((): void => {
    // Toggle the state
    toggleStoreDetailsCoordinateInfoEnabled(mapId);
  }, [mapId]);

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

  const layerDataArray = useDetailsLayerDataArray();

  // Find the coordinate info layer
  const coordinateInfoLayer = layerDataArray.find((layer) => layer.layerPath === 'coordinate-info');
  const feature = coordinateInfoLayer?.features?.[0];

  /**
   * Memoizes the parsed coordinate data from the feature.
   */
  const memoCoordinateData = useMemo((): CoordinateData | undefined => {
    if (!feature?.fieldInfo) return undefined;

    return {
      lat: parseFloat(feature.fieldInfo.latitude?.value?.toString() || '0'),
      lng: parseFloat(feature.fieldInfo.longitude?.value?.toString() || '0'),
      utmZone: feature.fieldInfo.utmZone?.value?.toString(),
      easting: feature.fieldInfo.easting?.value?.toString(),
      northing: feature.fieldInfo.northing?.value?.toString(),
      ntsMapsheet: feature.fieldInfo.ntsMapsheet?.value?.toString(),
      elevation: feature.fieldInfo.elevation?.value?.toString(),
    };
  }, [feature]);

  if (!memoCoordinateData) {
    return <Typography>{t('details.noCoordinateInfo')}</Typography>;
  }

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

          {utmZone && (
            <ListItem sx={sxClasses.coordinateInfoSection} disablePadding>
              <Typography variant="subtitle1" sx={sxClasses.coordinateInfoSectionTitle}>
                {t('details.utmCoordinates')}
              </Typography>
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
            </ListItem>
          )}

          {ntsMapsheet && (
            <ListItem sx={sxClasses.coordinateInfoSection} disablePadding>
              <Typography variant="subtitle1" sx={sxClasses.coordinateInfoSectionTitle}>
                {t('details.ntsMapsheet')}
              </Typography>
              <Box sx={sxClasses.coordinateInfoContent}>
                {ntsMapsheet.split('\n').map((line) => (
                  <Typography key={line}>{line}</Typography>
                ))}
              </Box>
            </ListItem>
          )}

          {elevation && (
            <ListItem sx={sxClasses.coordinateInfoSection} disablePadding>
              <Typography variant="subtitle1" sx={sxClasses.coordinateInfoSectionTitle}>
                {t('details.elevation')}
              </Typography>
              <Box sx={sxClasses.coordinateInfoContent}>
                <Typography>{elevation}</Typography>
              </Box>
            </ListItem>
          )}

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
