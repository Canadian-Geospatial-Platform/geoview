/* eslint-disable react/require-default-props */
import React from 'react';
import { Box, IconButton, BrowserNotSupportedIcon } from '@/ui';
import { getSxClasses } from './icon-stack-style';
import { useIconLayerSet } from '@/core/stores/store-interface-and-intial-values/layer-state';

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
export function IconStack({ layerPath, onIconClick, onStackIconClick }: TypeIconStackProps): JSX.Element | null {
  const sxClasses = getSxClasses();

  const iconData = useIconLayerSet(layerPath);

  const iconImage: string = iconData && iconData.length > 0 ? iconData[0] : '';
  const iconImageStacked: string = iconData && iconData.length > 1 ? iconData[1] : '';
  const numOfIcons: number | undefined = iconData?.length;

  // TODO for now just use 2 icons
  // eslint-disable-next-line no-nested-ternary
  return numOfIcons === 1 ? (
    <IconButton sx={sxClasses.iconPreview} color="primary" size="small" onClick={iconImage === 'no data' ? undefined : onIconClick}>
      {iconImage === 'no data' ? (
        <BrowserNotSupportedIcon />
      ) : (
        <Box sx={sxClasses.legendIcon}>
          <img alt="icon" src={iconImage} style={sxClasses.maxIconImg} />
        </Box>
      )}
    </IconButton>
  ) : numOfIcons && numOfIcons > 0 ? (
    <Box tabIndex={0} onClick={onIconClick} sx={sxClasses.stackIconsBox} onKeyPress={(e) => onStackIconClick?.(e)}>
      <IconButton sx={sxClasses.iconPreviewStacked} color="primary" size="small" tabIndex={-1}>
        <Box sx={sxClasses.legendIconTransparent}>
          {iconImageStacked && <img alt="icon" src={iconImageStacked} style={sxClasses.maxIconImg} />}
        </Box>
      </IconButton>
      <IconButton sx={sxClasses.iconPreviewHoverable} color="primary" size="small" tabIndex={-1}>
        <Box sx={sxClasses.legendIcon}>{iconImage && <img alt="icon" src={iconImage} style={sxClasses.maxIconImg} />}</Box>
      </IconButton>
    </Box>
  ) : (
    <Box tabIndex={0} onClick={onIconClick} sx={sxClasses.stackIconsBox} onKeyPress={(e) => onStackIconClick?.(e)}>
      <IconButton sx={sxClasses.iconPreviewStacked} color="primary" size="small" tabIndex={-1}>
        <Box sx={sxClasses.legendIconTransparent}>
          <BrowserNotSupportedIcon />
        </Box>
      </IconButton>
    </Box>
  );
}
