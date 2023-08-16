/* eslint-disable react/jsx-no-constructed-context-values */
import { styled } from '@mui/material';
import { useState } from 'react';
import { TypeLegendProps } from './legend-api';
import { api } from '@/app';
import { LegendItem } from './legend-item';
import { LegendItemDetails } from './legend-item-details';
import { List, Grid } from '@/ui';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { TypeLegendItemProps } from './types';

export interface LegendProps extends TypeLegendProps {
  mapId: string;
}

const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#262B32' : '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: 4,
}));

export function Legend(props: LegendProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;
  const [selectedLayer, setSelectedLayer] = useState<TypeLegendItemProps | null>(null);

  const onOpenDetails = function (layerId: string, layerConfigEntry: TypeLayerEntryConfig | undefined): void {
    console.log(`legend is open layerId: ${layerId},`, layerConfigEntry);
    const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId];

    const det: TypeLegendItemProps = {
      layerId,
      subLayerId: undefined,
      geoviewLayerInstance,
      layerConfigEntry,
      isRemoveable,
      canSetOpacity,
    };

    setSelectedLayer(det);
  };

  api.event.emit({ handlerName: `${mapId}/$LegendsLayerSet$`, event: api.eventNames.GET_LEGENDS.TRIGGER });
  const legendItems = layerIds
    .filter((layerId) => api.map(mapId).layer.geoviewLayers[layerId])
    .map((layerId) => {
      const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId];

      return (
        <LegendItem
          key={`layerKey-${layerId}`}
          layerId={layerId}
          geoviewLayerInstance={geoviewLayerInstance}
          isRemoveable={isRemoveable}
          canSetOpacity={canSetOpacity}
          expandAll={expandAll}
          hideAll={hideAll}
          canZoomTo
          onOpenDetails={(_layerId: string, _layerConfigEntry: TypeLayerEntryConfig | undefined) =>
            onOpenDetails(_layerId, _layerConfigEntry)
          }
        />
      );
    });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const leftPanel = () => {
    return <List sx={{ width: '100%' }}>{legendItems}</List>;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function rightPanel() {
    if (selectedLayer) {
      return <LegendItemDetails {...selectedLayer} />;
    }
    return null;
  }

  return (
    <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4, md: 8 }}>
      <Grid item xs={12} sm={6}>
        <Item>{leftPanel()}</Item>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Item>{rightPanel()}</Item>
      </Grid>
    </Grid>
  );
}
