import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box } from '@/ui/layout';
import { List } from '@/ui/list/list';
import { Divider } from '@/ui/divider/divider';
import { Typography } from '@/ui/typography/typography';

import { getSxClasses } from '@/core/components/layers/right-panel/layer-details-style';
import { logger } from '@/core/utils/logger';
import { isLocalhost, isValidUUID } from '@/core/utils/utilities';
import type { RangeItems } from '@/core/utils/date-mgt';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { UtilAddLayer } from '@/core/components/layers/left-panel/add-new-layer/add-layer-utils';
import { useStoreAppDisplayLanguage, useStoreAppMetadataServiceURL } from '@/core/stores/states/app-state';
import { useStoreMapCurrentProjectionEPSG } from '@/core/stores/states/map-state';
import { useStoreDataTableFilter } from '@/core/stores/states/data-table-state';
import {
  useStoreLayerBounds,
  useStoreLayerBounds4326,
  useStoreLayerDataProjectionCode,
  useStoreLayerDateTemporalMode,
  useStoreLayerDisplayDateFormat,
  useStoreLayerDisplayDateFormatShort,
  useStoreLayerDisplayDateTimezone,
  useStoreLayerEntryType,
  useStoreLayerFilter,
  useStoreLayerFilterClass,
  useStoreLayerMinScale,
  useStoreLayerMaxScale,
  useStoreLayerMaxRecordCount,
  useStoreLayerTotalRecordsCount,
  useStoreLayerTotalRecordsCountSource,
  useStoreLayerOgcVersion,
  useStoreLayerQueryable,
  useStoreLayerQueryableSource,
  useStoreLayerSchemaTag,
  useStoreLayerTimeDimension,
  useStoreLayerUrl,
  useStoreLayerVectorStructureFullUrl,
  useStoreLayerVectorStrategy,
  useStoreLayerWMSGetStylesFullUrl,
  useStoreLayerMaxPageSize,
} from '@/core/stores/states/layer-state';
import { useStoreTimeSliderFilter, useStoreTimeSliderLayer } from '@/core/stores/states/time-slider-state';
import { useStoreFilterPanelFilterExpression } from '@/core/stores/states/filter-panel-state';
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
  const panelFilter = useStoreFilterPanelFilterExpression(layerPath);
  const schemaTag = useStoreLayerSchemaTag(layerPath);
  const url = useStoreLayerUrl(layerPath);
  const ogcVersion = useStoreLayerOgcVersion(layerPath);
  const vectorStructureFullUrl = useStoreLayerVectorStructureFullUrl(layerPath);
  const wmsGetStylesFullUrl = useStoreLayerWMSGetStylesFullUrl(layerPath);
  const bounds = useStoreLayerBounds(layerPath);
  const bounds4326 = useStoreLayerBounds4326(layerPath);
  const minScale = useStoreLayerMinScale(layerPath);
  const maxScale = useStoreLayerMaxScale(layerPath);
  const maxPageSize = useStoreLayerMaxPageSize(layerPath);
  const maxRecordCount = useStoreLayerMaxRecordCount(layerPath);
  const totalRecordsCount = useStoreLayerTotalRecordsCount(layerPath);
  const totalRecordsCountSource = useStoreLayerTotalRecordsCountSource(layerPath);
  const vectorStrategy = useStoreLayerVectorStrategy(layerPath);
  const isExtentRecordCount =
    vectorStrategy === 'bbox' &&
    (schemaTag === CONST_LAYER_TYPES.OGC_FEATURE || schemaTag === CONST_LAYER_TYPES.WFS || schemaTag === CONST_LAYER_TYPES.ESRI_FEATURE);
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
  const layerDataProjectionCode = useStoreLayerDataProjectionCode(layerPath);

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
      case CONST_LAYER_TYPES.WMTS:
        return GeoUtilities.ensureServiceRequestUrlGetCapabilities(url, 'WMTS', leafSegment);
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

  /**
   * Renders temporal range values or minimum, maximum, and duration information.
   *
   * @param rangeItems - Temporal range information to render
   * @param isDiscrete - Whether the range contains discrete values
   * @returns The temporal range information as list items (must be rendered inside a list), or null when the range is empty
   */
  const renderTemporalRangeInfo = (rangeItems: RangeItems, isDiscrete: boolean): JSX.Element | null => {
    if (!rangeItems.range[0]) return null;

    if (isDiscrete && !rangeItems.durationInterval) {
      return <Box component="li">{`${t('layers.layerTimeDimensionRangeTypeValues')}: ${rangeItems.range.join(', ')}`}</Box>;
    }

    return (
      <>
        <Box component="li">{`${t('layers.layerTimeDimensionRangeTypeMinMax')}: ${rangeItems.range[0]} / ${rangeItems.range[rangeItems.range.length - 1]}`}</Box>
        <Box component="li">
          {t('layers.layerTimeDimensionRangeDurationInterval')} (
          <a href={`${GeoUtilities.ISO_8601_REF_DIMENSION_INTERVAL}`} target="_blank" rel="noopener noreferrer">
            {t('layers.layerTimeDimensionRangeDurationIntervalSpec')}
          </a>
          ): {rangeItems.durationInterval ?? <em>{t('layers.layerTimeDimensionRangeDurationIntervalSpecNotSet')}</em>}
        </Box>
      </>
    );
  };

  return (
    <Box sx={memoSxClasses.layerInfo}>
      <Divider sx={memoSxClasses.sectionDivider} variant="middle" />

      {/* Service Information */}
      <Box sx={memoSxClasses.infoSection}>
        <Typography component="h3" variant="h6" sx={memoSxClasses.infoSectionTitle}>
          {t('layers.layerInfoServiceInfo')}
        </Typography>
        <List sx={memoSxClasses.infoList}>
          {isLocalhost() && <Box component="li">{`${t('layers.layerPath')}: ${layerPath}`}</Box>}
          <Box component="li">{`${t('layers.layerType')}${memoLocalizedTypeName}`}</Box>
          {memoResources !== '' && (
            <Box component="li">
              <Box className="info-container">
                {`${t('layers.layerResource')}`}
                <a href={memoResources} target="_blank" rel="noopener noreferrer">
                  {memoResources}
                </a>
              </Box>
            </Box>
          )}
          {validId && (
            <Box component="li">
              <Box className="info-container">
                {`${t('layers.layerMetadata')}`}
                <a href={`${metadataUrl}${id}`} target="_blank" rel="noopener noreferrer">
                  {`${id}`}
                </a>
              </Box>
            </Box>
          )}
          {vectorStructureFullUrl && (
            <Box component="li">
              <Box className="info-container">
                {`${t('layers.layerVectorStructureFullUrl')}`}
                <a href={vectorStructureFullUrl} target="_blank" rel="noopener noreferrer">
                  {vectorStructureFullUrl}
                </a>
              </Box>
            </Box>
          )}
          {wmsGetStylesFullUrl && (
            <Box component="li">
              <Box className="info-container">
                {`${t('layers.layerWmsGetStylesFullUrl')}`}
                <a href={wmsGetStylesFullUrl} target="_blank" rel="noopener noreferrer">
                  {wmsGetStylesFullUrl}
                </a>
              </Box>
            </Box>
          )}
          {ogcVersion && <Box component="li">{`${t('layers.layerOgcVersion')}: ${ogcVersion}`}</Box>}
          {layerDataProjectionCode && (
            <Box component="li">{`${t('layers.layerServiceProjection')}: ${layerDataProjectionCode}${schemaTag === CONST_LAYER_TYPES.WMS ? ` (${t('layers.layerServiceProjectionAndMore')})` : ''}`}</Box>
          )}
          <Box component="li">{`${t('layers.layerBounds', { mapProjectionEPSG })}: ${boundsRounded?.join(', ')}`}</Box>
          <Box component="li">{`${t('layers.layerBounds4326')}: ${boundsRounded4326?.join(', ')}`}</Box>
          {layerScaleDependant && <Box component="li">{`${t('layers.layerMaxScale')}: ${maxScale}`}</Box>}
          {layerScaleDependant && <Box component="li">{`${t('layers.layerMinScale')}: ${minScale}`}</Box>}
          {!isLayerGroup && <Box component="li">{`${t('layers.layerQueryableSource')}: ${layerQueryableSource}`}</Box>}
          {vectorStrategy && <Box component="li">{`${t('layers.layerVectorStrategy')}: ${vectorStrategy}`}</Box>}
          {/* Check for undefined, not falsy: 0 is a valid configured value and should be shown. */}
          {maxPageSize !== undefined && <Box component="li">{`${t('layers.layerMaxPageSize')}: ${maxPageSize}`}</Box>}
          {maxRecordCount !== undefined && <Box component="li">{`${t('layers.layerMaxRecordCount')}: ${maxRecordCount}`}</Box>}
          {totalRecordsCount !== undefined && (
            <Box component="li">
              {`${t(isExtentRecordCount ? 'layers.layerTotalRecordsCountInExtent' : 'layers.layerTotalRecordsCount')}: ${totalRecordsCount}`}
              {totalRecordsCountSource === 'numberMatched' && ` (${t('layers.layerRecordsCountProvided')})`}
              {totalRecordsCountSource === 'service' && ` (${t('layers.layerRecordsCountService')})`}
              {totalRecordsCountSource === 'counted' && ` (${t('layers.layerRecordsCountCounted')})`}
            </Box>
          )}
          {!isLayerGroup && <Box component="li">{`${t('layers.layerQueryable')}: ${layerQueryable}`}</Box>}
        </List>
      </Box>

      {/* Active Filters */}
      <Box sx={memoSxClasses.infoSection}>
        <Typography component="h3" variant="h6" sx={memoSxClasses.infoSectionTitle}>
          {t('layers.layerInfoActiveFilters')}
        </Typography>
        <List sx={memoSxClasses.infoList}>
          {layerFilter && <Box component="li">{`${t('layers.layerDefaultFilter')}${layerFilter}`}</Box>}
          {classFilter && <Box component="li">{`${t('layers.layerClassFilter')}${classFilter}`}</Box>}
          {dataFilter && <Box component="li">{`${t('layers.layerDataTableFilter')}${dataFilter}`}</Box>}
          {timeFilter && <Box component="li">{`${t('layers.layerTimeFilter')}${timeFilter}`}</Box>}
          {panelFilter && <Box component="li">{`${t('layers.layerPanelFilter')}${panelFilter}`}</Box>}
          {!layerFilter && !classFilter && !dataFilter && !timeFilter && !panelFilter && (
            <Box component="li">{t('layers.layerActiveFiltersNone')}</Box>
          )}
        </List>
      </Box>

      {/* Temporal Settings */}
      {(layerDisplayDateFormat ||
        layerDisplayDateFormatShort ||
        layerDateTemporalMode ||
        layerDisplayDateTimezone ||
        layerTimeDimension?.field) && (
        <Box sx={memoSxClasses.infoSection}>
          <Typography component="h3" variant="h6" sx={memoSxClasses.infoSectionTitle}>
            {t('layers.layerInfoTemporalInformation')}
          </Typography>
          <List sx={memoSxClasses.infoList}>
            {layerDisplayDateFormat && (
              <Box component="li">{`${t('layers.layerDisplayDateFormat')}${layerDisplayDateFormat[language]}`}</Box>
            )}
            {layerDisplayDateFormatShort && (
              <Box component="li">{`${t('layers.layerDisplayDateFormatShort')}${layerDisplayDateFormatShort[language]}`}</Box>
            )}
            {layerDateTemporalMode && <Box component="li">{`${t('layers.layerDateTemporalMode')}${layerDateTemporalMode}`}</Box>}
            {layerDisplayDateTimezone && <Box component="li">{`${t('layers.layerDisplayDateTimezone')}${layerDisplayDateTimezone}`}</Box>}
            {layerTimeDimension?.field && <Box component="li">{`${t('layers.layerTimeDimensionField')}: ${layerTimeDimension.field}`}</Box>}
            {layerTimeDimension?.rangeItems.type && (
              <Box component="li">{`${t('layers.layerTimeDimensionRangeType')}: ${layerTimeDimension?.rangeItems.type}`}</Box>
            )}
            {layerTimeDimension &&
              renderTemporalRangeInfo(layerTimeDimension.rangeItems, layerTimeDimension.rangeItems.type === 'discrete')}
            <Box component="li">{`${t('layers.layerIsGroupDimension')}: ${layerTimeDimension?.isGroupDimension ?? false}`}</Box>
          </List>
        </Box>
      )}

      {/* Temporal Dimension (Time Slider) */}
      {timeSliderDimension && (
        <Box sx={memoSxClasses.infoSection}>
          <Typography component="h3" variant="h6" sx={memoSxClasses.infoSectionTitle}>
            {t('layers.layerInfoTemporalDimension')}
          </Typography>
          <List sx={memoSxClasses.infoList}>
            {timeSliderDimension.displayDateFormat?.[language] && (
              <Box component="li">{`${t('layers.layerDisplayDateFormat')}${timeSliderDimension.displayDateFormat[language]}`}</Box>
            )}
            {timeSliderDimension.serviceDateTemporalMode && (
              <Box component="li">{`${t('layers.layerDateTemporalMode')}${timeSliderDimension.serviceDateTemporalMode}`}</Box>
            )}
            {timeSliderDimension.displayDateTimezone && (
              <Box component="li">{`${t('layers.layerDisplayDateTimezone')}${timeSliderDimension.displayDateTimezone}`}</Box>
            )}
            {timeSliderDimension?.field && timeSliderDimension?.field !== layerTimeDimension?.field && (
              <Box component="li">{`${t('layers.layerTimeDimensionField')}: ${timeSliderDimension.field}`}</Box>
            )}
            {renderTemporalRangeInfo(timeSliderDimension.rangeItems, timeSliderDimension.discreteValues)}
          </List>
        </Box>
      )}
    </Box>
  );
}
