import { useState, useCallback, ReactNode, useRef } from 'react';
import { logger } from '@/core/utils/logger';
import { LayerList, LayerListEntry } from './layer-list';
import { ResponsiveGridLayout, ResponsiveGridLayoutExposedMethods } from './responsive-grid-layout';
import { LayerTitle } from './layer-title';

interface LayoutProps {
  children?: ReactNode;
  guideContentIds?: string[];
  layerList: LayerListEntry[];
  selectedLayerPath: string | undefined;
  onLayerListClicked: (layer: LayerListEntry) => void;
  fullWidth?: boolean;
  onGuideIsOpen?: (isGuideOpen: boolean) => void;
}

export function Layout({
  children,
  guideContentIds,
  layerList,
  selectedLayerPath,
  onLayerListClicked,
  fullWidth,
  onGuideIsOpen,
}: LayoutProps): JSX.Element {
  const [isEnlarged, setIsEnlarged] = useState(false);

  const responsiveLayoutRef = useRef<ResponsiveGridLayoutExposedMethods>(null);

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param {LayerListEntry} layer The data of the selected layer
   */
  const handleLayerChange = useCallback(
    (layer: LayerListEntry): void => {
      onLayerListClicked?.(layer);
      // Show the panel (hiding the layers list in the process if we're on mobile)
      responsiveLayoutRef.current?.setIsRightPanelVisible(true);
    },
    [onLayerListClicked]
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

  const renderLayerTitle = function (): JSX.Element {
    return (
      <LayerTitle hideTitle fullWidth={fullWidth}>
        {layerList.find((layer) => layer.layerPath === selectedLayerPath)?.layerName ?? ''}
      </LayerTitle>
    );
  };

  return (
    <ResponsiveGridLayout
      ref={responsiveLayoutRef}
      leftTop={null}
      leftMain={renderLayerList()}
      rightMain={children}
      guideContentIds={guideContentIds}
      rightTop={renderLayerTitle()}
      fullWidth={fullWidth}
      onIsEnlargeClicked={setIsEnlarged}
      onGuideIsOpen={onGuideIsOpen}
    />
  );
}

Layout.defaultProps = {
  children: null,
  fullWidth: false,
  guideContentIds: null,
  onGuideIsOpen: undefined,
};
