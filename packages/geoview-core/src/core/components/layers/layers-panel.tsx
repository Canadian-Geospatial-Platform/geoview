import { useRef, useCallback, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material';

import { Box } from '@/ui';
import { useLayerDisplayState, useSelectedLayer } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayersToolbar } from './layers-toolbar';
import { LayerDetails } from './right-panel/layer-details';
import { LeftPanel } from './left-panel/left-panel';
import { logger } from '@/core/utils/logger';
import type { ResponsiveGridLayoutExposedMethods } from '@/core/components/common/responsive-grid-layout';
import { ResponsiveGridLayout } from '@/core/components/common/responsive-grid-layout';
import { Typography } from '@/ui/typography/typography';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { TABS } from '@/core/utils/constant';
import { useGeoViewMapId } from '@/core/stores';

interface TypeLayersPanel {
  containerType: TypeContainerBox;
}

export function LayersPanel({ containerType }: TypeLayersPanel): JSX.Element {
  const theme = useTheme();
  // Log
  logger.logTraceRender('components/layers/layers-panel');

  const { t } = useTranslation();

  const selectedLayer = useSelectedLayer(); // get store value
  const displayState = useLayerDisplayState();
  const [isLayoutEnlarged, setIsLayoutEnlarged] = useState<boolean>(false);

  const { disableFocusTrap } = useUIStoreActions();

  const responsiveLayoutRef = useRef<ResponsiveGridLayoutExposedMethods>(null);
  const mapId = useGeoViewMapId();

  const showLayerDetailsPanel = useCallback((): void => {
    // Just set visibility - focus will be handled automatically by useEffect
    responsiveLayoutRef.current?.setIsRightPanelVisible(true);
    responsiveLayoutRef.current?.setRightPanelFocus();
  }, []);

  const leftPanel = (): JSX.Element => {
    return (
      <Box>
        <LeftPanel showLayerDetailsPanel={showLayerDetailsPanel} isLayoutEnlarged={isLayoutEnlarged} containerType={containerType} />
      </Box>
    );
  };

  const guideContent = (): string[] => {
    if (displayState === 'view') {
      return ['layers.children.view', 'layers.children.layerSettings'];
    }
    if (displayState === 'add') {
      return ['layers.children.add'];
    }

    return [];
  };

  const rightPanel = (): JSX.Element | null => {
    if (selectedLayer && displayState === 'view') {
      return <LayerDetails layerDetails={selectedLayer} containerType={containerType} />;
    }
    return null;
  };

  const layerTitle = (): JSX.Element => {
    return (
      <Typography
        sx={{
          fontSize: theme.palette.geoViewFontSize.lg,
          fontWeight: '600',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          [theme.breakpoints.up('sm')]: { display: 'none' },
        }}
        component="div"
      >
        {selectedLayer?.layerName ?? ''}
      </Typography>
    );
  };

  const handleIsEnlargeClicked = useCallback(
    (isEnlarged: boolean): void => {
      setIsLayoutEnlarged(isEnlarged);
    },
    [setIsLayoutEnlarged]
  );

  /**
   * Handles right panel close - restores focus to the layer list item that opened the panel
   */
  const handleRightPanelClosed = useCallback((): void => {
    // If we have a selected layer, tell disableFocusTrap to focus it
    if (selectedLayer?.layerPath) {
      const layerListItemId = `${mapId}-${containerType}-${TABS.LAYERS}-${selectedLayer.layerPath}`;
      disableFocusTrap(layerListItemId);
    } else {
      disableFocusTrap('no-focus');
    }
  }, [mapId, selectedLayer, disableFocusTrap, containerType]);

  return (
    <ResponsiveGridLayout
      ref={responsiveLayoutRef}
      leftTop={<LayersToolbar containerType={containerType} />}
      leftMain={leftPanel()}
      rightTop={layerTitle()}
      rightMain={rightPanel()}
      guideContentIds={guideContent()}
      hideEnlargeBtn={displayState !== 'view'}
      containerType={containerType}
      titleFullscreen={t('layers.title')}
      onIsEnlargeClicked={handleIsEnlargeClicked}
      onRightPanelClosed={handleRightPanelClosed}
    />
  );
}
