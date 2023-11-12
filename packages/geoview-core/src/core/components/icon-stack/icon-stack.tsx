/* eslint-disable react/require-default-props */
import React from 'react';
import { Box, IconButton, BrowserNotSupportedIcon } from '@/ui';
import { getSxClasses } from './icon-stack-style';
import { layerInfo, TypeLayerInfo } from './helper';
// TODO uncomment line below when you have layers and icons in the store
// import { useIconLayerSet } from '@/core/stores/store-interface-and-intial-values/layer-state';

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

  // TODO use line below when we can get layers and their icons from the store
  // const iconData = useIconLayerSet(layerPath);

  // TODO function below is using the fake data, remove it once you have layers and icons in the store
  const findIconsData = (layerPathStr: string): string[] | undefined => {
    const foundMatchedLayerPath: TypeLayerInfo | undefined = layerInfo.find((layer: TypeLayerInfo) => layer.layerPath === layerPathStr);
    return foundMatchedLayerPath?.iconData;
  };
  const iconData = findIconsData(layerPath);

  const iconImg: string = iconData && iconData.length > 0 ? iconData[0] : '';
  const iconImgStacked: string = iconData && iconData.length > 1 ? iconData[1] : '';
  const numOfIcons: number | undefined = iconData?.length;

  // TODO for now just use 2 icons
  // eslint-disable-next-line no-nested-ternary
  return numOfIcons === 1 ? (
    <IconButton sx={sxClasses.iconPreview} color="primary" size="small" onClick={iconImg === 'no data' ? undefined : onIconClick}>
      {iconImg === 'no data' ? (
        <BrowserNotSupportedIcon />
      ) : (
        <Box sx={sxClasses.legendIcon}>
          <img alt="icon" src={iconImg} style={sxClasses.maxIconImg} />
        </Box>
      )}
    </IconButton>
  ) : numOfIcons && numOfIcons > 0 ? (
    <Box tabIndex={0} onClick={onIconClick} sx={sxClasses.stackIconsBox} onKeyPress={(e) => onStackIconClick?.(e)}>
      <IconButton sx={sxClasses.iconPreviewStacked} color="primary" size="small" tabIndex={-1}>
        <Box sx={sxClasses.legendIconTransparent}>
          {iconImgStacked && <img alt="icon" src={iconImgStacked} style={sxClasses.maxIconImg} />}
        </Box>
      </IconButton>
      <IconButton sx={sxClasses.iconPreviewHoverable} color="primary" size="small" tabIndex={-1}>
        <Box sx={sxClasses.legendIcon}>{iconImg && <img alt="icon" src={iconImg} style={sxClasses.maxIconImg} />}</Box>
      </IconButton>
    </Box>
  ) : null;
}
