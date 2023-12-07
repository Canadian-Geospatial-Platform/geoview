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

interface LayoutProps {
  children?: ReactNode;
  layerList: LayerListEntry[];
  selectedLayerPath: string;
  handleLayerList: (layer: LayerListEntry) => void;
}

export function Layout({ children, layerList, handleLayerList, selectedLayerPath }: LayoutProps) {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const layerTitle = t('general.layers');
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);

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
  }, [selectedLayerPath, isEnlargeDataTable]);

  return (
    <Box sx={sxClasses.detailsContainer}>
      <ResponsiveGrid.Root>
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
              <EnlargeButton isEnlargeDataTable={isEnlargeDataTable} setIsEnlargeDataTable={setIsEnlargeDataTable} />
              <CloseButton isLayersPanelVisible={isLayersPanelVisible} setIsLayersPanelVisible={setIsLayersPanelVisible} />
            </Box>
          </Box>
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
      <ResponsiveGrid.Root sx={{ marginTop: '1rem' }}>
        <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
          {renderLayerList()}
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
          {children}
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
    </Box>
  );
}

Layout.defaultProps = {
  children: null,
};
