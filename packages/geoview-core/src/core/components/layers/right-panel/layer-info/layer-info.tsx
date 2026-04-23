import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box, Divider, List, ListItem, Typography } from '@/ui';
import { ListItemText } from '@/ui/list';

import { getSxClasses } from '../layer-details-style';
import { logger } from '@/core/utils/logger';
import { getLocalizedMessage, isValidUUID } from '@/core/utils/utilities';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { UtilAddLayer } from '@/core/components/layers/left-panel/add-new-layer/add-layer-utils';
import { useStoreAppDisplayLanguage, useStoreAppMetadataServiceURL } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useStoreMapCurrentProjectionEPSG } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useStoreDataTableFilter } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import {
  useStoreLayerDateTemporalMode,
  useStoreLayerDisplayDateFormat,
  useStoreLayerDisplayDateFormatShort,
  useStoreLayerDisplayDateTimezone,
  useStoreLayerBounds,
  useStoreLayerBounds4326,
  useStoreLayerFilter,
  useStoreLayerFilterClass,
  useStoreLayerTimeDimension,
  useStoreLayerSchemaTag,
  useStoreLayerUrl,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useStoreTimeSliderFilter, useStoreTimeSliderLayer } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { useLayerController } from '@/core/controllers/use-controllers';

// OGC/ESRI service capability request suffixes
const WFS_PARAMS = '?service=WFS&version=2.0.0&request=GetCapabilities';
const WMS_PARAMS = '?service=WMS&version=1.3.0&request=GetCapabilities';

interface LayerInfoPanelProps {
  /** The layer path to display information for. */
  layerPath: string;
}

/**
 * Panel view for layer information content.
 *
 * Displays layer type, projection, bounds, active filters, temporal settings,
 * resource links, and metadata links. The header and back navigation are
 * handled by the parent.
 *
 * @param layerPath - The layer path to display information for.
 */
