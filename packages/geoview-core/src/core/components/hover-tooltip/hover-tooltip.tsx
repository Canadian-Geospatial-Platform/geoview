import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';

import { Box } from '@/ui';
import { logger } from '@/core/utils/logger';
import { useMapHoverFeatureInfo, useMapPointerPosition } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Hover tooltip component to show name field information on hover
 *
 * @returns {JSX.Element} the hover tooltip component
 */
export function HoverTooltip(): JSX.Element {
  // Log, commented too annoying
  // logger.logTraceRender('components/hover-tooltip/hover-tooltip');

  const { t } = useTranslation<string>();

  const theme: Theme & {
    iconImage: React.CSSProperties;
  } = useTheme();

  const sxClasses = {
    tooltipItem: {
      color: theme.palette.geoViewColor.bgColor.light[900],
      background: theme.palette.geoViewColor.bgColor.dark[900],
      opacity: 0.9,
      fontSize: theme.palette.geoViewFontSize.default,
      padding: '3px 8px',
      borderRadius: '5px',
      textAlign: 'center',
      maxWidth: '350px',
      maxHeight: '60px',
      position: 'absolute',
      display: 'flex',
      top: '-5px',
      left: '3px',
    },
    tooltipText: {
      fontSize: theme.palette.geoViewFontSize.default,
      color: theme.palette.geoViewColor.bgColor.light[900],
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      padding: '5px',
    },
  };

  // internal component state
  const [pixel, setPixel] = useState<[number, number]>([0, 0]);
  const [tooltipValue, setTooltipValue] = useState<string>('');
  const [tooltipIcon, setTooltipIcon] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // store state
  const hoverFeatureInfo = useMapHoverFeatureInfo();
  const pointerPosition = useMapPointerPosition();

  // Update tooltip when store value change from propagation by hover-layer-set to map-event-processor
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('HOVER-TOOLTIP - hoverFeatureInfo', hoverFeatureInfo);

    if (hoverFeatureInfo !== undefined && hoverFeatureInfo !== null) {
      setTooltipValue(hoverFeatureInfo!.fieldInfo?.value as string | '');
      setTooltipIcon(hoverFeatureInfo!.featureIcon.toDataURL());
      setShowTooltip(true);
    }
  }, [hoverFeatureInfo]);

  // clear the tooltip and mouse move and set pixel location
  useEffect(() => {
    // Log, commented too annoying
    // logger.logTraceUseEffect('HOVER-TOOLTIP - pointerPosition', pointerPosition);

    setTooltipValue('');
    setTooltipIcon('');
    setShowTooltip(false);

    if (pointerPosition !== undefined) setPixel(pointerPosition.pixel as [number, number]);
  }, [pointerPosition]);

  return (
    <Box
      sx={sxClasses.tooltipItem}
      style={{
        transform: `translate(${pixel[0]}px, ${pixel[1] - 35}px)`,
        visibility: showTooltip ? 'visible' : 'hidden',
      }}
    >
      <Box component="img" className="layer-icon" alt={t('hovertooltip.alticon')!} src={tooltipIcon} />
      <Box sx={sxClasses.tooltipText}>{tooltipValue}</Box>
    </Box>
  );
}
