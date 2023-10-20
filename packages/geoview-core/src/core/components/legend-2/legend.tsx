import { Button, styled, useTheme, Table } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { api } from '@/app';
import { LegendItemsDetailsProps } from './types';
import { AddIcon, Box, Grid, List, Typography, ExpandMoreIcon, Paper, Stack, ExpandIcon } from '@/ui';
import { LegendItemDetails } from './legend-item-details/legend-item-details';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { LegendItem } from './legend-item';
import { getSxClasses } from './legend-style';

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

  const store = getGeoViewStore(mapId);
  const selectedLegendItem = useStore(store, (state) => state.legendState.selectedItem);
  const selectedLayers = useStore(store, (state) => state.legendState.selectedLayers);
  const [isSelectedLayersClicked, setIsSelectedLayersClicked] = useState(false);
  const [collapsedParents, setCollapsedParents] = useState<{ [key: string]: boolean }>({});

  const toggleCollapse = (parentLayer: string) => {
    setCollapsedParents((prevCollapsedParents) => ({
      ...prevCollapsedParents,
      [parentLayer]: !prevCollapsedParents[parentLayer],
    }));
  };

  function showSelectedLayersPanel() {
    return (
      <Paper
        onClick={() => setIsSelectedLayersClicked(!isSelectedLayersClicked)}
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

  useEffect(() => {
    if (selectedLegendItem) {
      setIsSelectedLayersClicked(false);
    }
  }, [selectedLegendItem]);

  const rightPanel = () => {
    if (isSelectedLayersClicked && selectedLayers) {
      const numItems = Object.values(selectedLayers).reduce((total, childLayers) => total + childLayers.length, 0);
      const selectedLayersList = Object.entries(selectedLayers).map(([parentLayer, childLayers]) => (
        <div
          key={parentLayer}
          role="button"
          tabIndex={0}
          onClick={() => toggleCollapse(parentLayer)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              toggleCollapse(parentLayer);
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px 2px 4px' }}>
            {parentLayer}
            {collapsedParents[parentLayer] ? <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} /> : <ExpandMoreIcon />}
          </div>
          <div style={{ padding: '2px 5px 2px 4px' }}>
            {!collapsedParents[parentLayer] &&
              childLayers.map((childLayer) => (
                <Table key={childLayer.layer} sx={{ border: '1px solid #C1C1C1', textAlign: 'left' }}>
                  {childLayer.icon ? <img src={childLayer.icon} alt="Layer Icon" /> : null}
                  {childLayer.layer}
                </Table>
              ))}
          </div>
        </div>
      ));

      return (
        <Item sx={{ borderColor: 'primary.main', borderStyle: 'solid', borderWidth: '1px', paddingLeft: '10px' }}>
          <Typography sx={sxClasses.legendTitle}>
            <strong>{t('legend.bold_selection')}</strong> {t('legend.overview_title')}
          </Typography>
          <Typography sx={{ fontSize: '0.6em', textAlign: 'left', marginBottom: '16.5px' }}>
            {numItems} {t('legend.items_available')}
          </Typography>
          {selectedLayersList}
        </Item>
      );
    }

    if (selectedLegendItem) {
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
