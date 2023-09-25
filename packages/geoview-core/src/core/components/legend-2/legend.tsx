/* eslint-disable react/jsx-no-constructed-context-values */
import { styled } from '@mui/material';
import { useState } from 'react';
import { TypeLegendProps, TypeLegendItemProps } from './types';
import { api } from '@/app';
import { LegendItemDetails } from './legend-item-details/legend-item-details';
import { LegendItem } from './legend-item'
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { Box, Grid, List, ExpandMoreIcon } from '@/ui';
import {ShowSelectedLayers} from './selected-layers/selected-layers-details'

export interface LegendProps extends TypeLegendProps {
  mapId: string;
}

const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#262B32' : '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: 4,
}));

export function Legend2(props: LegendProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;
  const [selectedLayer, setSelectedLayer] = useState<TypeLegendItemProps | null>(null);
  const [isSelectedLayersClicked, setIsSelectedLayersClicked] = useState(false);

  const handleBoxClick = () => {
    setIsSelectedLayersClicked(!isSelectedLayersClicked);
    setSelectedLayer(null);
  };

  const onOpenDetails = function (layerId: string, layerConfigEntry: TypeLayerEntryConfig | undefined): void {
    const geoviewLayerInstance = api.maps[mapId].layer.geoviewLayers[layerId];

    const det: TypeLegendItemProps = {
      layerId,
      subLayerId: undefined,
      geoviewLayerInstance,
      layerConfigEntry,
      isRemoveable,
      canSetOpacity,
    };
    setSelectedLayer(null);
    setTimeout(() => {
      setSelectedLayer(det);
      setIsSelectedLayersClicked(false);
    }, 500);
  };

  api.event.emit({ handlerName: `${mapId}/$LegendsLayerSet$`, event: api.eventNames.GET_LEGENDS.TRIGGER });
  
  
  function showSelectedLayersPanel() {
    return (
        <Box
          onClick={handleBoxClick}
          sx={{display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            margin: '20px',
            cursor: 'pointer',
          }}
        >
          Selected Layers
          <ExpandMoreIcon sx={{ transform: 'rotate(270deg)'}}/>
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
            onOpenDetails={(_layerId: string, _layerConfigEntry: TypeLayerEntryConfig | undefined) =>
            onOpenDetails(_layerId, _layerConfigEntry)
            }
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
      return (
        <ShowSelectedLayers
        layerNames= {undefined}
        layerIds={layerIds}
        />
      );
    } else if (selectedLayer) {
      return <LegendItemDetails {...selectedLayer} />;
    }
  
    return null;
  }

    return (
    <Box sx={{ px: '20px', pb: '20px', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: '10px' }}>Legend Overview</h2>
      <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4, md: 8 }}>
        <Grid item xs={12} sm={6}>
          <Item> {leftPanel()}</Item>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Item>{rightPanel()}</Item>
        </Grid>
      </Grid>
    </Box>
  );
}