import { memo, useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, CircularProgressBase, ErrorIcon, GroupWorkOutlinedIcon, IconButton, BrowserNotSupportedIcon } from '@/ui';

import { TypeLegendLayer } from '@/core/components/layers/types';
import { getSxClasses } from './layer-icon-style';
import { useIconLayerSet } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayerListEntry } from '.';

export interface TypeIconStackProps {
  layerPath: string;
  onIconClick?: () => void;
  onStackIconClick?: (e: React.KeyboardEvent<HTMLElement>) => void;
}

interface LayerIconProps {
  layer: TypeLegendLayer | LayerListEntry;
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

  const renderSingleIcon = useCallback(
    (): JSX.Element => (
      <IconButton {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreview} onClick={iconImage === 'no data' ? undefined : onIconClick}>
        {iconImage === 'no data' ? (
          <BrowserNotSupportedIcon />
        ) : (
          <Box sx={sxClasses.legendIcon}>
            <Box component="img" alt="icon" src={iconImage} sx={sxClasses.maxIconImg} />
          </Box>
        )}
      </IconButton>
    ),
    [iconImage, onIconClick, sxClasses.iconPreview, sxClasses.legendIcon, sxClasses.maxIconImg]
  );

  const renderStackedIcons = useCallback(
    (): JSX.Element => (
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
    ),
    [
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
    ]
  );

  const renderNoDataIcon = useCallback(
    (): JSX.Element => (
      <Box tabIndex={-1} onClick={onIconClick} sx={sxClasses.stackIconsBox} onKeyDown={onStackIconClick} aria-hidden="true">
        <IconButton {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreviewStacked}>
          <Box sx={sxClasses.legendIconTransparent}>
            <BrowserNotSupportedIcon />
          </Box>
        </IconButton>
      </Box>
    ),
    [onIconClick, onStackIconClick, sxClasses.iconPreviewStacked, sxClasses.legendIconTransparent, sxClasses.stackIconsBox]
  );

  if (numOfIcons === 1) return renderSingleIcon();
  if (numOfIcons && numOfIcons > 0) return renderStackedIcons();
  if (layerPath !== '' && iconData.length === 0 && layerPath.charAt(0) !== '!') {
    return renderNoDataIcon();
  }
  return null;
});

export const LayerIcon = memo(function LayerIcon({ layer }: LayerIconProps): JSX.Element {
  const isError = layer.layerStatus === 'error' || ('queryStatus' in layer && layer.queryStatus === 'error');

  const isLoading =
    (layer.layerStatus !== 'loaded' && layer.layerStatus !== 'error') || ('queryStatus' in layer && layer.queryStatus === 'processing');

  const hasChildren = 'children' in layer && layer?.children.length;

  if (isError) return <ErrorIcon color="error" />;

  if (isLoading) {
    return (
      <Box sx={LOADING_BOX_STYLES}>
        <CircularProgressBase size={20} />
      </Box>
    );
  }

  if (hasChildren) return <GroupWorkOutlinedIcon color="primary" />;

  return <IconStack layerPath={layer.layerPath} />;
});