export function LayerInfoPanel({ layerPath }: LayerInfoPanelProps): JSX.Element | null {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-info/layer-info');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('LAYER-INFO - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // Store hooks
  const language = useStoreAppDisplayLanguage();
  const metadataUrl = useStoreAppMetadataServiceURL();
  const mapProjectionEPSG = useStoreMapCurrentProjectionEPSG();
  const layerFilter = useStoreLayerFilter(layerPath);
  const classFilter = useStoreLayerFilterClass(layerPath);
  const dataFilter = useStoreDataTableFilter(layerPath);
  const timeFilter = useStoreTimeSliderFilter(layerPath);
  const schemaTag = useStoreLayerSchemaTag(layerPath);
  const url = useStoreLayerUrl(layerPath);
  const bounds = useStoreLayerBounds(layerPath);
  const bounds4326 = useStoreLayerBounds4326(layerPath);
  const layerDisplayDateFormat = useStoreLayerDisplayDateFormat(layerPath);
  const layerDisplayDateFormatShort = useStoreLayerDisplayDateFormatShort(layerPath);
  const layerDateTemporalMode = useStoreLayerDateTemporalMode(layerPath);
  const layerDisplayDateTimezone = useStoreLayerDisplayDateTimezone(layerPath);
  const layerTimeDimension = useStoreLayerTimeDimension(layerPath);
  const timeSliderDimension = useStoreTimeSliderLayer(layerPath);
  const layerController = useLayerController();

  // TODO: CHECK - This should probably be a Zustand store hook instead of a controller getter?
  const layerNativeProjection = layerController.getLayerMetatadaProjectionEPSG(layerPath);

  // Derived values
  const memoLocalizedLayerType = useMemo(() => {
    logger.logTraceUseMemo('LAYER-INFO - memoLocalizedLayerType', language);
    return UtilAddLayer.getLocalizeLayerType(language, true);
  }, [language]);
  const boundsRounded = bounds?.map((value) => Math.round(value));
  const boundsRounded4326 = bounds4326?.map((value) => Math.round(value * 100) / 100);

  // Build resource URL based on layer type
  const memoResources = useMemo((): string => {
    logger.logTraceUseMemo('LAYER-INFO - memoResources', url, schemaTag, layerPath);
    if (!url) return '';
    const leafSegment = layerPath.split('/').slice(-1)[0];

    switch (schemaTag) {
      case CONST_LAYER_TYPES.WMS:
        // Check if URL already includes WMS GetCapabilities parameters
        // eslint-disable-next-line no-nested-ternary
        return url.toLowerCase().endsWith('.xml') ? url : url.includes('?') ? url : `${url}${WMS_PARAMS}&layers=${leafSegment}`;
      case CONST_LAYER_TYPES.ESRI_DYNAMIC:
      case CONST_LAYER_TYPES.ESRI_FEATURE:
        return `${url}${url.endsWith('/') ? '' : '/'}${leafSegment}`;
      case CONST_LAYER_TYPES.XYZ_TILES:
      case CONST_LAYER_TYPES.ESRI_IMAGE:
        return url;
      case CONST_LAYER_TYPES.WFS:
        // Check if URL already includes WFS GetCapabilities parameters
        return url.includes('?') ? url : `${url}${WFS_PARAMS}`;
      case CONST_LAYER_TYPES.OGC_FEATURE:
        return `${url}/collections/${leafSegment}`;
      case CONST_LAYER_TYPES.VECTOR_TILES:
        return `${url}?f=html`;
      default:
        return '';
    }
  }, [url, schemaTag, layerPath]);

  // Check if we can set the metadata from layerPath
  const id = layerPath.split('/')[0].split(':')[0];
  const validId = isValidUUID(id) && metadataUrl !== '';

  // Find the localized name for the current layer type
  const memoLocalizedTypeName = useMemo((): string => {
    logger.logTraceUseMemo('LAYER-INFO - memoLocalizedTypeName', schemaTag, url);
    const localizedTypeEntry = memoLocalizedLayerType.find(([memoType]) => memoType === schemaTag);
    let name = localizedTypeEntry ? localizedTypeEntry[1] : t('layers.serviceGroup');

    // Special case if type is GeoJSON and url end by zip or shp. It is a GeoJSON format derived from a shapefile
    if (name === CONST_LAYER_TYPES.GEOJSON && (url?.includes('.zip') || url?.includes('.shp'))) {
      name = `${name} - ${t('layers.serviceEsriShapefile')}`;
    }
    return name;
  }, [memoLocalizedLayerType, schemaTag, url, t]);

  return (
    <Box sx={memoSxClasses.layerInfo}>
      <Divider sx={{ height: 'auto', marginTop: '10px', marginBottom: '10px' }} variant="middle" />

      {/* Service Information */}
      <Box sx={memoSxClasses.infoSection}>
        <Typography sx={memoSxClasses.infoSectionTitle}>{t('layers.layerInfoServiceInfo')}</Typography>
        <Box sx={memoSxClasses.infoSectionContent}>
          <Box>{`${t('layers.layerType')}${memoLocalizedTypeName}`}</Box>
          {layerNativeProjection && <Box>{`${t('layers.layerServiceProjection')}${layerNativeProjection}`}</Box>}
          {memoResources !== '' && (
            <Box className="info-container">
              {`${t('layers.layerResource')}`}
              <a href={memoResources} target="_blank" rel="noopener noreferrer">
                {memoResources}
              </a>
            </Box>
          )}
          {validId && (
            <Box className="info-container">
              {`${t('layers.layerMetadata')}`}
              <a href={`${metadataUrl}${id}`} target="_blank" rel="noopener noreferrer">
                {`${id}`}
              </a>
            </Box>
          )}
          <Box>{`${getLocalizedMessage(language, 'layers.layerBounds', [mapProjectionEPSG])}: ${boundsRounded?.join(', ')}`}</Box>
          <Box>{`${t('layers.layerBounds4326')}: ${boundsRounded4326?.join(', ')}`}</Box>
        </Box>
      </Box>

      {/* Active Filters */}
      <Box sx={memoSxClasses.infoSection}>
        <Typography sx={memoSxClasses.infoSectionTitle}>{t('layers.layerInfoActiveFilters')}</Typography>
        <Box sx={memoSxClasses.infoSectionContent}>
          <List sx={memoSxClasses.layerDetailsListGroup}>
            {layerFilter && (
              <ListItem sx={memoSxClasses.layerDetailsListItem}>
                <ListItemText primary={`${t('layers.layerDefaultFilter')}${layerFilter}`} />
              </ListItem>
            )}
            {classFilter && (
              <ListItem sx={memoSxClasses.layerDetailsListItem}>
                <ListItemText primary={`${t('layers.layerClassFilter')}${classFilter}`} />
              </ListItem>
            )}
            {dataFilter && (
              <ListItem sx={memoSxClasses.layerDetailsListItem}>
                <ListItemText primary={`${t('layers.layerDataTableFilter')}${dataFilter}`} />
              </ListItem>
            )}
            {timeFilter && (
              <ListItem sx={memoSxClasses.layerDetailsListItem}>
                <ListItemText primary={`${t('layers.layerTimeFilter')}${timeFilter}`} />
              </ListItem>
            )}
            {!layerFilter && !classFilter && !dataFilter && !timeFilter && (
              <ListItem sx={memoSxClasses.layerDetailsListItem}>
                <ListItemText primary={t('layers.layerActiveFiltersNone')} />
              </ListItem>
            )}
          </List>
        </Box>
      </Box>

      {/* Temporal Settings */}
      {(layerDisplayDateFormat ||
        layerDisplayDateFormatShort ||
        layerDateTemporalMode ||
        layerDisplayDateTimezone ||
        layerTimeDimension?.field) && (
        <Box sx={memoSxClasses.infoSection}>
          <Typography sx={memoSxClasses.infoSectionTitle}>{t('layers.layerInfoTemporalSettings')}</Typography>
          <Box sx={memoSxClasses.infoSectionContent}>
            <List sx={memoSxClasses.layerDetailsListGroup}>
              {layerDisplayDateFormat && (
                <ListItem sx={memoSxClasses.layerDetailsListItem}>
                  <ListItemText primary={`${t('layers.layerDisplayDateFormat')}${layerDisplayDateFormat[language]}`} />
                </ListItem>
              )}
              {layerDisplayDateFormatShort && (
                <ListItem sx={memoSxClasses.layerDetailsListItem}>
                  <ListItemText primary={`${t('layers.layerDisplayDateFormatShort')}${layerDisplayDateFormatShort[language]}`} />
                </ListItem>
              )}
              {layerDateTemporalMode && (
                <ListItem sx={memoSxClasses.layerDetailsListItem}>
                  <ListItemText primary={`${t('layers.layerDateTemporalMode')}${layerDateTemporalMode}`} />
                </ListItem>
              )}
              {layerDisplayDateTimezone && (
                <ListItem sx={memoSxClasses.layerDetailsListItem}>
                  <ListItemText primary={`${t('layers.layerDisplayDateTimezone')}${layerDisplayDateTimezone}`} />
                </ListItem>
              )}
              {layerTimeDimension?.field && (
                <ListItem sx={memoSxClasses.layerDetailsListItem}>
                  <ListItemText primary={`${t('layers.layerTimeDimensionField')}${layerTimeDimension.field}`} />
                </ListItem>
              )}
              {layerTimeDimension?.rangeItems?.range?.[0] && (
                <ListItem sx={memoSxClasses.layerDetailsListItem}>
                  <ListItemText
                    primary={`${'Min/Max: '}${layerTimeDimension.rangeItems.range[0]} / ${layerTimeDimension.rangeItems.range[layerTimeDimension.rangeItems.range.length - 1]}`}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </Box>
      )}

      {/* Temporal Dimension (Time Slider) */}
      {timeSliderDimension && (
        <Box sx={memoSxClasses.infoSection}>
          <Typography sx={memoSxClasses.infoSectionTitle}>{t('layers.layerInfoTemporalDimension')}</Typography>
          <Box sx={memoSxClasses.infoSectionContent}>
            <List sx={memoSxClasses.layerDetailsListGroup}>
              {timeSliderDimension.displayDateFormat?.[language] && (
                <ListItem sx={memoSxClasses.layerDetailsListItem}>
                  <ListItemText primary={`${t('layers.layerDisplayDateFormat')}${timeSliderDimension.displayDateFormat[language]}`} />
                </ListItem>
              )}
              {timeSliderDimension.serviceDateTemporalMode && (
                <ListItem sx={memoSxClasses.layerDetailsListItem}>
                  <ListItemText primary={`${t('layers.layerDateTemporalMode')}${timeSliderDimension.serviceDateTemporalMode}`} />
                </ListItem>
              )}
              {timeSliderDimension.displayDateTimezone && (
                <ListItem sx={memoSxClasses.layerDetailsListItem}>
                  <ListItemText primary={`${t('layers.layerDisplayDateTimezone')}${timeSliderDimension.displayDateTimezone}`} />
                </ListItem>
              )}
              {timeSliderDimension?.field && timeSliderDimension?.field !== layerTimeDimension?.field && (
                <ListItem sx={memoSxClasses.layerDetailsListItem}>
                  <ListItemText primary={`${t('layers.layerTimeDimensionField')}${timeSliderDimension.field}`} />
                </ListItem>
              )}
              {timeSliderDimension?.range?.[0] && (
                <ListItem sx={memoSxClasses.layerDetailsListItem}>
                  <ListItemText
                    primary={`${'Min/Max: '}${timeSliderDimension.range[0]} / ${timeSliderDimension.range[timeSliderDimension.range.length - 1]}`}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </Box>
      )}
    </Box>
  );
}
