import { createElement } from 'react';
import { styled } from '@mui/material';
import { TypeLegendProps } from './legend-api';
import { api } from '@/app';
import { LegendItem } from './legend-item';
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

  api.event.emit({ handlerName: `${mapId}/$LegendsLayerSet$`, event: api.eventNames.GET_LEGENDS.TRIGGER });
  const legendItems = layerIds.map((layerId) => {
    const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId];
    if (geoviewLayerInstance) {
      return createElement(LegendItem, {
        key: `layerKey-${layerId}`,
        layerId,
        geoviewLayerInstance,
        isRemoveable,
        canSetOpacity,
        expandAll,
        hideAll,
        canZoomTo: true,
      });
    }
    return null;
  });
  // return

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const leftPanel = () => {
    return createElement('div', {}, createElement(List, { sx: { width: '100%' } }, legendItems));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function rightPanel() {
    return <div>I am right panels</div>;
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
