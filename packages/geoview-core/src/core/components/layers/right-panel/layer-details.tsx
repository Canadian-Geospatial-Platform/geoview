import { Fragment, useEffect, useState } from 'react';
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
  ListItemText,
  ListItemIcon,
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
import { generateId } from '@/core/utils/utilities';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { LayerOpacityControl } from './layer-opacity-control/layer-opacity-control';
import { logger } from '@/core/utils/logger';
import { LAYER_STATUS } from '@/core/utils/constant';
import { useSelectorLayerInVisibleRange } from '@/app';

interface LayerDetailsProps {
  layerDetails: TypeLegendLayer;
}

export function LayerDetails(props: LayerDetailsProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-details');

  const { layerDetails } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const [isDataTableVisible, setIsDataTableVisible] = useState(false);

  // get store actions
  const highlightedLayer = useLayerHighlightedLayer();
  const { setAllItemsVisibility, toggleItemVisibility, setHighlightLayer, refreshLayer, zoomToLayerExtent, getLayerBounds } =
    useLayerStoreActions();
  const { enableFocusTrap } = useUIStoreActions();
  const { triggerGetAllFeatureInfo } = useDataTableStoreActions();
  const datatableSettings = useDataTableLayerSettings();
  const layersData = useDataTableAllFeaturesDataArray();
  const selectedLayer = layersData.find((_layer) => _layer.layerPath === layerDetails?.layerPath);
  const inVisibleRange = useSelectorLayerInVisibleRange(layerDetails?.layerPath);

  // Is highlight button disabled?
  const isLayerHighlightCapable = layerDetails.controls?.highlight ?? false;

  // Is zoom to extent button disabled?
  const isLayerZoomToExtentCapable = layerDetails.controls?.zoom ?? false;

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER DETAILS', selectedLayer, layerDetails);
    // TODO: refactor - remove timer!
    // Reason for timer:- when layer detail component is loaded, behind the scene we send query to fetch the features.
    // After component is rendered and fetching features is done, eventhough store is update, it never re rendered this component
    // thats why we need to update the state so that layers data is fetched again from store.
    let timer: NodeJS.Timeout;
    if (!selectedLayer) {
      setIsDataTableVisible(true);
    } else {
      timer = setTimeout(() => {
        setIsDataTableVisible(true);
      }, 100);
    }
    return () => {
      setIsDataTableVisible(false);
      if (timer) clearTimeout(timer);
    };
  }, [layersData, layerDetails, selectedLayer]);

  const handleZoomTo = (): void => {
    zoomToLayerExtent(layerDetails.layerPath).catch((error) => {
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
      triggerGetAllFeatureInfo(layerDetails.layerPath).catch((error) => {
        // Log
        logger.logPromiseFailed('Failed to triggerGetAllFeatureInfo in single-layer.handleLayerClick', error);
      });
    }
    enableFocusTrap({ activeElementId: 'layerDataTable', callbackElementId: `table-details` });
  };

  if (layerDetails.bounds === undefined || layerDetails.bounds![0] === Infinity) {
    const bounds = getLayerBounds(layerDetails.layerPath);
    if (bounds) layerDetails.bounds = bounds;
  }

  const handleRefreshLayer = (): void => {
    refreshLayer(layerDetails.layerPath);
  };

  const handleHighlightLayer = (): void => {
    setHighlightLayer(layerDetails.layerPath);
  };

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
        <IconButton disabled tooltip={t('layers.visibilityIsAlways') as string}>
          {' '}
          <CheckBoxIcon color="disabled" />{' '}
        </IconButton>
      );
    }

    return (
      <IconButton color="primary" onClick={() => toggleItemVisibility(layerDetails.layerPath, item)}>
        {item.isVisible === true ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
      </IconButton>
    );
  }

  function renderHeaderCheckbox(): JSX.Element {
    if (!layerDetails.canToggle) {
      return (
        <IconButton disabled>
          {' '}
          <CheckBoxIcon color="disabled" />{' '}
        </IconButton>
      );
    }

    return (
      <IconButton color="primary" onClick={() => setAllItemsVisibility(layerDetails.layerPath, !allItemsChecked())}>
        {allItemsChecked() ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
      </IconButton>
    );
  }

  function renderItems(): JSX.Element {
    return (
      <Grid container direction="column" spacing={0} sx={sxClasses.itemsGrid} justifyContent="left" justifyItems="stretch">
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
                <Box component="img" sx={{ alignSelf: 'center' }} alt={item.name} src={item.icon} />
              ) : (
                <BrowserNotSupportedIcon />
              )}
              <Box component="span" sx={sxClasses.tableIconLabel}>
                {item.name}
              </Box>
            </Grid>
          </Grid>
        ))}
      </Grid>
    );
  }

  function renderLayers(startLayer: TypeLegendLayer): JSX.Element {
    return (
      <List>
        {startLayer.children.map((layer) => (
          <Fragment key={layer.layerId}>
            <ListItem sx={{ padding: '6px 0px', borderTop: `1px solid ${theme.palette.geoViewColor.bgColor.dark[50]}` }}>
              <ListItemIcon>
                <LayerIcon layerPath={layer.layerPath} />
              </ListItemIcon>
              <ListItemText primary={layer.layerName} />
            </ListItem>
            {layer.children.length > 0 && <Box sx={{ paddingLeft: '30px', width: '100%' }}>{renderLayers(layer)}</Box>}
          </Fragment>
        ))}
      </List>
    );
  }

  function renderDetailsButton(): JSX.Element {
    if (layerDetails.controls?.table !== false)
      return (
        <IconButton id="table-details" tooltip={t('legend.tableDetails') as string} className="buttonOutline" onClick={handleOpenTable}>
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
          tooltip={t('legend.highlightLayer') as string}
          onClick={handleHighlightLayer}
          className={highlightedLayer === layerDetails.layerPath ? 'buttonOutline active' : 'buttonOutline'}
          disabled={!inVisibleRange}
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
          tooltip={t('legend.zoomTo') as string}
          onClick={handleZoomTo}
          className="buttonOutline"
          disabled={layerDetails.bounds === undefined || !inVisibleRange}
        >
          <ZoomInSearchIcon />
        </IconButton>
      );
    return <Box />;
  }

  function renderLayerButtons(): JSX.Element {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', marginLeft: 'auto' }}>
        {isDataTableVisible && datatableSettings[layerDetails.layerPath] && renderDetailsButton()}
        <IconButton tooltip={t('legend.refreshLayer') as string} className="buttonOutline" onClick={handleRefreshLayer}>
          <RestartAltIcon />
        </IconButton>
        {renderHighlightButton()}
        {renderZoomButton()}
      </Box>
    );
  }

  const getSubTitle = (): string | null => {
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
      layerDetails.type === 'ogcWms' &&
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
              <Typography sx={sxClasses.categoryTitle} title={layerDetails.layerName}>
                {layerDetails.layerName}
              </Typography>
              {getSubTitle() && <Typography sx={{ fontSize: theme.palette.geoViewFontSize.sm }}> {getSubTitle()} </Typography>}
            </Box>
            {renderLayerButtons()}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap-reverse' }}>
            {layerDetails.items.length > 1 && (
              <Grid container direction="row" alignItems="center" justifyItems="stretch">
                <Grid size={{ xs: 'auto' }}>{renderHeaderCheckbox()}</Grid>
                <Grid size={{ xs: 'auto' }}>
                  <Box component="span" sx={{ fontWeight: 'bold' }}>
                    {t('layers.toggleAllVisibility')}
                  </Box>
                </Grid>
              </Grid>
            )}
            {layerDetails.controls?.opacity !== false && <LayerOpacityControl layerDetails={layerDetails} />}
          </Box>
          <Divider sx={{ marginTop: '10px', marginBottom: '20px' }} variant="middle" />
          {renderWMSImage()}
          <Box>
            {layerDetails.items?.length > 0 && renderItems()}
            {layerDetails.children.length > 0 && (
              <>
                <Typography sx={{ fontWeight: 'bold', textAlign: 'left', margin: '10px 0px' }}>{t('layers.subLayersList')}</Typography>
                {renderLayers(layerDetails)}
              </>
            )}
          </Box>
          <Divider sx={{ marginTop: '20px', marginBottom: '10px' }} variant="middle" />
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
                    key={generateId()}
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
