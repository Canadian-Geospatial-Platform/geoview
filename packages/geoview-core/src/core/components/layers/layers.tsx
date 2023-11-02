import { Button, styled, useTheme } from '@mui/material';
import React, { useEffect } from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { api } from '@/app';
import { LegendItemsDetailsProps, TypeLegendItemProps } from './types';
import { AddIcon, Box, Grid, List, Typography, Stack, ExpandIcon } from '@/ui';
import { LayerDetails } from './right-panel/layer-details';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { SingleLayer } from './left-panel/single-layer';
import { getSxClasses } from './layers-style';
// import { useLegendHelpers } from './hooks/helpers';

const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#262B32' : '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: 4,
}));

export function Layers(props: LegendItemsDetailsProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Populating fake legend data
  // const helpers = useLegendHelpers(mapId);
  // helpers.populateLegendStoreWithFakeData();

  const store = getGeoViewStore(mapId);
  // controls what is displayed on the right panel
  const selectedLegendItem = useStore(store, (state) => state.legendState.selectedItem);

  const legendLayers: TypeLegendItemProps[] = layerIds
    .filter((layerId) => api.maps[mapId].layer.geoviewLayers[layerId])
    .map((layerId) => {
      const geoviewLayerInstance = api.maps[mapId].layer.geoviewLayers[layerId];

      const propsForComponents: TypeLegendItemProps = {
        layerId,
        geoviewLayerInstance,
        isRemoveable,
        canSetOpacity,
        expandAll,
        hideAll,
      };

      return propsForComponents;
    });

  useEffect(() => {
    if (!selectedLegendItem && legendLayers) {
      store.setState({
        legendState: { ...store.getState().legendState, selectedItem: legendLayers[0] },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buttonsMenu() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div>
          <Typography sx={sxClasses.categoryTitle}>{t('general.layers')}</Typography>
        </div>
        <Stack style={{ alignItems: 'center', gap: '15px' }} direction="row">
          <Button
            variant="contained"
            size="small"
            sx={{ backgroundColor: '#F4F5FF' }}
            startIcon={<ExpandIcon fontSize="small" sx={{ color: '#515BA5' }} />}
          >
            <Typography sx={sxClasses.legendButtonText}>{t('legend.re-arrange')}</Typography>
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ backgroundColor: '#F4F5FF' }}
            startIcon={<AddIcon fontSize="small" sx={{ color: '#515BA5' }} />}
          >
            <Typography sx={sxClasses.legendButtonText}>{t('legend.add_layer')}</Typography>
          </Button>
        </Stack>
      </Box>
    );
  }

  const leftPanel = () => {
    const legendItems = legendLayers.map((details) => {
      return (
        <SingleLayer
          key={`layerKey-${details.layerId}`}
          layerId={details.layerId}
          geoviewLayerInstance={details.geoviewLayerInstance}
          isRemoveable={details.isRemoveable}
          canSetOpacity={details.canSetOpacity}
          expandAll={details.expandAll}
          hideAll={details.hideAll}
        />
      );
    });

    return (
      <div>
        {buttonsMenu()}
        <List sx={sxClasses.list}>{legendItems}</List>
      </div>
    );
  };

  const rightPanel = () => {
    if (selectedLegendItem) {
      return (
        <Item>
          <LayerDetails
            key={`layerKey-${selectedLegendItem.layerId}`}
            layerId={selectedLegendItem.layerId}
            geoviewLayerInstance={selectedLegendItem?.geoviewLayerInstance}
            isRemoveable={selectedLegendItem.isRemoveable}
            canSetOpacity={selectedLegendItem.canSetOpacity}
            expandAll={selectedLegendItem.expandAll}
            hideAll={selectedLegendItem?.hideAll}
            isParentVisible={selectedLegendItem.geoviewLayerInstance.getVisible(selectedLegendItem.layerConfigEntry!)}
          />
        </Item>
      );
    }

    return null;
  };

  return (
    <Box sx={sxClasses.legendContainer}>
      <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={12}>
        <Grid item xs={12} sm={6}>
          {leftPanel()}
        </Grid>
        <Grid item xs={12} sm={6}>
          {rightPanel()}
        </Grid>
      </Grid>
    </Box>
  );
}
