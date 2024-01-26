import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import _ from 'lodash';
import { TypeLegendLayer, TypeLegendItem } from '../types';
import { getSxClasses } from './layer-details-style';
import {
  Box,
  CheckBoxIcon,
  CheckBoxOutineBlankIcon,
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
import { generateId } from '@/core/utils/utilities';
import { LayerIcon } from '../layer-icon';
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

  // get store actions
  const highlightedLayer = useLayerHighlightedLayer();
  const { setAllItemsVisibility, toggleItemVisibility, setHighlightLayer, zoomToLayerExtent, getLayerBounds } = useLayerStoreActions();
  const { openModal } = useUIStoreActions();

  const handleZoomTo = () => {
    zoomToLayerExtent(layerDetails.layerPath);
  };

  const handleOpenTable = () => {
    openModal({ activeElementId: 'layerDatatable', callbackElementId: `table-details` });
  };

  if (layerDetails.bounds === undefined || layerDetails.bounds![0] === Infinity) {
    const bounds = getLayerBounds(layerDetails.layerPath);
    if (bounds) layerDetails.bounds = bounds;
  }

  const handleRefreshLayer = () => {
    // eslint-disable-next-line no-console
    console.log('refresh layer');
  };

  const handleHighlightLayer = () => {
    setHighlightLayer(layerDetails.layerPath);
  };

  const getSubTitle = () => {
    if (layerDetails.children.length > 0) {
      return t('legend.subLayersCount').replace('{count}', layerDetails.children.length.toString());
    }
    const count = layerDetails.items.filter((d) => d.isVisible !== 'no').length;
    const totalCount = layerDetails.items.length;
    return t('legend.itemsCount').replace('{count}', count.toString()).replace('{totalCount}', totalCount.toString());
  };

  const allItemsChecked = () => {
    return _.every(layerDetails.items, (i) => ['yes', 'always'].includes(i.isVisible!));
  };

  function renderItemCheckbox(item: TypeLegendItem) {
    // no checkbox for simple style layers
    if (
      layerDetails.styleConfig?.LineString?.styleType === 'simple' ||
      layerDetails.styleConfig?.Point?.styleType === 'simple' ||
      layerDetails.styleConfig?.Polygon?.styleType === 'simple'
    ) {
      return null;
    }
    if (item.isVisible === 'always' || layerDetails.isVisible === 'always' || !layerDetails.canToggle) {
      return (
        <IconButton disabled tooltip="layers.visibilityIsAlways">
          {' '}
          <CheckBoxIcon color="disabled" />{' '}
        </IconButton>
      );
    }

    return (
      <IconButton color="primary" onClick={() => toggleItemVisibility(layerDetails.layerPath, item.geometryType, item.name)}>
        {item.isVisible === 'yes' ? <CheckBoxIcon /> : <CheckBoxOutineBlankIcon />}
      </IconButton>
    );
  }

  function renderHeaderCheckbox() {
    const containsDisabled = _.some(layerDetails.items, (i) => i.isVisible === 'always');
    if (layerDetails.isVisible === 'always' || !layerDetails.canToggle || containsDisabled) {
      return (
        <IconButton disabled>
          {' '}
          <CheckBoxIcon color="disabled" />{' '}
        </IconButton>
      );
    }

    return (
      <IconButton color="primary" onClick={() => setAllItemsVisibility(layerDetails.layerPath, !allItemsChecked() ? 'yes' : 'no')}>
        {allItemsChecked() ? <CheckBoxIcon /> : <CheckBoxOutineBlankIcon />}
      </IconButton>
    );
  }

  function renderItems() {
    return (
      <Grid container direction="column" spacing={0} sx={sxClasses.itemsGrid} justifyContent="left" justifyItems="stretch">
        {layerDetails.items.length > 1 && (
          <Grid container direction="row" justifyContent="center" alignItems="stretch" justifyItems="stretch">
            <Grid item xs="auto">
              {renderHeaderCheckbox()}
            </Grid>
            <Grid item xs="auto">
              <span>{t('general.name')}</span>
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
              <span style={sxClasses.tableIconLabel}>{item.name}</span>
            </Grid>
          </Grid>
        ))}
      </Grid>
    );
  }

  function renderLayers(startLayer: TypeLegendLayer) {
    return (
      <List>
        {startLayer.children.map((layer) => (
          <Fragment key={layer.layerId}>
            <ListItem sx={{ padding: '6px 0px', borderTop: '1px solid #ccc' }}>
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

  function renderLayerButtons() {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px' }}>
        {layerDetails.items.length > 0 && (
          <IconButton id="table-details" tooltip="legend.tableDetails" sx={{ backgroundColor: theme.palette.geoViewColors.layersRoundButtonsBg }} onClick={handleOpenTable}>
            <TableViewIcon />
          </IconButton>
        )}
        <IconButton tooltip="legend.refreshLayer" sx={{ backgroundColor: theme.palette.geoViewColors.layersRoundButtonsBg }} onClick={handleRefreshLayer}>
          <RestartAltIcon />
        </IconButton>
        <IconButton
          tooltip="legend.highlightLayer"
          sx={{ backgroundColor: layerDetails.layerPath !== highlightedLayer ? theme.palette.geoViewColors.layersRoundButtonsBg : theme.palette.action.active }}
          onClick={handleHighlightLayer}
        >
          <HighlightOutlinedIcon />
        </IconButton>
        <IconButton
          tooltip="legend.zoomTo"
          onClick={handleZoomTo}
          sx={{ backgroundColor: theme.palette.geoViewColors.layersRoundButtonsBg }}
          disabled={layerDetails.bounds === undefined}
        >
          <ZoomInSearchIcon />
        </IconButton>
      </Box>
    );
  }

  // Render
  return (
    <Paper sx={sxClasses.layerDetails}>
      {layerDetails !== undefined && (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Box sx={{ textAlign: 'left' }}>
              <Typography sx={sxClasses.categoryTitle}> {layerDetails.layerName} </Typography>
              <Typography sx={{ fontSize: '0.8em' }}> {getSubTitle()} </Typography>
            </Box>
            {renderLayerButtons()}
          </Box>
          <LayerOpacityControl layerDetails={layerDetails} />
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
                <Typography sx={{ marginTop: '10px', color: '#808080', fontSize: '0.8em' }} key={generateId()}>
                  {attribution.indexOf('©') === -1 ? `© ${attribution}` : attribution}
                </Typography>
              );
            })}
        </>
      )}
    </Paper>
  );
}
