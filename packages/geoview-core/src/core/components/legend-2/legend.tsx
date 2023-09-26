import { Button, FormControlLabel, FormGroup, styled, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { api } from '@/app';
import { LegendItemsDetailsProps } from './types';
import { AddIcon, Box, Checkbox, Grid, List, Typography, ExpandMoreIcon } from '@/ui';
import { LegendItemDetails } from './legend-item-details/legend-item-details';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { LegendItem } from './legend-item';
import { ShowSelectedLayers } from './selected-layers/selected-layers-details';

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
  const sxClasses = {
    legendContainer: {
      background: theme.footerPanel.contentBg,
      boxShadow: theme.footerPanel.contentShadow,
      padding: '40px 20px 20px 20px',
      display: 'flex',
      flexDirection: 'column',
    },
    legendTitle: {
      textAlign: 'left',
      fontFamily: 'Open Sans, Semibold',
      fontSize: '18px',
    },
    categoryTitle: {
      textAlign: 'left',
      fontFamily: 'Open Sans, Semibold',
      fontSize: '20px',
    },
    legendButtonText: {
      fontFamily: 'Open Sans, Semibold',
      color: '#515BA5',
      fontSize: '16px',
    },
  };

  const store = getGeoViewStore(mapId);
  const selectedLegendItem = useStore(store, (state) => state.legendState.selectedItem);
  const [isSelectedLayersClicked, setIsSelectedLayersClicked] = useState(false);

  const handleBoxClick = () => {
    setIsSelectedLayersClicked(!isSelectedLayersClicked);
  };

  function showSelectedLayersPanel() {
    return (
      <Box
        onClick={handleBoxClick}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          margin: '20px',
          cursor: 'pointer',
        }}
      >
        Selected Layers
        <ExpandMoreIcon sx={{ transform: 'rotate(270deg)' }} />
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
        <List sx={{ width: '100%' }}>{legendItems}</List>
      </div>
    );
  };

  function rightPanel() {
    if (isSelectedLayersClicked) {
      return <ShowSelectedLayers />;
    }
    if (selectedLegendItem) {
      return (
        <>
          <Typography sx={sxClasses.legendTitle}>{t('legend.selected_legend')}</Typography>
          <Item>
            <LegendItemDetails
              key={`layerKey-${selectedLegendItem.layerId}`}
              layerId={selectedLegendItem.layerId}
              geoviewLayerInstance={selectedLegendItem?.geoviewLayerInstance}
              isRemoveable={selectedLegendItem.isRemoveable}
              canSetOpacity={selectedLegendItem.canSetOpacity}
              expandAll={selectedLegendItem.expandAll}
              hideAll={selectedLegendItem?.hideAll}
            />
          </Item>
        </>
      );
    }

    return null;
  }

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
