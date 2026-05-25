import { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, CircularProgressBase, ErrorIcon, Icon, BrowserNotSupportedIcon, LayerGroupIcon, TitleIcon } from '@/ui';

import { getSxClasses } from '@/core/components/common/layer-icon-style';
import {
  useStoreLayerIconLayerSet,
  useStoreLayerChildPaths,
  useStoreLayerLegendQueryStatus,
  useStoreLayerStatus,
} from '@/core/stores/states/layer-state';
import { logger } from '@/core/utils/logger';

/** Properties for the IconStack component. */
export interface TypeIconStackProps {
  layerPath: string;
}

/** Properties for the LayerIcon component. */
interface LayerIconProps {
  layerPath: string;
}

/** Styles for the loading spinner container. */
const LOADING_BOX_STYLES = {
  padding: '5px',
  marginRight: '10px',
} as const;

/** Base props shared across icon buttons. */
const ICON_BUTTON_BASE_PROPS = {
  color: 'primary' as const,
  size: 'small' as const,
  'aria-hidden': true,
};

/**
 * Renders a stack of layer legend icons.
 *
 * @param props - IconStack properties
 * @returns The icon stack element, or null if no icons
 */
function IconStack({ layerPath }: TypeIconStackProps): JSX.Element | null {
  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const iconData = useStoreLayerIconLayerSet(layerPath);

  const { iconImage, iconImageStacked, numOfIcons } = useMemo(
    () => ({
      iconImage: iconData?.length > 0 ? iconData[0] : '',
      iconImageStacked: iconData?.length > 1 ? iconData[1] : '',
      numOfIcons: iconData?.length,
    }),
    [iconData]
  );

  // TODO: WCAG Issue #3109 - Add meaningful alt text to image icons if needed
  const renderIconContent = useCallback((): JSX.Element | null => {
    if (iconImage === 'annotation') {
      return (
        <Box component="span" sx={sxClasses.iconBox}>
          <TitleIcon sx={sxClasses.titleIcon} />
        </Box>
      );
    }

    if (iconImage === 'no data') {
      return <BrowserNotSupportedIcon />;
    }

    return (
      <Box component="span" sx={sxClasses.legendIcon}>
        <Box component="img" alt="" src={iconImage} sx={sxClasses.maxIconImg} />
      </Box>
    );
  }, [iconImage, sxClasses.iconBox, sxClasses.legendIcon, sxClasses.maxIconImg, sxClasses.titleIcon]);

  const renderSingleIcon = useCallback((): JSX.Element => {
    return (
      <Icon {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreview}>
        {renderIconContent()}
      </Icon>
    );
  }, [renderIconContent, sxClasses.iconPreview]);

  const renderStackedIcons = useCallback((): JSX.Element => {
    return (
      <Box component="span" sx={sxClasses.stackIconsBox} aria-hidden="true">
        <Icon {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreviewStacked}>
          <Box component="span" sx={sxClasses.legendIconTransparent}>
            {iconImageStacked && <Box component="img" alt="" src={iconImageStacked} sx={sxClasses.maxIconImg} />}
          </Box>
        </Icon>
        <Icon {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreviewHoverable}>
          <Box component="span" sx={sxClasses.legendIcon}>
            {iconImage && <Box component="img" alt="" src={iconImage} sx={sxClasses.maxIconImg} />}
          </Box>
        </Icon>
      </Box>
    );
  }, [
    iconImage,
    iconImageStacked,
    sxClasses.iconPreviewHoverable,
    sxClasses.iconPreviewStacked,
    sxClasses.legendIcon,
    sxClasses.legendIconTransparent,
    sxClasses.maxIconImg,
    sxClasses.stackIconsBox,
  ]);

  const renderNoDataIcon = useCallback((): JSX.Element => {
    return (
      <Box component="span" sx={sxClasses.stackIconsBox} aria-hidden="true">
        <Icon {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreviewStacked}>
          <Box component="span" sx={sxClasses.legendIconTransparent}>
            <BrowserNotSupportedIcon />
          </Box>
        </Icon>
      </Box>
    );
  }, [sxClasses.iconPreviewStacked, sxClasses.legendIconTransparent, sxClasses.stackIconsBox]);

  if (numOfIcons === 1) return renderSingleIcon();
  if (numOfIcons && numOfIcons > 0) return renderStackedIcons();
  if (layerPath !== '' && iconData.length === 0 && layerPath.charAt(0) !== '!') {
    return renderNoDataIcon();
  }
  return null;
}

/**
 * Renders an appropriate icon for a layer based on its status and type.
 *
 * Shows loading spinner, error icon, group icon, or layer legend icons as needed.
 *
 * @param props - LayerIcon properties
 * @returns The rendered layer icon element
 */
export function LayerIcon({ layerPath }: LayerIconProps): JSX.Element {
  // Log
  logger.logTraceRenderDetailed('components/common/layer-icon', layerPath);

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const layerStatus = useStoreLayerStatus(layerPath);
  const legendQueryStatus = useStoreLayerLegendQueryStatus(layerPath);
  const layerChildPaths = useStoreLayerChildPaths(layerPath);

  // If has children (is a group layer)
  const hasChildren = layerChildPaths && layerChildPaths.length;

  // If there is an error in layer or query status, flag it and show icon error
  const isError = layerStatus === 'error' || (legendQueryStatus && legendQueryStatus === 'error');
  if (isError) return <ErrorIcon color="error" />;

  // If the layer is loaded or loading or legend query status is queried, the icon is available
  const iconAvailable =
    legendQueryStatus === 'queried' || (hasChildren && layerStatus === 'loaded') || (hasChildren && layerStatus === 'loading');

  if (!iconAvailable) {
    return (
      <Box component="span" sx={LOADING_BOX_STYLES}>
        <CircularProgressBase size={20} />
      </Box>
    );
  }

  if (hasChildren) {
    return (
      <Box sx={sxClasses.iconBox}>
        <LayerGroupIcon sx={sxClasses.groupIcon} />
      </Box>
    );
  }

  return <IconStack layerPath={layerPath} />;
}
