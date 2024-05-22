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
import { useDataTableAllFeaturesDataArray } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { generateId } from '@/core/utils/utilities';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { LayerOpacityControl } from './layer-opacity-control/layer-opacity-control';
import { logger } from '@/core/utils/logger';

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
  const { setAllItemsVisibility, toggleItemVisibility, setHighlightLayer, zoomToLayerExtent, getLayerBounds } = useLayerStoreActions();
  const { openModal } = useUIStoreActions();
  const layersData = useDataTableAllFeaturesDataArray();
  const selectedLayer = layersData.find((_layer) => _layer.layerPath === layerDetails?.layerPath);

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
    zoomToLayerExtent(layerDetails.layerPath);
  };

  const handleOpenTable = (): void => {
    openModal({ activeElementId: 'layerDataTable', callbackElementId: `table-details` });
  };

  if (layerDetails.bounds === undefined || layerDetails.bounds![0] === Infinity) {
    const bounds = getLayerBounds(layerDetails.layerPath);
    if (bounds) layerDetails.bounds = bounds;
  }

  const handleRefreshLayer = (): void => {
    // TODO: Refresh the layer symbology on the map based on the selected symbology in the UI?
    logger.logDebug('Refresh is not implemented');
  };

  const handleHighlightLayer = (): void => {
    setHighlightLayer(layerDetails.layerPath);
  };

  const allItemsChecked = (): boolean => {
    return _.every(layerDetails.items, (i) => i.isVisible !== false);
  };

  function renderItemCheckbox(item: TypeLegendItem): JSX.Element | null {
    // no checkbox for simple style layers
    if (
      layerDetails.styleConfig?.LineString?.styleType === 'simple' ||
      layerDetails.styleConfig?.Point?.styleType === 'simple' ||
      layerDetails.styleConfig?.Polygon?.styleType === 'simple'
    ) {
      return null;
    }
    if (!layerDetails.canToggle) {
      return (
        <IconButton disabled tooltip="layers.visibilityIsAlways">
          {' '}
          <CheckBoxIcon color="disabled" />{' '}
        </IconButton>
      );
    }

    return (
      <IconButton color="primary" onClick={() => toggleItemVisibility(layerDetails.layerPath, item.geometryType, item.name)}>
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
        {layerDetails.items.length > 1 && (
          <Grid container direction="row" justifyContent="center" alignItems="stretch" justifyItems="stretch">
            <Grid item xs="auto">
              {renderHeaderCheckbox()}
            </Grid>
            <Grid item xs="auto">
              <Box component="span">{t('general.name')}</Box>
            </Grid>
          </Grid>
        )}
        {layerDetails.items.map((item) => (
          <Grid container direction="row" key={item.name} justifyContent="center" alignItems="stretch">
            <Grid item xs="auto">
              {renderItemCheckbox(item)}
            </Grid>
            <Grid item xs="auto">
              {item.icon ? <img alt={item.name} src={item.icon} /> : <BrowserNotSupportedIcon />}
              <Box component="span" style={sxClasses.tableIconLabel}>
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
                <LayerIcon layer={layer} />
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
        <IconButton id="table-details" tooltip="legend.tableDetails" className="style1" onClick={handleOpenTable}>
          <TableViewIcon />
        </IconButton>
      );
    return (
      <IconButton id="table-details" className="style1" disabled>
        <TableViewIcon color="disabled" />
      </IconButton>
    );
  }

  function renderHighlightButton(): JSX.Element {
    if (layerDetails.controls?.highlight !== false)
      return (
        <IconButton
          tooltip="legend.highlightLayer"
          onClick={handleHighlightLayer}
          className={highlightedLayer === layerDetails.layerPath ? 'style1 active' : 'style1'}
        >
          <HighlightOutlinedIcon />
        </IconButton>
      );
    return (
      <IconButton className="style1" disabled>
        <HighlightOutlinedIcon color="disabled" />
      </IconButton>
    );
  }

  function renderZoomButton(): JSX.Element {
    if (layerDetails.controls?.zoom !== false)
      return (
        <IconButton tooltip="legend.zoomTo" onClick={handleZoomTo} className="style1" disabled={layerDetails.bounds === undefined}>
          <ZoomInSearchIcon />
        </IconButton>
      );
    return (
      <IconButton className="style1" disabled>
        <ZoomInSearchIcon color="disabled" />
      </IconButton>
    );
  }

  function renderLayerButtons(): JSX.Element {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px' }}>
        {isDataTableVisible && selectedLayer?.features?.length && renderDetailsButton()}
        <IconButton tooltip="legend.refreshLayer" className="style1" onClick={handleRefreshLayer}>
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
            }}
          >
            <Box sx={{ textAlign: 'left', [theme.breakpoints.down('md')]: { display: 'none' } }}>
              <Typography sx={sxClasses.categoryTitle}> {layerDetails.layerName} </Typography>
              <Typography sx={{ fontSize: theme.palette.geoViewFontSize.sm }}> {getSubTitle()} </Typography>
            </Box>
            {renderLayerButtons()}
          </Box>
          {layerDetails.controls?.opacity !== false && (
            <Box sx={sxClasses.layerOpacityControlContainer}>
              <Box id="layerOpacity">
                <LayerOpacityControl layerDetails={layerDetails} />
              </Box>
            </Box>
          )}
          <Box sx={{ marginTop: '20px' }}>
            {layerDetails.items?.length > 0 && renderItems()}
            {layerDetails.children.length > 0 && (
              <>
                <Typography sx={{ fontWeight: 'bold', textAlign: 'left', margin: '10px 0px' }}>{t('layers.subLayersList')}</Typography>
                {renderLayers(layerDetails)}
              </>
            )}
          </Box>
          <Divider sx={{ marginTop: '50px', marginBottom: '10x' }} variant="middle" />
          {layerDetails.layerAttribution &&
            layerDetails.layerAttribution!.map((attribution) => {
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
            })}
        </>
      )}
    </Paper>
  );
}
