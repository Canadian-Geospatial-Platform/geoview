import { useStore } from 'zustand';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@/ui';
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
  const legendLayers = useStore(store, (state) => state.layerState.legendLayers.filter((f) => f.isVisible));

  /* START fake store data here */

  function renderLegendLayersList() {
    return (
      <Box display="flex" flexDirection="column" flexWrap="wrap" style={{ height: 600, overflow: 'auto' }}>
        {legendLayers.map((item) => (
          <Box key={item.layerPath} width={{ xs: '100%', sm: '50%', md: '33.33%', lg: '25%', xl: '25%' }} style={{ minHeight: 0 }} p={2}>
            <LegendLayer layer={item} key={item.layerPath} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={sxClasses.container}>
      <Box>
        <Typography sx={sxClasses.title}>{t('legend.overviewTitle')}</Typography>
        <Typography sx={sxClasses.subtitle} />
      </Box>
      {renderLegendLayersList()}
    </Box>
  );
}
