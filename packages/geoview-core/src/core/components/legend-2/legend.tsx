import { Button, FormControlLabel, FormGroup, styled, useTheme } from '@mui/material';
import React from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { api } from '@/app';
import { LegendItemsDetailsProps } from './types';
import { AddIcon, Box, Checkbox, Grid, List, Typography } from '@/ui';
import { LegendItemDetails } from './legend-item-details/legend-item-details';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { LegendItem } from './legend-item';

const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#262B32' : '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: 4,
}));

export function Legend2(props: LegendItemsDetailsProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;
  api.event.emit({ handlerName: `${mapId}/LegendsLayerSet`, event: api.eventNames.GET_LEGENDS.TRIGGER });

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
      font: theme.footerPanel.titleFont,
      marginBottom: '10px',
    },
  };

  const store = getGeoViewStore(mapId);
  const selectedLegendItem = useStore(store, (state) => state.legendState.selectedItem);

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
        <List sx={{ width: '100%' }}>{legendItems}</List>
      </div>
    );
  };

  return (
    <Box sx={sxClasses.legendContainer}>
      <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4, md: 8 }}>
        <Grid item xs={12} sm={6}>
          <Typography sx={sxClasses.legendTitle}>{t('legend.overview_title')}</Typography>

          <FormGroup sx={{ fontSize: '0.8em' }}>
            <FormControlLabel control={<Checkbox color="primary" size="small" />} label={t('legend.sort_layers')} />
          </FormGroup>

          {leftPanel()}

          <Button sx={{ marginTop: '20px' }} variant="contained" size="small" color="primary" startIcon={<AddIcon fontSize="small" />}>
            {t('legend.add_layer')}
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          {selectedLegendItem && (
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
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
