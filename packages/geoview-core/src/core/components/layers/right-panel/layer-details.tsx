import { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import _ from 'lodash';
import { TypeLegendLayer, TypeLegendItem } from '@/core/components/layers/types';
import { getSxClasses } from './layer-details-style';
import {
  Box,
  CheckBoxIcon,
  CheckBoxOutlineBlankIcon,
  IconButton,
  Paper,
  Typography,
  ZoomInSearchIcon,
  Grid,
  RestartAltIcon,
  HighlightOutlinedIcon,
  TableViewIcon,
  BrowserNotSupportedIcon,
  Divider,
  ListItem,
  List,
} from '@/ui';
import { useLayerHighlightedLayer, useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import {
  useDataTableAllFeaturesDataArray,
  useDataTableLayerSettings,
  useDataTableStoreActions,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { generateId, isValidUUID } from '@/core/utils/utilities';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { LayerOpacityControl } from './layer-opacity-control/layer-opacity-control';
import { logger } from '@/core/utils/logger';
import { LAYER_STATUS } from '@/core/utils/constant';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { Collapse } from '@/ui/collapse/collapse';
import { Button } from '@/ui/button/button';
import { KeyboardArrowDownIcon, KeyboardArrowUpIcon } from '@/ui/icons';
import { useAppDisplayLanguage, useAppMetadataServiceURL } from '@/core/stores/store-interface-and-intial-values/app-state';
import { Switch } from '@/ui/switch/switch';
import { UtilAddLayer } from '@/core/components/layers/left-panel/add-new-layer/add-layer-utils';
import {
  useMapVisibleLayers,
  useSelectorIsLayerHiddenOnMap,
  useSelectorLayerVisibility,
  useMapStoreActions,
  useSelectorLayerParentHidden,
} from '@/core/stores/store-interface-and-intial-values/map-state';

interface LayerDetailsProps {
  layerDetails: TypeLegendLayer;
}

interface SubLayerProps {
  layer: TypeLegendLayer;
}

// Memoized Sublayer Component
const Sublayer = memo(({ layer }: SubLayerProps): JSX.Element => {
  // Log
  logger.logTraceRender('components/layers/right-panel/Sublayer');

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Hooks
  const layerHidden = useSelectorIsLayerHiddenOnMap(layer.layerPath);
  const parentHidden = useSelectorLayerParentHidden(layer.layerPath);
  const layerVisible = useSelectorLayerVisibility(layer.layerPath);
  const { setOrToggleLayerVisibility } = useMapStoreActions();

  // Return the ui
  return (
    <ListItem>
      <IconButton color="primary" onClick={() => setOrToggleLayerVisibility(layer.layerPath)} disabled={parentHidden}>
        {layerVisible ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
      </IconButton>
      <LayerIcon layerPath={layer.layerPath} />
      <Box
        component="span"
        sx={{ ...sxClasses.tableIconLabel, ...(layerHidden && { color: theme.palette.grey[600], fontStyle: 'italic' }) }}
      >
        {layer.layerName}
      </Box>
    </ListItem>
  );
});

Sublayer.displayName = 'Sublayer';

export function LayerDetails(props: LayerDetailsProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-details');

  const { layerDetails } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const hiddenStyle = { color: theme.palette.grey[600], fontStyle: 'italic' };

  const [isInfoCollapse, setIsInfoCollapse] = useState(false);
  const [allSublayersVisible, setAllSublayersVisible] = useState(true);

  // get store actions
  const highlightedLayer = useLayerHighlightedLayer();
  const {
    setAllItemsVisibility,
    toggleItemVisibility,
    setHighlightLayer,
    refreshLayer,
    zoomToLayerExtent,
    getLayerBounds,
    getLayerDefaultFilter,
    getLayerServiceProjection,
    getLayerTimeDimension,
    setLayerHoverable,
    setLayerQueryable,
  } = useLayerStoreActions();
  const { setOrToggleLayerVisibility } = useMapStoreActions();
  const { enableFocusTrap } = useUIStoreActions();
  const { triggerGetAllFeatureInfo } = useDataTableStoreActions();
  const visibleLayers = useMapVisibleLayers();
  const datatableSettings = useDataTableLayerSettings();
  const layersData = useDataTableAllFeaturesDataArray();
  const language = useAppDisplayLanguage();
  const metadataUrl = useAppMetadataServiceURL();
  const layerFilter = getLayerDefaultFilter(layerDetails.layerPath);
  const layerTimeDimension = getLayerTimeDimension(layerDetails.layerPath);
  const layerNativeProjection = getLayerServiceProjection(layerDetails.layerPath);
  const layerVisible = useSelectorLayerVisibility(layerDetails.layerPath);
  const parentHidden = useSelectorLayerParentHidden(layerDetails.layerPath);
  const layerHidden = useSelectorIsLayerHiddenOnMap(layerDetails.layerPath);

  // Is highlight button disabled?
  const isLayerHighlightCapable = layerDetails.controls?.highlight;

  // Is zoom to extent button disabled?
  const isLayerZoomToExtentCapable = layerDetails.controls?.zoom;

  // Is layer hoverable or queryable
  const isLayerHoverable = layerDetails.controls?.hover;
  const isLayerQueryable = layerDetails.controls?.query;

  // Get the localized layer type
  const memoLocalizedLayerType = useMemo(() => UtilAddLayer.getLocalizeLayerType(language, true), [language]);

  // GV Wrapped in useEffect since it was throwing a warning otherwise
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER DETAILS - Bounds', layerDetails);

    if (layerDetails.bounds === undefined || layerDetails.bounds[0] === Infinity) {
      const bounds = getLayerBounds(layerDetails.layerPath);
      if (bounds) layerDetails.bounds = bounds;
    }
  }, [layerDetails, getLayerBounds]);

  /**
   * Recursively checks if all children of a layer are visible.
   * @param {TypeLegendLayer} legendLayer - The legend layer to check
   * @param {string[]} curVisibleLayers - The visible layers array
   * @returns {boolean} Whether the children are visible
   */
  const legendLayersChildrenVisible = useCallback((legendLayer: TypeLegendLayer, curVisibleLayers: string[]): boolean => {
    // Log
    logger.logTraceUseCallback('LAYER-DETAILS - legendLayersChildrenVisible');

    // Check if any children are not visible
    if (legendLayer.children.find((child) => !curVisibleLayers.includes(child.layerPath))) return false;

    // Check if any of the children have a child that is not visible
    const invisibleChildren = legendLayer.children.find((child) => {
      return child.children?.length && !legendLayersChildrenVisible(child, curVisibleLayers);
    });

    if (invisibleChildren) return false;
    return true;
  }, []);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER DETAILS - allChildrenVisible', layerDetails);

    const allChildrenVisible = legendLayersChildrenVisible(layerDetails, visibleLayers);
    if (allChildrenVisible !== allSublayersVisible) setAllSublayersVisible(allChildrenVisible);
  }, [allSublayersVisible, layerDetails, layerDetails.children, legendLayersChildrenVisible, visibleLayers]);

  const handleRefreshLayer = (): void => {
    refreshLayer(layerDetails.layerPath);
  };

  const handleZoomTo = (): void => {
    zoomToLayerExtent(layerDetails.layerPath).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in zoomToLayerExtent in layer-details.handleZoomTo', error);
    });
  };

  const handleOpenTable = (): void => {
    // trigger the fetching of the features when not available OR when layer status is in error
    if (
      !layersData.filter((layers) => layers.layerPath === layerDetails.layerPath && !!layers?.features?.length).length ||
      layerDetails.layerStatus === LAYER_STATUS.ERROR
    ) {
      triggerGetAllFeatureInfo(layerDetails.layerPath).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('Failed to triggerGetAllFeatureInfo in single-layer.handleLayerClick', error);
      });
    }
    enableFocusTrap({ activeElementId: 'layerDataTable', callbackElementId: `table-details` });
  };

  const handleHighlightLayer = (): void => {
    setHighlightLayer(layerDetails.layerPath);
  };

  /**
   * Recursively sets child layer visibility.
   * @param {TypeLegendLayer} legendLayer - The legend layer to set the child visibility of
   * @param {boolean} newVisibility - The new visibility to set
   */
  const setVisibilityForAllSublayers = useCallback(
    (legendLayer: TypeLegendLayer, newVisibility: boolean): void => {
      // Log
      logger.logTraceUseCallback('LAYER-DETAILS - setVisibilityForAllSublayers');

      legendLayer.children.forEach((child) => {
        if (newVisibility) {
          if (!visibleLayers.includes(child.layerPath)) setOrToggleLayerVisibility(child.layerPath, true);
        } else if (visibleLayers.includes(child.layerPath)) setOrToggleLayerVisibility(child.layerPath, false);
        if (child.children.length) setVisibilityForAllSublayers(child, newVisibility);
      });
    },
    [setOrToggleLayerVisibility, visibleLayers]
  );

  /**
   * Sets visibility for all children of the layer.
   */
  const handleToggleAllVisibility = useCallback((): void => {
    setVisibilityForAllSublayers(layerDetails, !allSublayersVisible);
  }, [allSublayersVisible, layerDetails, setVisibilityForAllSublayers]);

  const allItemsChecked = (): boolean => {
    return _.every(layerDetails.items, (i) => i.isVisible !== false);
  };

  function renderItemCheckbox(item: TypeLegendItem): JSX.Element | null {
    // First check if styleConfig exists
    if (!layerDetails.styleConfig) {
      return null;
    }

    // No checkbox for simple style layers
    if (layerDetails.styleConfig[item.geometryType]?.type === 'simple') return null;

    // GV: Some esri layer has uniqueValue renderer but there is no field define in their metadata (i.e. e2424b6c-db0c-4996-9bc0-2ca2e6714d71).
    // For these layers, we need to disable checkboxes
    if (layerDetails.styleConfig[item.geometryType]?.fields[0] === undefined) return null;

    if (!layerDetails.canToggle) {
      return (
        <IconButton disabled tooltip={t('layers.visibilityIsAlways')!}>
          <CheckBoxIcon color="disabled" />
        </IconButton>
      );
    }

    return (
      <IconButton color="primary" onClick={() => toggleItemVisibility(layerDetails.layerPath, item)} disabled={layerHidden}>
        {item.isVisible === true ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
      </IconButton>
    );
  }

  function renderHeaderCheckbox(): JSX.Element {
    if (!layerDetails.canToggle) {
      return (
        <IconButton disabled>
          <CheckBoxIcon color="disabled" />
        </IconButton>
      );
    }

    return (
      <IconButton color="primary" onClick={() => setAllItemsVisibility(layerDetails.layerPath, !allItemsChecked())} disabled={layerHidden}>
        {allItemsChecked() ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
      </IconButton>
    );
  }

  function renderItems(): JSX.Element {
    return (
      <Grid
        className="layer-details-panel"
        container
        direction="column"
        spacing={0}
        sx={sxClasses.itemsGrid}
        justifyContent="left"
        justifyItems="stretch"
      >
        {layerDetails.items.map((item) => (
          <Grid
            container
            direction="row"
            key={`${item.name}/${layerDetails.items.indexOf(item)}`}
            alignItems="center"
            justifyItems="stretch"
            sx={{ display: 'flex', flexWrap: 'nowrap' }}
          >
            <Grid size={{ xs: 'auto' }}>{renderItemCheckbox(item)}</Grid>
            <Grid size={{ xs: 'auto' }} sx={{ display: 'flex' }}>
              {item.icon ? (
                <Box component="img" sx={{ alignSelf: 'center', maxHeight: '26px', maxWidth: '26px' }} alt={item.name} src={item.icon} />
              ) : (
                <BrowserNotSupportedIcon />
              )}
              <Box component="span" sx={{ ...sxClasses.tableIconLabel, ...((layerHidden || !item.isVisible) && hiddenStyle) }}>
                {item.name}
              </Box>
            </Grid>
          </Grid>
        ))}
      </Grid>
    );
  }

  function renderSubLayers(startLayer: TypeLegendLayer): JSX.Element {
    return (
      <List>
        {startLayer.children.map((layer) => (
          <Fragment key={layer.layerId}>
            <Sublayer layer={layer} />
            {layer.children.length > 0 && <Box sx={{ paddingLeft: '30px', width: '100%' }}>{renderSubLayers(layer)}</Box>}
          </Fragment>
        ))}
      </List>
    );
  }

  function renderDetailsButton(): JSX.Element {
    if (layerDetails.controls?.table !== false)
      return (
        <IconButton id="table-details" tooltip={t('legend.tableDetails')!} className="buttonOutline" onClick={handleOpenTable}>
          <TableViewIcon />
        </IconButton>
      );
    return (
      <IconButton id="table-details" className="buttonOutline" disabled>
        <TableViewIcon color="disabled" />
      </IconButton>
    );
  }

  function renderHighlightButton(): JSX.Element {
    if (isLayerHighlightCapable)
      return (
        <IconButton
          tooltip={t('legend.highlightLayer')!}
          onClick={handleHighlightLayer}
          className={highlightedLayer === layerDetails.layerPath ? 'buttonOutline active' : 'buttonOutline'}
          disabled={layerHidden}
        >
          <HighlightOutlinedIcon />
        </IconButton>
      );
    return <Box />;
  }

  function renderZoomButton(): JSX.Element {
    if (isLayerZoomToExtentCapable)
      return (
        <IconButton
          tooltip={t('legend.zoomTo')!}
          onClick={handleZoomTo}
          className="buttonOutline"
          disabled={layerDetails.bounds === undefined || layerHidden}
        >
          <ZoomInSearchIcon />
        </IconButton>
      );
    return <Box />;
  }

  function renderLayerButtons(): JSX.Element {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', marginLeft: 'auto' }}>
        {datatableSettings[layerDetails.layerPath] && renderDetailsButton()}
        <IconButton tooltip={t('legend.refreshLayer')!} className="buttonOutline" onClick={handleRefreshLayer}>
          <RestartAltIcon />
        </IconButton>
        {renderHighlightButton()}
        {renderZoomButton()}
      </Box>
    );
  }

  const getSubTitle = (): string | null => {
    if (parentHidden) return t('layers.parentHidden');
    if (!layerVisible) return t('layers.hidden');
    if (layerDetails.children.length > 0) {
      return t('legend.subLayersCount').replace('{count}', layerDetails.children.length.toString());
    }
    const count = layerDetails.items.filter((d) => d.isVisible !== false).length;
    const totalCount = layerDetails.items.length;

    if (totalCount <= 1) {
      return null;
    }
    return t('legend.itemsCount').replace('{count}', count.toString()).replace('{totalCount}', totalCount.toString());
  };

  const renderWMSImage = (): JSX.Element | null => {
    if (
      layerDetails.type === CONST_LAYER_TYPES.WMS &&
      layerDetails.icons.length &&
      layerDetails.icons[0].iconImage &&
      layerDetails.icons[0].iconImage !== 'no data'
    ) {
      return (
        <Grid sx={sxClasses.itemsGrid}>
          <Grid container pt={6} pb={6}>
            <Box component="img" alt="icon" src={layerDetails.icons[0].iconImage} sx={sxClasses.wmsImage} />
          </Grid>
        </Grid>
      );
    }

    return null;
  };

  const renderInfo = (): JSX.Element | null => {
    const { type, url, layerPath } = layerDetails;

    // Set Ressource
    const wfsParams = '?service=WFS&version=2.0.0&request=GetCapabilities';
    const wmsParams = '?service=WMS&version=1.3.0&request=GetCapabilities';
    let resources: string = '';

    // Check if we can set the resource url
    if (url) {
      switch (type) {
        case CONST_LAYER_TYPES.WMS:
          // Check if URL already includes WMS GetCapabilities parameters
          // eslint-disable-next-line no-nested-ternary
          resources = url.toLowerCase().endsWith('.xml')
            ? `${url}`
            : url.includes('?')
              ? url
              : `${url}${wmsParams}&layers=${layerPath.split('/').slice(-1)[0]}`;
          break;
        case CONST_LAYER_TYPES.ESRI_DYNAMIC:
        case CONST_LAYER_TYPES.ESRI_FEATURE:
          resources = `${url}${url.endsWith('/') ? '' : '/'}${layerPath.split('/').slice(-1)[0]}`;
          break;
        case CONST_LAYER_TYPES.XYZ_TILES:
        case CONST_LAYER_TYPES.ESRI_IMAGE:
          resources = `${url}`;
          break;
        case CONST_LAYER_TYPES.WFS:
          // Check if URL already includes WFS GetCapabilities parameters
          resources = url.includes('?') ? url : `${url}${wfsParams}`;
          break;
        case CONST_LAYER_TYPES.OGC_FEATURE:
          resources = `${url}/collections/${layerPath.split('/').slice(-1)[0]}`;
          break;
        case CONST_LAYER_TYPES.VECTOR_TILES:
          resources = `${url}?f=html`;
          break;
        default:
          break;
      }
    }

    // Check if we can set the metadata from layerPath
    const id = layerDetails.layerPath.split('/')[0].split(':')[0];
    const validId = isValidUUID(id) && metadataUrl !== '';

    // Find the localized name for the current layer type
    const localizedTypeEntry = memoLocalizedLayerType.find(([memoType]) => memoType === layerDetails.type);
    let localizedTypeName = localizedTypeEntry ? localizedTypeEntry[1] : t('layers.serviceGroup');

    // Special case if type is GeoJSON and url end by zip or shp. It is a GeoJSON format derived from a shapefile
    if (localizedTypeName === CONST_LAYER_TYPES.GEOJSON && (layerDetails.url?.includes('.zip') || layerDetails.url?.includes('.shp'))) {
      localizedTypeName = `${localizedTypeName} - ${t('layers.serviceEsriShapefile')}`;
    }

    return (
      <Box>
        <Button type="text" sx={{ fontSize: theme.palette.geoViewFontSize.sm }} onClick={() => setIsInfoCollapse(!isInfoCollapse)}>
          {`${t('layers.moreInfo')}`}
          <IconButton className="buttonOutline" edge="end" size="small" tooltip={t('layers.toggleCollapse')!}>
            {isInfoCollapse ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Button>
        <Collapse in={isInfoCollapse} sx={sxClasses.layerInfo}>
          <Box>{`${t('layers.layerType')}${localizedTypeName}`}</Box>
          {layerNativeProjection && <Box>{`${t('layers.layerServiceProjection')}${layerNativeProjection}`}</Box>}
          {layerFilter && <Box>{`${t('layers.layerDefaultFilter')}${layerFilter}`}</Box>}
          {layerTimeDimension && (
            <Box>{`${t('layers.layerTimeDimension')}${t('layers.layerTimeDimensionField')} - ${layerTimeDimension.field} -, min - ${layerTimeDimension.rangeItems.range[0]} / max - ${layerTimeDimension.rangeItems.range[layerTimeDimension.rangeItems.range.length - 1]}`}</Box>
          )}
          {resources !== '' && (
            <Box className="info-container">
              {`${t('layers.layerResource')}`}
              <a href={resources} target="_blank" rel="noopener noreferrer">
                {resources}
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
          {isLayerHoverable && (
            <Switch
              size="small"
              onChange={() => setLayerHoverable(layerDetails.layerPath, !layerDetails.hoverable!)}
              label={t('layers.layerHoverable')!}
              checked={layerDetails.hoverable}
            />
          )}
          {isLayerQueryable && (
            <Switch
              size="small"
              onChange={() => setLayerQueryable(layerDetails.layerPath, !layerDetails.queryable!)}
              label={t('layers.layerQueryable')!}
              checked={layerDetails.queryable}
            />
          )}
        </Collapse>
      </Box>
    );
  };

  // Render
  return (
    <Paper sx={sxClasses.layerDetails}>
      {layerDetails !== undefined && (
        <>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
              alignItems: 'center',
              paddingTop: '10px',
            }}
          >
            <Box sx={{ textAlign: 'left', maxWidth: '70%', [theme.breakpoints.down('md')]: { display: 'none' } }}>
              <Typography sx={{ ...sxClasses.categoryTitle, ...(layerHidden && hiddenStyle) }} title={layerDetails.layerName}>
                {layerDetails.layerName}
              </Typography>
              {getSubTitle() && (
                <Typography
                  sx={{
                    fontSize: theme.palette.geoViewFontSize.sm,
                    ...(layerHidden && hiddenStyle),
                  }}
                >
                  {' '}
                  {getSubTitle()}{' '}
                </Typography>
              )}
            </Box>
            {renderLayerButtons()}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap-reverse' }}>
            {layerDetails.items.length > 1 && (
              <Grid container direction="row" alignItems="center" justifyItems="stretch">
                <Grid size={{ xs: 'auto' }}>{renderHeaderCheckbox()}</Grid>
                <Grid size={{ xs: 'auto' }}>
                  <Box component="span" sx={{ fontWeight: 'bold', ...(layerHidden && hiddenStyle) }}>
                    {t('layers.toggleItemsVisibility')}
                  </Box>
                </Grid>
              </Grid>
            )}
            {layerDetails.children.length > 0 && (
              <Grid container direction="row" alignItems="center" justifyItems="stretch">
                <Grid size={{ xs: 'auto' }}>
                  <IconButton color="primary" onClick={handleToggleAllVisibility} disabled={layerHidden}>
                    {allSublayersVisible ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                  </IconButton>
                </Grid>
                <Grid size={{ xs: 'auto' }}>
                  <Box component="span" sx={{ fontWeight: 'bold', ...(layerHidden && hiddenStyle) }}>
                    {t('layers.toggleSublayersVisibility')}
                  </Box>
                </Grid>
              </Grid>
            )}
            {layerDetails.controls?.opacity !== false && <LayerOpacityControl layerDetails={layerDetails} />}
          </Box>
          <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} variant="middle" />
          {renderWMSImage()}
          <Box>
            {layerDetails.items?.length > 0 && renderItems()}
            {layerDetails.children.length > 0 && renderSubLayers(layerDetails)}
          </Box>
          <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} variant="middle" />
          {renderInfo()}
          {layerDetails.layerAttribution &&
            layerDetails.layerAttribution.map((attribution) => {
              if (attribution) {
                return (
                  <Typography
                    sx={{
                      marginTop: '10px',
                      color: theme.palette.geoViewColor.textColor.light[200],
                      fontSize: theme.palette.geoViewFontSize.sm,
                      textAlign: 'center',
                    }}
                    key={generateId(18)}
                  >
                    {attribution.indexOf('©') === -1 ? `© ${attribution}` : attribution}
                  </Typography>
                );
              }
              return null;
            })}
        </>
      )}
    </Paper>
  );
}
