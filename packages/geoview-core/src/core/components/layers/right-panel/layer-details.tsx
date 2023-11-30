import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { TypeLegendLayer, TypeLegendLayerListItem } from '../types';
import { getSxClasses } from './layer-details-style';
import {
  Box,
  CheckBoxIcon,
  CheckBoxOutineBlankIcon,
  IconButton,
  Paper,
  SliderBase,
  Typography,
  ZoomInSearchIcon,
  Grid,
  RestartAltIcon,
  HighlightOutlinedIcon,
  TableViewIcon,
  BrowserNotSupportedIcon,
  Divider,
} from '@/ui';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { generateId } from '@/core/utils/utilities';

interface LayerDetailsProps {
  layerDetails: TypeLegendLayer;
}

export function LayerDetails(props: LayerDetailsProps): JSX.Element {
  const { layerDetails } = props;
  const { setAllItemsVisibility, toggleItemVisibility, setLayerOpacity } = useLayerStoreActions(); // get store actions
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const handleZoomTo = async () => {
    /* let bounds = await api.maps[mapId].layer.geoviewLayers[layerId].calculateBounds(path);
    let transformedBounds: Extent | undefined;
    if (bounds) transformedBounds = transformExtent(bounds, `EPSG:${api.maps[mapId].currentProjection}`, `EPSG:4326`);

    if (
      !bounds ||
      (transformedBounds &&
        transformedBounds[0] === -180 &&
        transformedBounds[1] === -90 &&
        transformedBounds[2] === 180 &&
        transformedBounds[3] === 90)
    )
      bounds = api.maps[mapId].getView().get('extent');

    if (bounds) api.maps[mapId].zoomToExtent(bounds); */
  };

  const handleOpenTable = async () => {
    console.log('opening table');
  };

  const handleRefreshLayer = async () => {
    console.log('refresh layer');
  };

  const handleHighlightLayer = async () => {
    console.log('refresh layer');
  };

  const handleSetOpacity = (opacityValue: number | number[]) => {
    const val = Array.isArray(opacityValue) ? opacityValue[0] : opacityValue;
    setLayerOpacity(layerDetails.layerPath, val / 100);
  };

  function renderOpacityControl() {
    return (
      <div style={{ padding: '16px 17px 16px 23px' }}>
        <Box sx={sxClasses.opacityMenu}>
          <Typography sx={{ fontWeight: 'bold' }}>{t('legend.opacity')}</Typography>
          <SliderBase min={0} max={100} value={(layerDetails.opacity ? layerDetails.opacity : 1) * 100} customOnChange={handleSetOpacity} />
        </Box>
      </div>
    );
  }

  function renderItemCheckbox(item: TypeLegendLayerListItem) {
    if (item.isVisible === 'always') {
      return null;
    }

    return (
      <IconButton color="primary" onClick={() => toggleItemVisibility(layerDetails.layerPath, item.geometryType, item.name)}>
        {item.isVisible === 'yes' ? <CheckBoxIcon /> : <CheckBoxOutineBlankIcon />}
      </IconButton>
    );
  }

  function renderItems() {
    return (
      <Grid container direction="column" spacing={0} sx={sxClasses.itemsGrid} justifyContent="left" justifyItems="stretch">
        <Grid container direction="row" justifyContent="center" alignItems="stretch" justifyItems="stretch">
          <Grid item xs="auto">
            <IconButton
              color="primary"
              onClick={() => setAllItemsVisibility(layerDetails.layerPath, !layerDetails.allItemsChecked ? 'yes' : 'no')}
            >
              {layerDetails.allItemsChecked ? <CheckBoxIcon /> : <CheckBoxOutineBlankIcon />}
            </IconButton>
          </Grid>
          <Grid item xs="auto">
            <span>{t('general.name')}</span>
          </Grid>
        </Grid>
        {layerDetails.items.map((item) => (
          <Grid container direction="row" key={item.name} justifyContent="center" alignItems="stretch">
            <Grid item xs="auto">
              {renderItemCheckbox(item)}
            </Grid>
            <Grid item xs="auto">
              {item.icon ? <img alt={item.name} src={item.icon} /> : <BrowserNotSupportedIcon />}
              <span style={sxClasses.tableIconLabel}>
                {item.name} {item.isVisible}
              </span>
            </Grid>
          </Grid>
        ))}
      </Grid>
    );
  }

  function renderLayerButtons() {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <IconButton tooltip="legend.table_details" sx={{ backgroundColor: '#F6F6F6' }} onClick={handleOpenTable}>
          <TableViewIcon />
        </IconButton>
        <IconButton tooltip="legend.refresh_layer" sx={{ backgroundColor: '#F6F6F6' }} onClick={handleRefreshLayer}>
          <RestartAltIcon />
        </IconButton>
        <IconButton tooltip="legend.highlight_layer" sx={{ backgroundColor: '#F6F6F6' }} onClick={handleHighlightLayer}>
          <HighlightOutlinedIcon />
        </IconButton>
        <IconButton tooltip="legend.zoom_to" onClick={handleZoomTo} sx={{ backgroundColor: '#F6F6F6' }}>
          <ZoomInSearchIcon />
        </IconButton>
      </Box>
    );
  }

  // function renderItems

  return (
    <Paper sx={sxClasses.layerDetails}>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={sxClasses.categoryTitle}> {layerDetails.layerName} </Typography>
          <Typography sx={{ fontSize: '0.8em' }}> {`${layerDetails.items.length} items available`} </Typography>
        </Box>
        {renderLayerButtons()}
      </Box>
      {renderOpacityControl()}
      <Box sx={{ marginTop: '20px' }}>{renderItems()}</Box>
      <Divider sx={{ marginTop: '50px' }} variant="middle" />
      {layerDetails.layerAttribution!.map((attribution) => {
        return <Typography key={generateId()}>{attribution.indexOf('©') === -1 ? `© ${attribution}` : attribution}</Typography>;
      })}
    </Paper>
  );
}
