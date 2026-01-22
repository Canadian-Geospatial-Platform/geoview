import type { ReactNode, Ref } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { logger } from '@/core/utils/logger';
import type { LayerListEntry } from './layer-list';
import { LayerList } from './layer-list';
import type { ResponsiveGridLayoutExposedMethods } from './responsive-grid-layout';
import { ResponsiveGridLayout } from './responsive-grid-layout';
import { Tooltip, Typography } from '@/ui';
import type { TypeContainerBox } from '@/core/types/global-types';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useLayerSelectorName } from '@/core/stores/store-interface-and-intial-values/layer-state';

interface LayoutProps {
  children?: ReactNode;
  layoutSwitch?: ReactNode; // Only Coordinate info switch at the moment
  guideContentIds?: string[];
  layerList: LayerListEntry[];
  selectedLayerPath: string | undefined;
  onLayerListClicked: (layer: LayerListEntry) => void;
  onIsEnlargeClicked?: (isEnlarge: boolean) => void;
  onGuideIsOpen?: (isGuideOpen: boolean) => void;
  onRightPanelClosed?: () => void;
  onRightPanelVisibilityChanged?: (isVisible: boolean) => void;
  containerType?: TypeContainerBox;
  hideEnlargeBtn?: boolean;
  toggleMode?: boolean;
}

// Constants outside component to prevent recreating every render
const TITLE_STYLES = {
  fontWeight: '600',
  overflow: 'hidden',
  display: '-webkit-box',
  webkitBoxOrient: 'vertical',
  webkitLineClamp: '2',
} as const;

interface LayoutExposedMethods {
  showRightPanel: (visible: boolean) => void;
}

const Layout = forwardRef(
  (
    {
      children,
      layoutSwitch,
      guideContentIds,
      layerList,
      selectedLayerPath,
      onLayerListClicked,
      onIsEnlargeClicked,
      onGuideIsOpen,
      onRightPanelClosed,
      onRightPanelVisibilityChanged,
      containerType = CONTAINER_TYPE.FOOTER_BAR,
      hideEnlargeBtn,
      toggleMode = false,
    }: LayoutProps,
    ref: Ref<LayoutExposedMethods>
  ) => {
    logger.logTraceRender('components/common/layout');

    // Hooks
    const responsiveLayoutRef = useRef<ResponsiveGridLayoutExposedMethods>(null);
    const theme = useTheme();
    const layerName = useLayerSelectorName(selectedLayerPath!);

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
        // Delay focus to ensure DOM is ready
        requestAnimationFrame(() => {
          responsiveLayoutRef.current?.setRightPanelFocus();
       });

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
    }, [selectedLayerPath, handleLayerChange, layerList]);

    /**
     * Render layer title
     * @returns JSX.Element
     */
    const renderLayerTitle = useCallback((): JSX.Element => {
      // clamping code copied from https://tailwindcss.com/docs/line-clamp
      const sxClasses = {
        ...TITLE_STYLES,
        fontSize: theme.palette.geoViewFontSize.lg,
        width: containerType === CONTAINER_TYPE.APP_BAR ? '100%' : 'auto',
        ...(!toggleMode && { [theme.breakpoints.up('sm')]: { display: 'none' } }),
      };

      return (
        <Tooltip title={layerName} placement="top" arrow>
          <Typography sx={sxClasses} component="h3">
            {layerName}
          </Typography>
        </Tooltip>
      );
    }, [containerType, layerName, theme.breakpoints, theme.palette.geoViewFontSize.lg, toggleMode]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      showRightPanel: (visible: boolean) => {
        responsiveLayoutRef.current?.setIsRightPanelVisible(visible);
      },
    }));

    return (
      <ResponsiveGridLayout
        ref={responsiveLayoutRef}
        leftTop={layoutSwitch}
        leftMain={renderLayerList()}
        rightTop={renderLayerTitle()}
        rightMain={children}
        guideContentIds={guideContentIds}
        onIsEnlargeClicked={onIsEnlargeClicked}
        onGuideIsOpen={onGuideIsOpen}
        onRightPanelClosed={onRightPanelClosed}
        onRightPanelVisibilityChanged={onRightPanelVisibilityChanged}
        hideEnlargeBtn={hideEnlargeBtn}
        containerType={containerType}
        toggleMode={toggleMode}
      />
    );
  }
);

export { Layout };
export type { LayoutExposedMethods };
