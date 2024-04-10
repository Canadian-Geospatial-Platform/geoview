import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import Markdown from 'markdown-to-jsx';
import { CloseButton, ResponsiveGrid, useFooterPanelHeight } from '@/core/components/common';
import { Box, Paper } from '@/ui';
import { getSxClasses } from './layers-style';
import { useLayerDisplayState, useSelectedLayer } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayersToolbar } from './layers-toolbar';
import { LayerDetails } from './right-panel/layer-details';
import { LeftPanel } from './left-panel/left-panel';
import { logger } from '@/core/utils/logger';
import { useAppGuide } from '@/core/stores/store-interface-and-intial-values/app-state';

export function LayersPanel() {
  // Log
  logger.logTraceRender('components/layers/layers-panel');

  const { t } = useTranslation<string>();
  const guide = useAppGuide();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const [isLayersListPanelVisible, setIsLayersListPanelVisible] = useState(false);

  const selectedLayer = useSelectedLayer(); // get store value
  const displayState = useLayerDisplayState();

  /*
  // Using helpers
  const helpers = useLegendHelpers();
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYERS-PANEL - mount');

    helpers.populateLegendStoreWithFakeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  */

  // Custom hook for calculating the height of footer panel
  const { leftPanelRef, rightPanelRef, panelTitleRef } = useFooterPanelHeight({ footerPanelTab: 'layers' });

  const leftPanel = () => {
    return (
      <Box>
        <LeftPanel setIsLayersListPanelVisible={setIsLayersListPanelVisible} />
      </Box>
    );
  };

  const rightPanel = () => {
    if (selectedLayer && displayState === 'view') {
      return <LayerDetails layerDetails={selectedLayer} />;
    }
    if (displayState === 'remove') {
      // TODO: refactor - remove the need for markup and danger Eslint
      const markDown = (
        <Markdown options={{ wrapper: 'article' }}>
          {guide?.footerPanel?.children?.layers?.children?.remove?.content || (t('layers.removeLayerDescription') as string)}
        </Markdown>
      );
      return (
        <Paper sx={{ padding: '20px' }}>
          <Box sx={sxClasses.guideBox}>{markDown}</Box>
        </Paper>
      );
    }
    if (displayState === 'order') {
      const markDown = (
        <Markdown options={{ wrapper: 'article' }}>
          {guide?.footerPanel?.children?.layers?.children?.sort?.content || (t('layers.sortingDescription') as string)}
        </Markdown>
      );
      return (
        <Paper sx={{ padding: '20px' }}>
          <Box sx={sxClasses.guideBox}>{markDown}</Box>
        </Paper>
      );
    }
    if (displayState === 'add') {
      const markDown = (
        <Markdown options={{ wrapper: 'article' }}>
          {guide?.footerPanel?.children?.layers?.children?.add?.content || (t('layers.addingNewLayerDescription') as string)}
        </Markdown>
      );
      return (
        <Paper sx={{ padding: '20px' }}>
          <Box sx={sxClasses.guideBox}>{markDown}</Box>
        </Paper>
      );
    }

    return null;
  };

  return (
    <Box sx={sxClasses.layersPanelContainer}>
      <LayersToolbar />
      <ResponsiveGrid.Root sx={{ pt: 8, pb: 8 }} ref={panelTitleRef}>
        <ResponsiveGrid.Right isEnlarged={false} isLayersPanelVisible={isLayersListPanelVisible}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'right',
            }}
          >
            <CloseButton isLayersPanelVisible={isLayersListPanelVisible} onSetIsLayersPanelVisible={setIsLayersListPanelVisible} />
          </Box>
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
      <ResponsiveGrid.Root>
        <ResponsiveGrid.Left isEnlarged={false} isLayersPanelVisible={isLayersListPanelVisible} ref={leftPanelRef}>
          {leftPanel()}
        </ResponsiveGrid.Left>

        <ResponsiveGrid.Right isEnlarged={false} isLayersPanelVisible={isLayersListPanelVisible} ref={rightPanelRef}>
          {rightPanel()}
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
    </Box>
  );
}
