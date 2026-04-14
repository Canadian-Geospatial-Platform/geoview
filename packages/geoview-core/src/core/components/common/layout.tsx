import type { ReactNode, Ref } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';

import { useTheme } from '@mui/material/styles';

import { Typography } from '@/ui';
import type { LayerListEntry } from './layer-list';
import { LayerList } from './layer-list';
import type { ResponsiveGridLayoutExposedMethods } from './responsive-grid-layout';
import { ResponsiveGridLayout } from './responsive-grid-layout';
import type { TypeContainerBox } from '@/core/types/global-types';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { useStoreLayerName } from '@/core/stores/store-interface-and-intial-values/layer-state';

/** Properties for the Layout component. */
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
  containerType: TypeContainerBox;
  titleFullscreen: string;
  hideEnlargeBtn?: boolean;
  toggleMode?: boolean;
}

/** Styles for the layer title in the right panel header. */
const TITLE_STYLES = {
  fontWeight: '600',
} as const;

/** Methods exposed by the Layout component via ref. */
interface LayoutExposedMethods {
  /** Shows or hides the right panel. */
  showRightPanel: (visible: boolean) => void;
}

/**
 * Creates a two-panel layout with a layer list on the left and content on the right.
 *
 * @param props - Layout properties
 * @param ref - Ref exposing showRightPanel method
 * @returns The two-panel layout element
 */
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
      containerType,
      titleFullscreen,
      hideEnlargeBtn,
      toggleMode = false,
    }: LayoutProps,
    ref: Ref<LayoutExposedMethods>
  ) => {
    logger.logTraceRender('components/common/layout');

    // Hooks
    const responsiveLayoutRef = useRef<ResponsiveGridLayoutExposedMethods>(null);
    const theme = useTheme();
    const layerName = useStoreLayerName(selectedLayerPath!);

    // #region Handlers

    /**
     * Selects a layer from the left panel and shows the right panel.
     *
     * @param layer - The selected layer entry
     */
    const handleLayerChange = useCallback(
      (layer: LayerListEntry): void => {
        onLayerListClicked?.(layer);

        // Show the panel (hiding the layers list in the process if we're on mobile)
        responsiveLayoutRef.current?.setIsRightPanelVisible(true);

        // Focus is deferred inside setRightPanelFocus with requestAnimationFrame
        responsiveLayoutRef.current?.setRightPanelFocus();
      },
      [onLayerListClicked]
    );

    // #endregion Handlers

    /**
     * Memoized layer list component for the left panel.
     */
    const memoLayerList = useMemo((): JSX.Element => {
      logger.logTraceUseMemo('LAYOUT - memoLayerList', selectedLayerPath, handleLayerChange, layerList);

      return <LayerList selectedLayerPath={selectedLayerPath} onListItemClick={handleLayerChange} layerList={layerList} />;
    }, [selectedLayerPath, handleLayerChange, layerList]);

    /**
     * Memoized layer title component for the right panel header.
     */
    const memoLayerTitle = useMemo((): JSX.Element | null => {
      logger.logTraceUseMemo(
        'LAYOUT - memoLayerTitle',
        containerType,
        layerName,
        theme.breakpoints,
        theme.palette.geoViewFontSize.lg,
        toggleMode
      );

      if (!layerName) return null; // Don't render when no layer selected

      // clamping code copied from https://tailwindcss.com/docs/line-clamp
      const sxClasses = {
        ...TITLE_STYLES,
        fontSize: theme.palette.geoViewFontSize.lg,
        width: containerType === CONTAINER_TYPE.APP_BAR ? '100%' : 'auto',
        ...(!toggleMode && { [theme.breakpoints.up('sm')]: { display: 'none' } }),
      };

      return (
        <Typography sx={sxClasses} component="h3">
          {layerName}
        </Typography>
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
        leftMain={memoLayerList}
        rightTop={memoLayerTitle}
        rightMain={children}
        guideContentIds={guideContentIds}
        onIsEnlargeClicked={onIsEnlargeClicked}
        onGuideIsOpen={onGuideIsOpen}
        onRightPanelClosed={onRightPanelClosed}
        onRightPanelVisibilityChanged={onRightPanelVisibilityChanged}
        hideEnlargeBtn={hideEnlargeBtn}
        containerType={containerType}
        titleFullscreen={titleFullscreen}
        toggleMode={toggleMode}
      />
    );
  }
);

export { Layout };
export type { LayoutExposedMethods };
