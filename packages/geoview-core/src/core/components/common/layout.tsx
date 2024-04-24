import { useCallback, ReactNode, useRef } from 'react';
import { logger } from '@/core/utils/logger';
import { LayerList, LayerListEntry } from './layer-list';
import { ResponsiveGridLayout, ResponsiveGridLayoutExposedMethods } from './responsive-grid-layout';
import { LayerTitle } from './layer-title';

interface LayoutProps {
  children?: ReactNode;
  layerList: LayerListEntry[];
  selectedLayerPath: string | undefined;
  onLayerListClicked: (layer: LayerListEntry) => void;
  onIsEnlargeClicked?: (isEnlarge: boolean) => void;
  fullWidth?: boolean;
}

export function Layout({
  children,
  layerList,
  selectedLayerPath,
  onLayerListClicked,
  onIsEnlargeClicked,
  fullWidth,
}: LayoutProps): JSX.Element {
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

    return <LayerList selectedLayerPath={selectedLayerPath} onListItemClick={handleLayerChange} layerList={layerList} />;
  }, [selectedLayerPath, layerList, handleLayerChange]);

  const renderLayerTitle = (): JSX.Element => {
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
      rightTop={renderLayerTitle()}
      onIsEnlargeClicked={onIsEnlargeClicked}
      fullWidth={fullWidth}
    />
  );
}

Layout.defaultProps = {
  children: null,
  onIsEnlargeClicked: undefined,
  fullWidth: false,
};
