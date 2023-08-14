import { styled } from '@mui/material';
import { TypeLegendProps } from './legend-api';
import { api } from '@/app';
import { LegendItem } from './legend-item';
import { LegendItemDetails } from './legend-item-details';
import { List, Grid } from '@/ui';

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
  // const [selectedLayer, setSelectedLayer] = useState<AbstractGeoViewLayer | null>(null);

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
        />
      );
    });

  const legendDetailsItems = layerIds
    .filter((layerId) => api.map(mapId).layer.geoviewLayers[layerId])
    .map((layerId) => {
      const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId];

      return (
        <LegendItemDetails
          key={`layerKey-${layerId}`}
          layerId={layerId}
          geoviewLayerInstance={geoviewLayerInstance}
          isRemoveable={isRemoveable}
          canSetOpacity={canSetOpacity}
          expandAll={expandAll}
          hideAll={hideAll}
          canZoomTo
        />
      );
    });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const leftPanel = () => {
    return <List sx={{ width: '100%' }}>{legendItems}</List>;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function rightPanel() {
    return <List sx={{ width: '100%' }}>fdsffsdf</List>;
  }

  return (
    <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2, md: 4 }}>
      <Grid item xs={12} sm={6}>
        <Item>{leftPanel()}</Item>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Item>{rightPanel()}</Item>
      </Grid>
    </Grid>
  );
}
