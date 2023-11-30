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
import { useLayerHighlightedLayer, useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { generateId } from '@/core/utils/utilities';

interface LayerDetailsProps {
  layerDetails: TypeLegendLayer;
}

export function LayerDetails(props: LayerDetailsProps): JSX.Element {
  const { layerDetails } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store actions
  const highlightedLayer = useLayerHighlightedLayer();
  const { setAllItemsVisibility, toggleItemVisibility, setLayerOpacity, setHighlightLayer, zoomToLayerExtent } = useLayerStoreActions();
  const { openModal } = useUIStoreActions();

  const handleZoomTo = () => {
    zoomToLayerExtent(layerDetails.layerPath);
  };

  const handleOpenTable = () => {
    openModal({ activeElementId: 'layerDatatable', callbackElementId: `table-details` });
  };

  const handleRefreshLayer = () => {
    console.log('refresh layer');
  };

  const handleHighlightLayer = () => {
    setHighlightLayer(layerDetails.layerPath);
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
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px' }}>
        <IconButton id="table-details" tooltip="legend.tableDetails" sx={{ backgroundColor: '#F6F6F6' }} onClick={handleOpenTable}>
          <TableViewIcon />
        </IconButton>
        <IconButton tooltip="legend.refreshLayer" sx={{ backgroundColor: '#F6F6F6' }} onClick={handleRefreshLayer}>
          <RestartAltIcon />
        </IconButton>
        <IconButton
          tooltip="legend.highlightLayer"
          sx={{ backgroundColor: layerDetails.layerPath !== highlightedLayer ? '#F6F6F6' : theme.palette.action.active }}
          onClick={handleHighlightLayer}
        >
          <HighlightOutlinedIcon />
        </IconButton>
        <IconButton tooltip="legend.zoomTo" onClick={handleZoomTo} sx={{ backgroundColor: '#F6F6F6' }}>
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
