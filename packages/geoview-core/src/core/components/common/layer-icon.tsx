import { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, CircularProgressBase, ErrorIcon, GroupWorkOutlinedIcon, Icon, BrowserNotSupportedIcon } from '@/ui';

import { getSxClasses } from '@/core/components/common/layer-icon-style';
import {
  useLayerIconLayerSet,
  useLayerSelectorLayerValue,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { LegendQueryStatus }  from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import { logger } from '@/core/utils/logger';

export interface TypeIconStackProps {
  layerPath: string;
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
function IconStack({ layerPath }: TypeIconStackProps): JSX.Element | null {
  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const iconData = useLayerIconLayerSet(layerPath);

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
      <Icon {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreview}>
        {iconImage === 'no data' ? (
          <BrowserNotSupportedIcon />
        ) : (
          <Box sx={sxClasses.legendIcon}>
            <Box component="img" alt="icon" src={iconImage} sx={sxClasses.maxIconImg} />
          </Box>
        )}
      </Icon>
    );
  }, [iconImage, sxClasses.iconPreview, sxClasses.legendIcon, sxClasses.maxIconImg]);

  const renderStackedIcons = useCallback((): JSX.Element => {
    // Log
    logger.logTraceUseCallback('LAYER-ICON - renderStackedIcons');

    return (
      <Box sx={sxClasses.stackIconsBox} aria-hidden="true">
        <Icon {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreviewStacked}>
          <Box sx={sxClasses.legendIconTransparent}>
            {iconImageStacked && <Box component="img" alt="icon" src={iconImageStacked} sx={sxClasses.maxIconImg} />}
          </Box>
        </Icon>
        <Icon {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreviewHoverable}>
          <Box sx={sxClasses.legendIcon}>{iconImage && <Box component="img" alt="icon" src={iconImage} sx={sxClasses.maxIconImg} />}</Box>
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
    // Log
    logger.logTraceUseCallback('LAYER-ICON - renderNoDataIcon');

    return (
      <Box sx={sxClasses.stackIconsBox} aria-hidden="true">
        <Icon {...ICON_BUTTON_BASE_PROPS} sx={sxClasses.iconPreviewStacked}>
          <Box sx={sxClasses.legendIconTransparent}>
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
 * Shows loading spinner, error icon, group icon, or layer legend icons as needed.
 * @param {LayerIconProps} props - The component props
 * @param {string} props.layerPath - The path identifier for the layer
 * @returns {JSX.Element} The rendered layer icon component
 */
export function LayerIcon({ layerPath }: LayerIconProps): JSX.Element {
  // Log
  logger.logTraceRenderDetailed('components/common/layer-icon', layerPath);

  // Hooks
  const layerStatus = useLayerSelectorLayerValue<TypeLayerStatus>(layerPath, 'layerStatus');
  const legendQueryStatus = useLayerSelectorLayerValue<LegendQueryStatus>(layerPath, 'legendQueryStatus');
  const layerChildren = useLayerSelectorLayerValue<TypeLegendLayer[]>(layerPath, 'children');

  // If has children (is a group layer)
  const hasChildren = layerChildren && layerChildren.length;

  // If there is an error in layer or query status, flag it and show icon error
  const isError = layerStatus === 'error' || (legendQueryStatus && legendQueryStatus === 'error');
  if (isError) return <ErrorIcon color="error" />;

  // If the layer is loaded or loading or legend query status is queried, the icon is available
  const iconAvailable =
    legendQueryStatus === 'queried' || (hasChildren && layerStatus === 'loaded') || (hasChildren && layerStatus === 'loading');

  if (!iconAvailable) {
    return (
      <Box sx={LOADING_BOX_STYLES}>
        <CircularProgressBase size={20} />
      </Box>
    );
  }

  if (hasChildren) return <GroupWorkOutlinedIcon color="primary" />;

  return <IconStack layerPath={layerPath} />;
}
