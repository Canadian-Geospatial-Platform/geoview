import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box, Divider, List, ListItem, Typography } from '@/ui';
import { ListItemText } from '@/ui/list';

import { getSxClasses } from '../layer-details-style';
import { logger } from '@/core/utils/logger';
import { isLocalhost, isValidUUID } from '@/core/utils/utilities';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { UtilAddLayer } from '@/core/components/layers/left-panel/add-new-layer/add-layer-utils';
import { useStoreAppDisplayLanguage, useStoreAppMetadataServiceURL } from '@/core/stores/states/app-state';
import { useStoreMapCurrentProjectionEPSG } from '@/core/stores/states/map-state';
import { useStoreDataTableFilter } from '@/core/stores/states/data-table-state';
import {
  useStoreLayerDateTemporalMode,
  useStoreLayerDisplayDateFormat,
  useStoreLayerDisplayDateFormatShort,
  useStoreLayerDisplayDateTimezone,
  useStoreLayerBounds,
  useStoreLayerBounds4326,
  useStoreLayerEntryType,
  useStoreLayerFilter,
  useStoreLayerFilterClass,
  useStoreLayerMinScale,
  useStoreLayerMaxScale,
  useStoreLayerOgcVersion,
  useStoreLayerQueryable,
  useStoreLayerQueryableSource,
  useStoreLayerSchemaTag,
  useStoreLayerTimeDimension,
  useStoreLayerUrl,
} from '@/core/stores/states/layer-state';
import { useStoreTimeSliderFilter, useStoreTimeSliderLayer } from '@/core/stores/states/time-slider-state';
import { useLayerController } from '@/core/controllers/use-controllers';
import { GeoUtilities } from '@/geo/utils/utilities';

interface LayerInfoPanelProps {
  /** The layer path to display information for. */
  layerPath: string;
}

/**
 * Creates the layer information panel component.
 *
 * Displays layer type, projection, bounds, active filters, temporal settings,
 * resource links, and metadata links. The header and back navigation are
 * handled by the parent.
 *
 * @param props - Properties defined in LayerInfoPanelProps interface
 * @returns The layer information panel component, or null if unavailable
 */
export function LayerInfoPanel({ layerPath }: LayerInfoPanelProps): JSX.Element | null {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-info/layer-info');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  /** Builds the style classes for the current theme. */
  const memoSxClasses = useMemo((): ReturnType<typeof getSxClasses> => {
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
  const ogcVersion = useStoreLayerOgcVersion(layerPath);
  const bounds = useStoreLayerBounds(layerPath);
  const bounds4326 = useStoreLayerBounds4326(layerPath);
  const minScale = useStoreLayerMinScale(layerPath);
  const maxScale = useStoreLayerMaxScale(layerPath);
  const layerEntryType = useStoreLayerEntryType(layerPath);
  const isLayerGroup = layerEntryType === 'group';
  const layerQueryableSource = useStoreLayerQueryableSource(layerPath);
  // For UI simplicity, when queryable state is undefined, it means it's queryable as long as the source is queryable
  const layerQueryable = useStoreLayerQueryable(layerPath) ?? layerQueryableSource;
  const layerScaleDependant = minScale !== undefined || maxScale !== undefined;
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
  /** Builds localized layer type labels for the current language. */
  const memoLocalizedLayerType = useMemo((): ReturnType<typeof UtilAddLayer.getLocalizeLayerType> => {
    logger.logTraceUseMemo('LAYER-INFO - memoLocalizedLayerType', language);
    return UtilAddLayer.getLocalizeLayerType(language, true);
  }, [language]);
  const boundsRounded = bounds?.map((value) => Math.round(value));
  const boundsRounded4326 = bounds4326?.map((value) => Math.round(value * 100) / 100);

  /** Builds the service resource URL based on layer type. */
  const memoResources = useMemo((): string => {
    logger.logTraceUseMemo('LAYER-INFO - memoResources', url, schemaTag, layerPath);
    if (!url) return '';
    const leafSegment = layerPath.split('/').slice(-1)[0];

    switch (schemaTag) {
      case CONST_LAYER_TYPES.WMS:
        // Check if URL already includes WMS GetCapabilities parameters
        return url.toLowerCase().endsWith('.xml') ? url : GeoUtilities.ensureServiceRequestUrlGetCapabilities(url, 'WMS', leafSegment);
      case CONST_LAYER_TYPES.ESRI_DYNAMIC:
      case CONST_LAYER_TYPES.ESRI_FEATURE:
        return `${url}${url.endsWith('/') ? '' : '/'}${leafSegment}`;
      case CONST_LAYER_TYPES.XYZ_TILES:
      case CONST_LAYER_TYPES.ESRI_IMAGE:
        return url;
      case CONST_LAYER_TYPES.WFS:
        // Check if URL already includes WFS GetCapabilities parameters
        return GeoUtilities.ensureServiceRequestUrlGetCapabilities(url, 'WFS');
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

  /** Builds the localized display name for the current layer type. */
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
          {isLocalhost() && <Box>{`${t('layers.layerPath')}: ${layerPath}`}</Box>}
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
          {ogcVersion && <Box>{`${t('layers.layerOgcVersion')}: ${ogcVersion}`}</Box>}
          <Box>{`${t('layers.layerBounds', { mapProjectionEPSG })}: ${boundsRounded?.join(', ')}`}</Box>
          <Box>{`${t('layers.layerBounds4326')}: ${boundsRounded4326?.join(', ')}`}</Box>
          {layerScaleDependant && <Box>{`${t('layers.layerMaxScale')}: ${maxScale}`}</Box>}
          {layerScaleDependant && <Box>{`${t('layers.layerMinScale')}: ${minScale}`}</Box>}
          {!isLayerGroup && <Box>{`${t('layers.layerQueryableSource')}: ${layerQueryableSource}`}</Box>}
          {!isLayerGroup && <Box>{`${t('layers.layerQueryable')}: ${layerQueryable}`}</Box>}
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
