/* eslint-disable react/jsx-no-constructed-context-values */
import { styled } from '@mui/material';
import { useState } from 'react';
import { TypeLegendProps } from './types';
import { api } from '@/app';
import { LegendItemDetails } from './legend-item-details/legend-item-details';
import { Grid, Box } from '@/ui';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { TypeLegendItemProps } from './types';
import { LayersSelect } from '../layers-select/LayersSelect';

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
    }, 500);
  };

  api.event.emit({ handlerName: `${mapId}/$LegendsLayerSet$`, event: api.eventNames.GET_LEGENDS.TRIGGER });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const leftPanel = () => {
    return (
      <LayersSelect
        mapId={mapId}
        layerIds={layerIds}
        canSetOpacity={canSetOpacity}
        expandAll={expandAll}
        hideAll={hideAll}
        isRemoveable={false}
        canZoomTo
        canSort
        onOpenDetails={(_layerId: string, _layerConfigEntry: TypeLayerEntryConfig | undefined) =>
          onOpenDetails(_layerId, _layerConfigEntry)
        }
      />
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function rightPanel() {
    if (selectedLayer) {
      return <LegendItemDetails {...selectedLayer} />;
    }
    return null;
  }

  return (
    <Box sx={{ px: '20px', pb: '20px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '20px' }}>Legend Overview</h3>
      <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4, md: 8 }}>
        <Grid item xs={12} sm={6} style={{ backgroundColor: 'lightgrey',width:'100%', height: '100%' }}>
          {/* <p>Left Pane</p> */}
          <Item>{leftPanel()}</Item>
        </Grid>
        <Grid item xs={12} sm={6} style={{ backgroundColor: 'darkgrey',width:'100%', height: '100%' }}>
          {/* <p>Right Pane</p> */}
          <Item>{rightPanel()}</Item>
        </Grid>
      </Grid>
    </Box>
  );
}