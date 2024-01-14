import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@/ui';
import {
  useMapVisibleLayers,
  useLayerStoreActions,
  useAppFullscreenActive,
  useUIActiveFooterTabId,
  useUIFooterPanelResizeValue,
} from '@/core/stores/';
import { getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';
import { TypeLegendLayer } from '../layers/types';

export function Legend(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const [legendLayers, setLegendLayers] = useState<TypeLegendLayer[]>([]);

  const visibleLayers = useMapVisibleLayers();
  const { getLayer } = useLayerStoreActions();

  const legendPanelRef = useRef<HTMLDivElement>(null);

  const isMapFullScreen = useAppFullscreenActive();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const activeFooterTabId = useUIActiveFooterTabId();

  useEffect(() => {
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

  useEffect(() => {
    if (isMapFullScreen && legendPanelRef.current && activeFooterTabId === 'legend') {
      const tabsContainer = document.getElementById('tabsContainer')!;
      const firstChild = tabsContainer.firstElementChild?.firstElementChild;
      const firstChildHeight = firstChild?.clientHeight || 0;
      const leftPanelHeight = (window.screen.height * footerPanelResizeValue) / 100 - firstChildHeight;

      legendPanelRef.current.style.maxHeight = `${leftPanelHeight}px`;
      legendPanelRef.current.style.overflow = `auto`;
      legendPanelRef.current.style.paddingBottom = `24px`;
    }
  }, [footerPanelResizeValue, isMapFullScreen, activeFooterTabId]);

  function renderLegendLayersList() {
    return (
      <Box display="flex" flexDirection="row" flexWrap="wrap" style={!isMapFullScreen ? { overflow: 'auto' } : {}}>
        {legendLayers.map((item) => (
          <Box key={item!.layerPath} width={{ xs: '100%', sm: '50%', md: '33.33%', lg: '25%', xl: '25%' }} style={{ minHeight: 0 }} p={2}>
            <LegendLayer layer={item!} key={item!.layerPath} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={sxClasses.container} ref={legendPanelRef}>
      <Box>
        <Typography sx={sxClasses.title}>{t('legend.overviewTitle')}</Typography>
        <Typography sx={sxClasses.subtitle} />
      </Box>
      {renderLegendLayersList()}
    </Box>
  );
}
