import { useState, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box } from '@/ui';
import { logger } from '@/core/utils/logger';

import { getSxClasses } from './layout-style';
import { LayerList, LayerListEntry } from './layer-list';
import { ResponsiveGrid } from './responsive-grid';
import { LayerTitle } from './layer-title';
import { EnlargeButton } from './enlarge-button';
import { CloseButton } from './close-button';
import { useFooterPanelHeight } from './use-footer-panel-height';

interface LayoutProps {
  children?: ReactNode;
  layerList: LayerListEntry[];
  selectedLayerPath: string | undefined;
  onLayerListClicked: (layer: LayerListEntry) => void;
  onIsEnlargeClicked?: (isEnlarge: boolean) => void;
  fullWidth?: boolean;
}

export function Layout({ children, layerList, selectedLayerPath, onLayerListClicked, onIsEnlargeClicked, fullWidth }: LayoutProps) {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);

  // Custom hook for calculating the height of footer panel
  const { leftPanelRef, rightPanelRef, panelTitleRef } = useFooterPanelHeight({ footerPanelTab: 'default' });

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param {LayerListEntry} layer The data of the selected layer
   */
  const handleLayerChange = useCallback(
    (layer: LayerListEntry): void => {
      onLayerListClicked?.(layer);
      // Show the panel (hiding the layers list in the process if we're on mobile)
      setIsLayersPanelVisible(true);
    },
    [onLayerListClicked]
  );

  /**
   * Handles click on the Enlarge button.
   *
   * @param {boolean} isEnlarge Indicate if enlarge
   */
  const handleIsEnlarge = useCallback(
    (isEnlarge: boolean): void => {
      // Log
      logger.logTraceUseCallback('LAYOUT - handleIsEnlarge');

      // Set the isEnlarge
      setIsEnlarged(isEnlarge);

      // Callback
      onIsEnlargeClicked?.(isEnlarge);
    },
    [onIsEnlargeClicked]
  );

  /**
   * Render group layers as list.
   *
   * @returns JSX.Element
   */
  const renderLayerList = useCallback(() => {
    // Log
    logger.logTraceUseCallback('LAYOUT - renderLayerList');

    return (
      <LayerList isEnlarged={isEnlarged} selectedLayerPath={selectedLayerPath} onListItemClick={handleLayerChange} layerList={layerList} />
    );
  }, [isEnlarged, selectedLayerPath, layerList, handleLayerChange]);

  // // If we're on mobile
  // if (theme.breakpoints.down('md')) {
  //   // If there are no layers and not already showing the right-side panel
  //   if (!layerList.length && !isLayersPanelVisible) {
  //     setIsLayersPanelVisible(true);
  //   }
  // }
  console.log('layerList', layerList, selectedLayerPath);
  return (
    <Box sx={sxClasses.detailsContainer}>
      <ResponsiveGrid.Root sx={{ pt: 8, pb: 8 }} ref={panelTitleRef}>
        {!fullWidth && (
          <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlarged={isEnlarged}>
            {!!layerList.length && <LayerTitle>{t('general.layers')}</LayerTitle>}
          </ResponsiveGrid.Left>
        )}
        <ResponsiveGrid.Right isLayersPanelVisible={isLayersPanelVisible} isEnlarged={isEnlarged} fullWidth={fullWidth}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              [theme.breakpoints.up('md')]: { justifyContent: 'right' },
              [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
            }}
          >
            <LayerTitle hideTitle fullWidth={fullWidth}>
              {layerList.find((layer) => layer.layerPath === selectedLayerPath)?.layerName ?? ''}
            </LayerTitle>

            <Box>
              {!fullWidth && <EnlargeButton isEnlarged={isEnlarged} onSetIsEnlarged={handleIsEnlarge} />}
              {!!layerList.length && (
                <CloseButton
                  isLayersPanelVisible={isLayersPanelVisible}
                  onSetIsLayersPanelVisible={setIsLayersPanelVisible}
                  fullWidth={fullWidth}
                />
              )}
            </Box>
          </Box>
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
      <ResponsiveGrid.Root>
        <ResponsiveGrid.Left ref={leftPanelRef} isEnlarged={isEnlarged} isLayersPanelVisible={isLayersPanelVisible} fullWidth={fullWidth}>
          {renderLayerList()}
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right ref={rightPanelRef} isEnlarged={isEnlarged} isLayersPanelVisible={isLayersPanelVisible} fullWidth={fullWidth}>
          {children}
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
    </Box>
  );
}

Layout.defaultProps = {
  children: null,
  onIsEnlargeClicked: undefined,
  fullWidth: false,
};
