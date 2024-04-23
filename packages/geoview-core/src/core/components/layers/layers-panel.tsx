import { useRef } from 'react';
import Markdown from 'markdown-to-jsx';
import { useTheme } from '@mui/material';
import { Box } from '@/ui';
import { useLayerDisplayState, useSelectedLayer } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayersToolbar } from './layers-toolbar';
import { LayerDetails } from './right-panel/layer-details';
import { LeftPanel } from './left-panel/left-panel';
import { logger } from '@/core/utils/logger';
import { useAppGuide } from '@/core/stores/store-interface-and-intial-values/app-state';
import { ResponsiveGridLayout, ResponsiveGridLayoutExposedMethods } from '../common/responsive-grid-layout';
import { Typography } from '@/ui/typography/typography';

export function LayersPanel(): JSX.Element {
  const theme = useTheme();
  // Log
  logger.logTraceRender('components/layers/layers-panel');

  const guide = useAppGuide();

  const selectedLayer = useSelectedLayer(); // get store value
  const displayState = useLayerDisplayState();

  const responsiveLayoutRef = useRef<ResponsiveGridLayoutExposedMethods>(null);

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

  const showLayerDetailsPanel = (): void => {
    responsiveLayoutRef.current?.setIsRightPanelVisible(true);
  };

  const leftPanel = (): JSX.Element => {
    return (
      <Box>
        <LeftPanel setIsLayersListPanelVisible={showLayerDetailsPanel} />
      </Box>
    );
  };

  const rightPanel = (): JSX.Element | null => {
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
        <Box sx={{ overflow: 'auto' }}>
          <Box className="guideBox">{markDown}</Box>
        </Box>
      );
    }
    if (displayState === 'remove') {
      const markDown = (
        <Markdown options={{ wrapper: 'article' }}>{guide!.footerPanel!.children!.layers!.children!.remove!.content}</Markdown>
      );
      return <Box className="guideBox">{markDown}</Box>;
    }
    if (displayState === 'order') {
      const markDown = (
        <Markdown options={{ wrapper: 'article' }}>{guide!.footerPanel!.children!.layers!.children!.sort!.content}</Markdown>
      );
      return <Box className="guideBox">{markDown}</Box>;
    }
    if (displayState === 'add') {
      const markDown = <Markdown options={{ wrapper: 'article' }}>{guide!.footerPanel!.children!.layers!.children!.add!.content}</Markdown>;
      return <Box className="guideBox">{markDown}</Box>;
    }

    return null;
  };

  const layerTitle = (): JSX.Element => {
    return (
      <Typography
        sx={{
          fontSize: theme.palette.geoViewFontSize.lg,
          fontWeight: '600',
          marginTop: '12px',
          [theme.breakpoints.up('md')]: { display: 'none' },
        }}
        component="div"
      >
        {selectedLayer?.layerName ?? ''}
      </Typography>
    );
  };

  return (
    <ResponsiveGridLayout
      ref={responsiveLayoutRef}
      leftTop={<LayersToolbar />}
      leftMain={leftPanel()}
      rightTop={layerTitle()}
      rightMain={rightPanel()}
      fullWidth={false}
    />
  );
}
