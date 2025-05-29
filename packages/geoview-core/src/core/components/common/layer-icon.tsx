import { memo, useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, CircularProgressBase, ErrorIcon, GroupWorkOutlinedIcon, IconButton, BrowserNotSupportedIcon } from '@/ui';

import { getSxClasses } from '@/core/components/common/layer-icon-style';
import {
  useIconLayerSet,
  useSelectorLayerChildren,
  useSelectorLayerLegendQueryStatus,
  useSelectorLayerStatus,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { logger } from '@/core/utils/logger';

export interface TypeIconStackProps {
  layerPath: string;
  onIconClick?: () => void;
  onStackIconClick?: (event: React.KeyboardEvent<HTMLElement>) => void;
}

interface LayerIconProps {
  layerPath: string;
}

// Constants outside component to prevent recreating every render
const LOADING_BOX_STYLES = {
  padding: '5px',
  marginRight: '10px',
} as const;

const ICON_BUTTON_BASE_PROPS = {
  color: 'primary' as const,
  size: 'small' as const,
  tabIndex: -1,
  'aria-hidden': true,
};

/**
 * Icon Stack to represent layer icons
 *
 * @param {string} layerPath
 * @returns {JSX.Element} the icon stack item
 */
// Memoizes entire component, preventing re-renders if props haven't changed
// TODO: Unmemoize this component, probably, because it's in 'common' folder
const IconStack = memo(function IconStack({ layerPath, onIconClick, onStackIconClick }: TypeIconStackProps): JSX.Element | null {
  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const iconData = useIconLayerSet(layerPath);

  const { iconImage, iconImageStacked, numOfIcons } = useMemo(
    () => ({
      iconImage: iconData?.length > 0 ? iconData[0] : '',
      iconImageStacked: iconData?.length > 1 ? iconData[1] : '',
      numOfIcons: iconData?.length,
    }),
    [iconData]
  );

  const renderSingleIcon = useCallback((): JSX.Element => {
    // Log
    logger.logTraceUseCallback('LAYER-ICON - renderSingleIcon');

    return (
      <IconButton {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreview} onClick={iconImage === 'no data' ? undefined : onIconClick}>
        {iconImage === 'no data' ? (
          <BrowserNotSupportedIcon />
        ) : (
          <Box sx={sxClasses.legendIcon}>
            <Box component="img" alt="icon" src={iconImage} sx={sxClasses.maxIconImg} />
          </Box>
        )}
      </IconButton>
    );
  }, [iconImage, onIconClick, sxClasses.iconPreview, sxClasses.legendIcon, sxClasses.maxIconImg]);

  const renderStackedIcons = useCallback((): JSX.Element => {
    // Log
    logger.logTraceUseCallback('LAYER-ICON - renderStackedIcons');

    return (
      <Box tabIndex={-1} onClick={onIconClick} sx={sxClasses.stackIconsBox} onKeyDown={onStackIconClick} aria-hidden="true">
        <IconButton {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreviewStacked}>
          <Box sx={sxClasses.legendIconTransparent}>
            {iconImageStacked && <Box component="img" alt="icon" src={iconImageStacked} sx={sxClasses.maxIconImg} />}
          </Box>
        </IconButton>
        <IconButton {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreviewHoverable}>
          <Box sx={sxClasses.legendIcon}>{iconImage && <Box component="img" alt="icon" src={iconImage} sx={sxClasses.maxIconImg} />}</Box>
        </IconButton>
      </Box>
    );
  }, [
    iconImage,
    iconImageStacked,
    onIconClick,
    onStackIconClick,
    sxClasses.iconPreviewHoverable,
    sxClasses.iconPreviewStacked,
    sxClasses.legendIcon,
    sxClasses.legendIconTransparent,
    sxClasses.maxIconImg,
    sxClasses.stackIconsBox,
  ]);

  const renderNoDataIcon = useCallback((): JSX.Element => {
    // Log
    logger.logTraceUseCallback('LAYER-ICON - renderNoDataIcon');

    return (
      <Box tabIndex={-1} onClick={onIconClick} sx={sxClasses.stackIconsBox} onKeyDown={onStackIconClick} aria-hidden="true">
        <IconButton {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreviewStacked}>
          <Box sx={sxClasses.legendIconTransparent}>
            <BrowserNotSupportedIcon />
          </Box>
        </IconButton>
      </Box>
    );
  }, [onIconClick, onStackIconClick, sxClasses.iconPreviewStacked, sxClasses.legendIconTransparent, sxClasses.stackIconsBox]);

  if (numOfIcons === 1) return renderSingleIcon();
  if (numOfIcons && numOfIcons > 0) return renderStackedIcons();
  if (layerPath !== '' && iconData.length === 0 && layerPath.charAt(0) !== '!') {
    return renderNoDataIcon();
  }
  return null;
});

// TODO: Unmemoize this component, probably, because it's in 'common' folder
export const LayerIcon = memo(function LayerIcon({ layerPath }: LayerIconProps): JSX.Element {
  // Log
  logger.logTraceRenderDetailed('components/common/layer-icon', layerPath);

  // Hooks
  const layerStatus = useSelectorLayerStatus(layerPath);
  const layerQueryStatus = useSelectorLayerLegendQueryStatus(layerPath);
  const layerChildren = useSelectorLayerChildren(layerPath);

  // If there is an error in layer or query status, flag it and show icon error
  const isError = layerStatus === 'error' || (layerQueryStatus && layerQueryStatus === 'error');
  if (isError) return <ErrorIcon color="error" />;

  // If the layer isn't 'loaded' and isn't 'loading', or the legend is still being queried, the icon should show the spinner
  const showSpinner = (layerStatus !== 'loaded' && layerStatus !== 'loading') || layerQueryStatus === 'querying';

  if (showSpinner) {
    return (
      <Box sx={LOADING_BOX_STYLES}>
        <CircularProgressBase size={20} />
      </Box>
    );
  }

  const hasChildren = layerChildren && layerChildren.length;
  if (hasChildren) return <GroupWorkOutlinedIcon color="primary" />;

  return <IconStack layerPath={layerPath} />;
});
