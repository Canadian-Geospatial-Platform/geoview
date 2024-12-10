import { useCallback, ReactNode, useRef, useMemo, memo } from 'react';
import { useTheme } from '@mui/material/styles';
import { logger } from '@/core/utils/logger';
import { LayerList, LayerListEntry } from './layer-list';
import { ResponsiveGridLayout, ResponsiveGridLayoutExposedMethods } from './responsive-grid-layout';
import { Tooltip, Typography } from '@/ui';
import { TypeContainerBox } from '@/core/types/global-types';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';

interface LayoutProps {
  children?: ReactNode;
  guideContentIds?: string[];
  layerList: LayerListEntry[];
  selectedLayerPath: string | undefined;
  fullWidth?: boolean;
  containerType?: TypeContainerBox;
  onLayerListClicked: (layer: LayerListEntry) => void;
  onIsEnlargeClicked?: (isEnlarge: boolean) => void;
  onGuideIsOpen?: (isGuideOpen: boolean) => void;
}

// Constants outside component to prevent recreating every render
const TITLE_STYLES = {
  fontWeight: '600',
  marginTop: '12px',
  overflow: 'hidden',
  display: '-webkit-box',
  webkitBoxOrient: 'vertical',
  webkitLineClamp: '2',
} as const;

// Memoizes entire component, preventing re-renders if props haven't changed
export const Layout = memo(function Layout({
  children,
  guideContentIds,
  layerList,
  selectedLayerPath,
  onLayerListClicked,
  onIsEnlargeClicked,
  fullWidth,
  onGuideIsOpen,
  containerType = CONTAINER_TYPE.FOOTER_BAR,
}: LayoutProps): JSX.Element {
  logger.logTraceRender('components/common/layout');

  // Hooks
  const responsiveLayoutRef = useRef<ResponsiveGridLayoutExposedMethods>(null);
  const theme = useTheme();

  // Store
  const { setSelectedFooterLayerListItemId } = useUIStoreActions();

  // Callbacks
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
      responsiveLayoutRef.current?.setRightPanelFocus();

      // set the focus item when layer item clicked.
      setSelectedFooterLayerListItemId(`${layer.layerUniqueId}`);
    },
    [onLayerListClicked, setSelectedFooterLayerListItemId]
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

  /**
   * Get the layer title
   */
  const memoLayerTitle = useMemo(() => {
    return layerList.find((layer) => layer.layerPath === selectedLayerPath)?.layerName ?? '';
  }, [layerList, selectedLayerPath]);

  /**
   * Render layer title
   * @returns JSX.Element
   */
  const renderLayerTitle = useCallback((): JSX.Element => {
    // clamping code copied from https://tailwindcss.com/docs/line-clamp
    const sxClasses = {
      ...TITLE_STYLES,
      fontSize: theme.palette.geoViewFontSize.lg,
      textAlign: fullWidth || containerType === CONTAINER_TYPE.APP_BAR ? 'center' : 'left',
      width: fullWidth || containerType === CONTAINER_TYPE.APP_BAR ? '100%' : 'auto',
      ...(!fullWidth && { [theme.breakpoints.up('md')]: { display: 'none' } }),
    };

    return (
      <Tooltip title={memoLayerTitle} placement="top" arrow>
        <Typography sx={sxClasses} component="div">
          {memoLayerTitle}
        </Typography>
      </Tooltip>
    );
  }, [containerType, fullWidth, memoLayerTitle, theme.breakpoints, theme.palette.geoViewFontSize.lg]);

  return (
    <ResponsiveGridLayout
      ref={responsiveLayoutRef}
      leftTop={null}
      leftMain={renderLayerList()}
      rightMain={children}
      guideContentIds={guideContentIds}
      rightTop={renderLayerTitle()}
      onIsEnlargeClicked={onIsEnlargeClicked}
      fullWidth={fullWidth}
      onGuideIsOpen={onGuideIsOpen}
      containerType={containerType}
    />
  );
});
