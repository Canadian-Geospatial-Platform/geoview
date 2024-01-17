import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Box, Typography } from '@/ui';
import { useMapVisibleLayers, useLayerStoreActions } from '@/core/stores/';
import { getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';
import { TypeLegendLayer } from '../layers/types';
import { useFooterPanelHeight } from '../common';

export function Legend(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [legendLayers, setLegendLayers] = useState<TypeLegendLayer[]>([]);

  // store state
  const visibleLayers = useMapVisibleLayers();
  const { getLayer } = useLayerStoreActions();

  // Custom hook for calculating the height of footer panel
  const { leftPanelRef } = useFooterPanelHeight({ footerPanelTab: 'legend' });

  useEffect(() => {
    // TODO: make this async as the visible layers array is empty when useEffect is triggered
    // TD-CONT: Seems to be more problematic with group layer, raw-feature-info, we do not have the legend title
    // TD-CONT: because if by default the tab is colllapse, it is a blank screen
    const parentPaths: string[] = [];
    const layers = visibleLayers
      .map((layerPath) => {
        const pathStart = layerPath.split('/')[0];
        if (!parentPaths.includes(pathStart)) {
          parentPaths.push(pathStart);
          return getLayer(layerPath);
        }
        return undefined;
      })
      .filter((layer) => layer !== undefined);
    setLegendLayers(layers as TypeLegendLayer[]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleLayers]);

  function renderLegendLayersList() {
    return (
      <Box display="flex" flexDirection="row" flexWrap="wrap">
        {legendLayers.map((item) => (
          <Box key={item!.layerPath} width={{ xs: '100%', sm: '50%', md: '33.33%', lg: '25%', xl: '25%' }} style={{ minHeight: 0 }} p={2}>
            <LegendLayer layer={item!} key={item!.layerPath} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={sxClasses.container} ref={leftPanelRef} id="legendContainer">
      <Box>
        <Typography sx={sxClasses.title}>{t('legend.overviewTitle')}</Typography>
        <Typography sx={sxClasses.subtitle} />
      </Box>
      {renderLegendLayersList()}
    </Box>
  );
}
