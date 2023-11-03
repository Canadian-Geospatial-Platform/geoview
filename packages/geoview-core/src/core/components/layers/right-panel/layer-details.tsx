import { useTheme, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { TypeLegendLayer } from '../types';
import { getSxClasses } from '../layers-style';
import { Box, CheckBoxIcon, CheckBoxOutIcon, IconButton, Paper, SliderBase, Typography, ZoomInSearchIcon } from '@/ui';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';

interface LayerDetailsProps {
  layerDetails: TypeLegendLayer;
}

export function LayerDetails(props: LayerDetailsProps): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation<string>();
  const { layerDetails } = props;
  const { setAllItemsVisibility, toggleItemVisibility, setLayerOpacity } = useLayerStoreActions();

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
      <TableContainer>
        <Table sx={sxClasses.rightPanel.table}>
          <TableHead>
            <TableRow sx={sxClasses.rightPanel.tableHeader}>
              <TableCell>
                <IconButton color="primary" onClick={() => setAllItemsVisibility(layerDetails.layerPath, !layerDetails.allItemsChecked)}>
                  {layerDetails.allItemsChecked ? <CheckBoxIcon /> : <CheckBoxOutIcon />}
                </IconButton>
              </TableCell>
              <TableCell>Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {layerDetails.items.map((item) => (
              <TableRow key={item.name} sx={sxClasses.rightPanel.tableRow}>
                <TableCell>
                  <IconButton color="primary" onClick={() => toggleItemVisibility(layerDetails.layerPath, item.name)}>
                    {item.isChecked ? <CheckBoxIcon /> : <CheckBoxOutIcon />}
                  </IconButton>
                </TableCell>
                <TableCell>
                  <img alt={item.name} src={item.icon} />
                  <span style={sxClasses.rightPanel.tableIconLabel}>{item.name}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
        <div>
          <IconButton onClick={handleZoomTo} sx={{ backgroundColor: '#F6F6F6' }}>
            <ZoomInSearchIcon />
          </IconButton>
        </div>
      </Box>
      {renderOpacityControl()}
      <Box sx={{ marginTop: '20px' }}>{renderItems()}</Box>
    </Paper>
  );
}
