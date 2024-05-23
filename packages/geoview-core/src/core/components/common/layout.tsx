import { useCallback, ReactNode, useRef, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { logger } from '@/core/utils/logger';
import { LayerList, LayerListEntry } from './layer-list';
import { ResponsiveGridLayout, ResponsiveGridLayoutExposedMethods } from './responsive-grid-layout';
import { Tooltip, Typography } from '@/ui';

interface LayoutProps {
  children?: ReactNode;
  guideContentIds?: string[];
  layerList: LayerListEntry[];
  selectedLayerPath: string | undefined;
  onLayerListClicked: (layer: LayerListEntry) => void;
  onIsEnlargeClicked?: (isEnlarge: boolean) => void;
  fullWidth?: boolean;
  onGuideIsOpen?: (isGuideOpen: boolean) => void;
}

export function Layout({
  children,
  guideContentIds,
  layerList,
  selectedLayerPath,
  onLayerListClicked,
  onIsEnlargeClicked,
  fullWidth,
  onGuideIsOpen,
}: LayoutProps): JSX.Element {
  const responsiveLayoutRef = useRef<ResponsiveGridLayoutExposedMethods>(null);
  const theme = useTheme();

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
      fontSize: theme.palette.geoViewFontSize.lg,
      textAlign: fullWidth ? 'center' : 'left',
      fontWeight: '600',
      marginTop: '12px',
      overflow: 'hidden',
      display: '-webkit-box',
      '-webkit-box-orient': 'vertical',
      '-webkit-line-clamp': '2',
      ...(!fullWidth && { [theme.breakpoints.up('md')]: { display: 'none' } }),
    };

    return (
      <Tooltip title={memoLayerTitle} placement="top" arrow>
        <Typography sx={sxClasses} component="div">
          {memoLayerTitle}
        </Typography>
      </Tooltip>
    );
  }, [fullWidth, memoLayerTitle]);

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
    />
  );
}
