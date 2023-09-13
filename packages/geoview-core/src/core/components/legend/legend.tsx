import { styled } from '@mui/material';
import { api } from '@/app';
import { LegendProps } from './types';
import { Box, Grid } from '@/ui';
import { LegendItems } from './legend-items/legend-items';

const Item = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#262B32' : '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  borderRadius: 4,
}));

export function Legend(props: LegendProps): JSX.Element {
  const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, mapId } = props;
  api.event.emit({ handlerName: `${mapId}/$LegendsLayerSet$`, event: api.eventNames.GET_LEGENDS.TRIGGER });

  const leftPanel = () => {
    return (
      <LegendItems
        mapId={mapId}
        layerIds={layerIds}
        canSetOpacity={canSetOpacity}
        expandAll={expandAll}
        hideAll={hideAll}
        isRemoveable={isRemoveable}
        canZoomTo
      />
    );
  };

  return (
    <Box sx={{ px: '20px', pb: '20px', display: 'flex', flexDirection: 'column' }}>
      <Grid container direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4, md: 8 }}>
        <Grid item xs={12} sm={4}>
          <Item>{leftPanel()}</Item>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Item>
            <p>This will be right panel eventually</p>
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
}
