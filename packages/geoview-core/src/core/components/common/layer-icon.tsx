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

/**
 * Icon Stack to represent layer icons
 *
 * @param {string} layerPath
 * @returns {JSX.Element} the icon stack item
 */
function IconStack({ layerPath, onIconClick, onStackIconClick }: TypeIconStackProps): JSX.Element | null {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const iconData = useIconLayerSet(layerPath);

  const iconImage: string = iconData?.length > 0 ? iconData[0] : '';
  const iconImageStacked: string = iconData?.length > 1 ? iconData[1] : '';
  const numOfIcons: number | undefined = iconData?.length;

  const iconStackContent = (): JSX.Element | null => {
    if (numOfIcons === 1) {
      return (
        <IconButton
          tabIndex={-1}
          sx={sxClasses.iconPreview}
          color="primary"
          size="small"
          onClick={iconImage === 'no data' ? undefined : onIconClick}
          aria-hidden="true"
        >
          {iconImage === 'no data' ? (
            <BrowserNotSupportedIcon />
          ) : (
            <Box sx={sxClasses.legendIcon}>
              <img alt="icon" src={iconImage} style={sxClasses.maxIconImg} />
            </Box>
          )}
        </IconButton>
      );
    }
    if (numOfIcons && numOfIcons > 0) {
      return (
        <Box tabIndex={-1} onClick={onIconClick} sx={sxClasses.stackIconsBox} onKeyPress={(e) => onStackIconClick?.(e)} aria-hidden="true">
          <IconButton sx={sxClasses.iconPreviewStacked} color="primary" size="small" tabIndex={-1} aria-hidden="true">
            <Box sx={sxClasses.legendIconTransparent}>
              {iconImageStacked && <img alt="icon" src={iconImageStacked} style={sxClasses.maxIconImg} />}
            </Box>
          </IconButton>
          <IconButton sx={sxClasses.iconPreviewHoverable} color="primary" size="small" tabIndex={-1} aria-hidden="true">
            <Box sx={sxClasses.legendIcon}>{iconImage && <img alt="icon" src={iconImage} style={sxClasses.maxIconImg} />}</Box>
          </IconButton>
        </Box>
      );
    }
    if (layerPath !== '' && iconData.length === 0 && layerPath.charAt(0) !== '!') {
      return (
        <Box tabIndex={-1} onClick={onIconClick} sx={sxClasses.stackIconsBox} onKeyPress={(e) => onStackIconClick?.(e)} aria-hidden="true">
          <IconButton sx={sxClasses.iconPreviewStacked} color="primary" size="small" tabIndex={-1} aria-hidden="true">
            <Box sx={sxClasses.legendIconTransparent}>
              <BrowserNotSupportedIcon />
            </Box>
          </IconButton>
        </Box>
      );
    }
    return null;
  };

  return iconStackContent();
}

interface LayerIconProps {
  layer: TypeLegendLayer | LayerListEntry;
}

export function LayerIcon({ layer }: LayerIconProps): JSX.Element {
  if (layer.layerStatus === 'error' || ('queryStatus' in layer && layer.queryStatus === 'error')) {
    return <ErrorIcon color="error" />;
  }
  if (
    layer.layerStatus === 'processing' ||
    layer.layerStatus === 'loading' ||
    ('queryStatus' in layer && layer.queryStatus === 'processing')
  ) {
    return (
      <Box sx={{ padding: '5px', marginRight: '10px' }}>
        <CircularProgressBase size={20} />
      </Box>
    );
  }
  if ('children' in layer && layer?.children.length) {
    return <GroupWorkOutlinedIcon color="primary" />;
  }
  return <IconStack layerPath={layer.layerPath} />;
}
