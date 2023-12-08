import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@/ui';
import { useMapVisibleLayers, useLayerStoreActions } from '@/core/stores/';
import { getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';

export function Legend(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const visibleLayers = useMapVisibleLayers();
  const { getLayer } = useLayerStoreActions();

  function renderLegendLayersList() {
    return (
      <Box display="flex" flexDirection="column" flexWrap="wrap" style={{ height: 600, overflow: 'auto' }}>
        {visibleLayers
          .map((layerPath) => getLayer(layerPath))
          .filter((layer) => layer !== undefined)
          .map((item) => (
            <Box key={item!.layerPath} width={{ xs: '100%', sm: '50%', md: '33.33%', lg: '25%', xl: '25%' }} style={{ minHeight: 0 }} p={2}>
              <LegendLayer layer={item!} key={item!.layerPath} />
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
