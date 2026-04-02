import { useRef, useCallback, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Box } from '@/ui';

import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreLayerDisplayState, useStoreLayerSelectedLayerPath } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayersToolbar } from './layers-toolbar';
import { LayerDetails } from './right-panel/layer-details';
import { LeftPanel } from './left-panel/left-panel';
import { logger } from '@/core/utils/logger';
import type { ResponsiveGridLayoutExposedMethods } from '@/core/components/common/responsive-grid-layout';
import { ResponsiveGridLayout } from '@/core/components/common/responsive-grid-layout';
import type { TypeContainerBox } from '@/core/types/global-types';
import { TABS } from '@/core/utils/constant';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';

interface TypeLayersPanel {
  containerType: TypeContainerBox;
}

export function LayersPanel({ containerType }: TypeLayersPanel): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/layers-panel');

  const { t } = useTranslation();

  const mapId = useStoreGeoViewMapId();
  const selectedLayerPath = useStoreLayerSelectedLayerPath();
  const displayState = useStoreLayerDisplayState();

  const uiController = useUIController();

  const responsiveLayoutRef = useRef<ResponsiveGridLayoutExposedMethods>(null);
  const [isLayoutEnlarged, setIsLayoutEnlarged] = useState<boolean>(false);

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
    if (selectedLayerPath && displayState === 'view') {
      return <LayerDetails layerPath={selectedLayerPath} containerType={containerType} />;
    }
    return null;
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
    if (selectedLayerPath) {
      const layerListItemId = `${mapId}-${containerType}-${TABS.LAYERS}-${selectedLayerPath}`;
      uiController.disableFocusTrap(layerListItemId);
    } else {
      uiController.disableFocusTrap('no-focus');
    }
  }, [mapId, selectedLayerPath, uiController, containerType]);

  return (
    <ResponsiveGridLayout
      ref={responsiveLayoutRef}
      leftTop={<LayersToolbar containerType={containerType} />}
      leftMain={leftPanel()}
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
