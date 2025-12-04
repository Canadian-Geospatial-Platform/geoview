import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import { getSxClasses } from './details-style';

import { List, ListItem, Box, Typography, Switch, Tooltip } from '@/ui';
import {
  useDetailsLayerDataArray,
  useDetailsCoordinateInfoEnabled,
  useDetailsStoreActions,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { coordFormatDMS } from '@/geo/utils/utilities';
import { logger } from '@/core/utils/logger';

type CoordinateData = {
  lat: number;
  lng: number;
  utmZone?: string;
  easting?: string;
  northing?: string;
  ntsMapsheet?: string;
  elevation?: string;
};

export function CoordinateInfoSwitch(): JSX.Element {
  // Log
  logger.logTraceRender('components/toggle-all/toggle');

  const { t } = useTranslation();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const coordinateInfoEnabled = useDetailsCoordinateInfoEnabled();
  const { toggleCoordinateInfoEnabled } = useDetailsStoreActions();

  const handleCoordinateInfoToggle = useCallback(() => {
    // Log
    logger.logTraceUseCallback('DETAILS-PANEL - handleCoordinateInfoToggle');

    // Toggle the state
    toggleCoordinateInfoEnabled();
  }, [toggleCoordinateInfoEnabled]);

  return (
    <Tooltip title={t('details.toggleCoordinateInfo')}>
      <span>
        <Switch
          size={isSmallScreen ? 'small' : 'medium'}
          checked={coordinateInfoEnabled}
          onChange={handleCoordinateInfoToggle}
          label={t('details.showCoordinateInfo') || undefined}
        />
      </span>
    </Tooltip>
  );
}

/**
 * The Coordinate Info feature info to be shown on the right panel
 * @param {TypeCoordinateInfoProps} props - The properties passed to CoordinateInfo
 * @returns {JSX.Element} The coordinate info panel
 */
export function CoordinateInfo(): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const layerDataArray = useDetailsLayerDataArray();

  // Find the coordinate info layer
  const coordinateInfoLayer = layerDataArray.find((layer) => layer.layerPath === 'coordinate-info');
  const feature = coordinateInfoLayer?.features?.[0];

  const coordinateData = useMemo((): CoordinateData | undefined => {
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

  if (!coordinateData) {
    return <Typography>{t('details.noCoordinateInfo')}</Typography>;
  }

  const { lat, lng, utmZone, easting, northing, ntsMapsheet, elevation } = coordinateData;

  return (
    <Box sx={sxClasses.rightPanelContainer}>
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
                  {t('details.latitude')}: {coordFormatDMS(lat)}
                </Typography>
                <Typography>
                  {t('details.longitude')}: {coordFormatDMS(lng)}
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
