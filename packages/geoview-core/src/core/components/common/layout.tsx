import { useState, useCallback, type ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { getSxClasses } from './layout-style';
import { LayerList, LayerListEntry } from './layer-list';
import { ResponsiveGrid } from './responsive-grid';
import { LayerTitle } from './layer-title';
import { EnlargeButton } from './enlarge-button';
import { CloseButton } from './close-button';
import { Box } from '@/ui';
import { useFooterPanelHeight } from './use-footer-panel-height';

interface LayoutProps {
  children?: ReactNode;
  layerList: LayerListEntry[];
  selectedLayerPath: string;
  // ? Name this onLayerListClicked? and make it optional with '?' suffix?
  handleLayerList: (layer: LayerListEntry) => void;
  onIsEnlargeClicked?: (isEnlarge: boolean) => void;
}

export function Layout({ children, layerList, selectedLayerPath, handleLayerList, onIsEnlargeClicked }: LayoutProps) {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const layerTitle = t('general.layers');
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);

  // Custom hook for calculating the height of footer panel
  const { leftPanelRef, rightPanelRef, panelTitleRef } = useFooterPanelHeight({ footerPanelTab: 'default' });

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param {LayerListEntry} layer The data of the selected layer
   */
  const handleLayerChange = (layer: LayerListEntry): void => {
    handleLayerList(layer);
    setIsLayersPanelVisible(true);
  };

  /**
   * Handles click on the Enlarge button.
   *
   * @param {boolean} isEnlarge Indicate if enlarge
   */
  const handleIsEnlarge = (isEnlarge: boolean): void => {
    // Set the isEnlarge
    setIsEnlargeDataTable(isEnlarge);

    // Callback
    onIsEnlargeClicked?.(isEnlarge);
  };

  /**
   * Render group layers as list.
   *
   * @returns JSX.Element
   */
  const renderLayerList = useCallback(() => {
    return (
      <LayerList
        isEnlargeDataTable={isEnlargeDataTable}
        selectedLayerIndex={layerList.findIndex((layer) => layer.layerPath === selectedLayerPath)}
        handleListItemClick={(layer) => {
          handleLayerChange(layer);
        }}
        layerList={layerList}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayerPath, isEnlargeDataTable, layerList]);

  return (
    <Box sx={sxClasses.detailsContainer}>
      <ResponsiveGrid.Root sx={{ pt: 8, pb: 8 }} ref={panelTitleRef}>
        <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
          <LayerTitle>{layerTitle}</LayerTitle>
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              [theme.breakpoints.up('md')]: { justifyContent: 'right' },
              [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
            }}
          >
            <LayerTitle hideTitle>{layerList.find((layer) => layer.layerPath === selectedLayerPath)?.layerName ?? ''}</LayerTitle>
            <Box>
              <EnlargeButton isEnlargeDataTable={isEnlargeDataTable} setIsEnlargeDataTable={handleIsEnlarge} />
              <CloseButton isLayersPanelVisible={isLayersPanelVisible} setIsLayersPanelVisible={setIsLayersPanelVisible} />
            </Box>
          </Box>
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
      <ResponsiveGrid.Root>
        <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable} ref={leftPanelRef}>
          {renderLayerList()}
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible} ref={rightPanelRef}>
          {children}
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
    </Box>
  );
}

Layout.defaultProps = {
  children: null,
  onIsEnlargeClicked: undefined,
};
