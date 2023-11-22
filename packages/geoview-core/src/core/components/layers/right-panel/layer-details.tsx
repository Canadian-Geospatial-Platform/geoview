import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { TypeLegendLayer } from '../types';
import { getSxClasses } from '../layers-style';
import {
  Box,
  CheckBoxIcon,
  CheckBoxOutIcon,
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
} from '@/ui';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';

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

  const handleSetOpacity = (opacityValue: number | number[]) => {
    const val = Array.isArray(opacityValue) ? opacityValue[0] : opacityValue;
    setLayerOpacity(layerDetails.layerPath, val / 100);
  };

  function renderOpacityControl() {
    return (
      <div style={{ padding: '16px 17px 16px 23px' }}>
        <Box sx={sxClasses.rightPanel.opacityMenu}>
          <Typography sx={{ fontWeight: 'bold' }}>{t('legend.opacity')}</Typography>
          <SliderBase min={0} max={100} value={(layerDetails.opacity ? layerDetails.opacity : 1) * 100} customOnChange={handleSetOpacity} />
        </Box>
      </div>
    );
  }

  function renderItems() {
    return (
      <Grid container direction="column" spacing={0} sx={sxClasses.rightPanel.itemsGrid} justifyContent="left" justifyItems="stretch">
        <Grid container direction="row" justifyContent="center" alignItems="stretch" justifyItems="stretch">
          <Grid item xs="auto">
            <IconButton
              color="primary"
              onClick={() => setAllItemsVisibility(layerDetails.layerPath, !layerDetails.allItemsChecked ? 'yes' : 'no')}
            >
              {layerDetails.allItemsChecked ? <CheckBoxIcon /> : <CheckBoxOutIcon />}
            </IconButton>
          </Grid>
          <Grid item xs="auto">
            <span>{t('general.name')}</span>
          </Grid>
        </Grid>
        {layerDetails.items.map((item) => (
          <Grid container direction="row" key={item.name} justifyContent="center" alignItems="stretch">
            <Grid item xs="auto">
              <IconButton color="primary" onClick={() => toggleItemVisibility(layerDetails.layerPath, item.geometryType, item.name)}>
                {item.isVisible ? <CheckBoxIcon /> : <CheckBoxOutIcon />}
              </IconButton>
            </Grid>
            <Grid item xs="auto">
              {item.icon ? <img alt={item.name} src={item.icon} /> : <BrowserNotSupportedIcon />}
              <span style={sxClasses.rightPanel.tableIconLabel}>{item.name}</span>
            </Grid>
          </Grid>
        ))}
      </Grid>
    );
  }

  function renderLayerButtons() {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <IconButton sx={{ backgroundColor: '#F6F6F6' }}>
          <TableViewIcon />
        </IconButton>
        <IconButton sx={{ backgroundColor: '#F6F6F6' }}>
          <RestartAltIcon />
        </IconButton>
        <IconButton sx={{ backgroundColor: '#F6F6F6' }}>
          <HighlightOutlinedIcon />
        </IconButton>
        <IconButton onClick={handleZoomTo} sx={{ backgroundColor: '#F6F6F6' }}>
          <ZoomInSearchIcon />
        </IconButton>
      </Box>
    );
  }

  // function renderItems

  return (
    <Paper sx={sxClasses.rightPanel.layerDetails}>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Box sx={{ textAlign: 'left' }}>
          <Typography sx={sxClasses.categoryTitle}> {layerDetails.layerName} </Typography>
          <Typography sx={{ fontSize: '0.8em' }}> {`${layerDetails.items.length} items available`} </Typography>
        </Box>
        {renderLayerButtons()}
      </Box>
      {renderOpacityControl()}
      <Box sx={{ marginTop: '20px' }}>{renderItems()}</Box>
    </Paper>
  );
}
