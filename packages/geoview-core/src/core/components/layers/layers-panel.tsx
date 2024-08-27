import { useRef, useCallback, useState } from 'react';
import { useTheme } from '@mui/material';
import { Box } from '@/ui';
import { useLayerDisplayState, useLayerStoreActions, useSelectedLayer } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayersToolbar } from './layers-toolbar';
import { LayerDetails } from './right-panel/layer-details';
import { LeftPanel } from './left-panel/left-panel';
import { logger } from '@/core/utils/logger';
import { ResponsiveGridLayout, ResponsiveGridLayoutExposedMethods } from '@/core/components/common/responsive-grid-layout';
import { Typography } from '@/ui/typography/typography';
import { TypeContainerBox } from '@/core/types/global-types';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { TypeLegendLayer } from './types';

interface TypeLayersPanel {
  containerType?: TypeContainerBox;
}

export function LayersPanel({ containerType }: TypeLayersPanel): JSX.Element {
  const theme = useTheme();
  // Log
  logger.logTraceRender('components/layers/layers-panel');

  const selectedLayer = useSelectedLayer(); // get store value
  const displayState = useLayerDisplayState();
  const [isLayoutEnlarged, setIsLayoutEnlarged] = useState<boolean>(false);

  const { setSelectedLayerPath } = useLayerStoreActions();
  const { setSelectedFooterLayerListItem } = useUIStoreActions();

  const responsiveLayoutRef = useRef<ResponsiveGridLayoutExposedMethods>(null);

  const showLayerDetailsPanel = (layer: TypeLegendLayer): void => {
    responsiveLayoutRef.current?.setIsRightPanelVisible(true);
    responsiveLayoutRef.current?.setRightPanelFocus();
    // set the focus item when layer item clicked.
    setSelectedFooterLayerListItem(`${layer.layerId}`);
  };

  const leftPanel = (): JSX.Element => {
    return (
      <Box id="layers-left-panel">
        <LeftPanel showLayerDetailsPanel={showLayerDetailsPanel} isLayoutEnlarged={isLayoutEnlarged} />
      </Box>
    );
  };

  const guideContent = (): string[] => {
    if (displayState === 'view') {
      return ['layers.children.view', 'layers.children.layerSettings'];
    }
    if (displayState === 'remove') {
      return ['layers.children.remove'];
    }
    if (displayState === 'order') {
      return ['layers.children.sort'];
    }
    if (displayState === 'add') {
      return ['layers.children.add'];
    }

    return [];
  };

  const rightPanel = (): JSX.Element | null => {
    if (selectedLayer && displayState === 'view') {
      return <LayerDetails layerDetails={selectedLayer} />;
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

  const handleGuideIsOpen = useCallback(
    (guideIsOpen: boolean): void => {
      if (guideIsOpen) {
        setSelectedLayerPath('');
      }
    },
    [setSelectedLayerPath]
  );

  const handleIsEnlargeClicked = useCallback(
    (isEnlarged: boolean): void => {
      setIsLayoutEnlarged(isEnlarged);
    },
    [setIsLayoutEnlarged]
  );

  return (
    <ResponsiveGridLayout
      ref={responsiveLayoutRef}
      leftTop={<LayersToolbar />}
      leftMain={leftPanel()}
      rightTop={layerTitle()}
      rightMain={rightPanel()}
      guideContentIds={guideContent()}
      fullWidth={false}
      onGuideIsOpen={handleGuideIsOpen}
      hideEnlargeBtn={displayState !== 'view'}
      containerType={containerType}
      onIsEnlargeClicked={handleIsEnlargeClicked}
    />
  );
}
