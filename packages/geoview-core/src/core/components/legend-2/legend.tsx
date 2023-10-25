import { Button, styled, useTheme } from '@mui/material';
import React from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { api } from '@/app';
import { LegendItemsDetailsProps } from './types';
import { AddIcon, Box, Grid, List, Typography, ExpandMoreIcon, Paper, Stack, ExpandIcon } from '@/ui';
import { LegendItemDetails } from './legend-item-details/legend-item-details';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { LegendItem } from './legend-item';
import { getSxClasses } from './legend-style';
import { LegendOverview } from './legend-overview/legend-overview';
import { useLegendHelpers } from './helpers';

const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#262B32' : '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: 4,
}));

export function Legend2(props: LegendItemsDetailsProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Populatig fake legend data
  const helpers = useLegendHelpers(mapId);
  helpers.populateLegendStoreWithFakeData();

  const store = getGeoViewStore(mapId);
  // controls what is displayed on the right panel
  const currentRightPanelDisplay = useStore(store, (state) => state.legendState.currentRightPanelDisplay);
  const selectedLegendItem = useStore(store, (state) => state.legendState.selectedItem);
  const selectedLayers = useStore(store, (state) => state.legendState.selectedLayers);

  function showLegendOverview() {
    store.setState({
      legendState: { ...store.getState().legendState, currentRightPanelDisplay: 'overview' },
    });
  }

  function showSelectedLayersPanel() {
    return (
      <Paper
        onClick={() => showLegendOverview()}
        sx={{
          justifyContent: 'space-between',
          padding: '9px 17px 10px 57px',
          alignItems: 'center',
          marginBottom: '27px',
          display: 'flex',
          flexDirection: 'row',
          cursor: 'pointer',
        }}
      >
        <div>
          <Typography sx={sxClasses.legendTitle}>{t('legend.overview_title')}</Typography>
          <Typography sx={{ fontSize: '0.6em' }}>{t('legend.selected_Layers')}</Typography>
        </div>
        <div>
          <ExpandMoreIcon sx={{ transform: 'rotate(270deg)' }} />
        </div>
      </Paper>
    );
  }

  function buttonsMenu() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div>
          <Typography sx={sxClasses.categoryTitle}>{t('legend.categories_title')}</Typography>
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
    const legendItems = layerIds
      .filter((layerId) => api.maps[mapId].layer.geoviewLayers[layerId])
      .map((layerId) => {
        const geoviewLayerInstance = api.maps[mapId].layer.geoviewLayers[layerId];

        return (
          <LegendItem
            key={`layerKey-${layerId}`}
            layerId={layerId}
            geoviewLayerInstance={geoviewLayerInstance}
            isRemoveable={isRemoveable}
            canSetOpacity={canSetOpacity}
            expandAll={expandAll}
            hideAll={hideAll}
          />
        );
      });

    return (
      <div>
        {showSelectedLayersPanel()}
        {buttonsMenu()}
        <List sx={{ width: '100%' }}>{legendItems}</List>
      </div>
    );
  };

  const rightPanel = () => {
    if (currentRightPanelDisplay === 'overview' && selectedLayers) {
      return <LegendOverview mapId={mapId} />;
    }

    if (currentRightPanelDisplay === 'layer-details' && selectedLegendItem) {
      return (
        <Item>
          <LegendItemDetails
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
      <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4, md: 8 }}>
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
