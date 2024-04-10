import { useState } from 'react';
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
    if (!selectedLayer && displayState === 'view') {
      const markDown = (
        <Markdown options={{ wrapper: 'article' }}>
          {`${guide!.footerPanel!.children!.layers!.children!.view!.content}\n${
            guide!.footerPanel!.children!.layers!.children!.layerSettings!.content
          }`}
        </Markdown>
      );
      return (
        <Paper sx={{ padding: '20px', overflow: 'auto' }}>
          <Box className="guideBox">{markDown}</Box>
        </Paper>
      );
    }
    if (displayState === 'remove') {
      const markDown = (
        <Markdown options={{ wrapper: 'article' }}>{guide!.footerPanel!.children!.layers!.children!.remove!.content}</Markdown>
      );
      return (
        <Paper sx={{ padding: '20px' }}>
          <Box className="guideBox">{markDown}</Box>
        </Paper>
      );
    }
    if (displayState === 'order') {
      const markDown = (
        <Markdown options={{ wrapper: 'article' }}>{guide!.footerPanel!.children!.layers!.children!.sort!.content}</Markdown>
      );
      return (
        <Paper sx={{ padding: '20px' }}>
          <Box className="guideBox">{markDown}</Box>
        </Paper>
      );
    }
    if (displayState === 'add') {
      const markDown = <Markdown options={{ wrapper: 'article' }}>{guide!.footerPanel!.children!.layers!.children!.add!.content}</Markdown>;
      return (
        <Paper sx={{ padding: '20px' }}>
          <Box className="guideBox">{markDown}</Box>
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
