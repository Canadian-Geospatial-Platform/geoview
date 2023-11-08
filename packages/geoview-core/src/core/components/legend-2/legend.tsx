import { useStore } from 'zustand';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Grid } from '@/ui';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';

export interface LegendOverviewProps {
  mapId: string;
}

export function Legend(props: LegendOverviewProps): JSX.Element {
  const { mapId } = props;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation<string>();
  const store = getGeoViewStore(mapId);
  const legendLayers = useStore(store, (state) => state.legendState.legendLayers);

  const numItems = 33;
  /* START fake store data here */

  function renderLegendLayersList() {
    return (
      <Grid container spacing={4} sx={{ width: '100%', padding: '20px' }}>
        {legendLayers.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.layerPath}>
            <LegendLayer layer={item} key={item.layerPath} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box sx={sxClasses.container}>
      <Box>
        <Typography sx={sxClasses.title}>
          <strong>{t('legend.bold_selection')}</strong> {t('legend.overview_title')}
        </Typography>
        <Typography sx={sxClasses.subtitle}>
          {numItems} {t('legend.items_available')}
        </Typography>
      </Box>
      {renderLegendLayersList()}
    </Box>
  );
}
