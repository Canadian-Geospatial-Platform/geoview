import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { CloseButton, ResponsiveGrid, useFooterPanelHeight } from '@/core/components/common';
import { Box, DeleteOutlineIcon, IconButton, Paper } from '@/ui';
import { getSxClasses } from './layers-style';
import { useLayerDisplayState, useSelectedLayer } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayersToolbar } from './layers-toolbar';
import { LayerDetails } from './right-panel/layer-details';
import { LeftPanel } from './left-panel/left-panel';
import { logger } from '@/core/utils/logger';

export function LayersPanel() {
  // Log
  logger.logTraceRender('components/layers/layers-panel');

  const { t } = useTranslation<string>();

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
      const markup = { __html: t('layers.removeLayerDescription') };
      return (
        // eslint-disable-next-line react/no-danger
        <Paper sx={{ padding: '20px' }}>
          <h3>{t('layers.removingLayers')}</h3>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: '2', alignItems: 'center' }}>
            <IconButton edge="end" size="small">
              <DeleteOutlineIcon color="error" />
            </IconButton>
            <Box>
              {
                /* eslint-disable-next-line react/no-danger */
                <div dangerouslySetInnerHTML={markup} />
              }
            </Box>
          </Box>
        </Paper>
      );
    }
    if (displayState === 'order') {
      const markup = { __html: t('layers.sortingDescription') };
      return (
        <Paper sx={{ padding: '20px' }}>
          <h3>{t('layers.reArrangeLayers')}</h3>
          <Box sx={sxClasses.buttonDescriptionContainer}>
            {
              /* eslint-disable-next-line react/no-danger */
              <div dangerouslySetInnerHTML={markup} />
            }
          </Box>
        </Paper>
      );
    }
    if (displayState === 'add') {
      const markup = { __html: t('layers.addingNewLayerDescription') };
      return (
        <Paper sx={{ padding: '20px' }}>
          <h3>{t('layers.addingNewLayer')}</h3>
          <Box sx={sxClasses.buttonDescriptionContainer}>
            {
              /* eslint-disable-next-line react/no-danger */
              <div dangerouslySetInnerHTML={markup} />
            }
          </Box>
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
