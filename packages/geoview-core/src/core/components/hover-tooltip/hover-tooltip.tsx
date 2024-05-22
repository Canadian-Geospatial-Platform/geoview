import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';

import { Box } from '@/ui';
import { logger } from '@/core/utils/logger';
import { useMapHoverFeatureInfo, useMapPointerPosition } from '@/core/stores/store-interface-and-intial-values/map-state';
import { getSxClasses } from './hover-tooltip-styles';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

/**
 * Hover tooltip component to show name field information on hover
 *
 * @returns {JSX.Element} the hover tooltip component
 */
export function HoverTooltip(): JSX.Element | null {
  // Log, commented too annoying
  // logger.logTraceRender('components/hover-tooltip/hover-tooltip');

  const { t } = useTranslation<string>();
  const mapId = useGeoViewMapId();

  const theme: Theme & {
    iconImage: React.CSSProperties;
  } = useTheme();

  // internal component state
  const [tooltipValue, setTooltipValue] = useState<string>('');
  const [tooltipIcon, setTooltipIcon] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const sxClasses = getSxClasses(theme);

  // store state
  const hoverFeatureInfo = useMapHoverFeatureInfo();
  const pointerPosition = useMapPointerPosition();
  const mapElem = document.getElementById(`mapTargetElement-${mapId}`) as HTMLElement;

  const tooltipRef = useRef<HTMLDivElement>(null);



  // Update tooltip when store value change from propagation by hover-layer-set to map-event-processor
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('HOVER-TOOLTIP - hoverFeatureInfo', hoverFeatureInfo);

    if (hoverFeatureInfo) {
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

  }, [pointerPosition]);


  // Update tooltip position when we have the dimensions of the tooltip
  useEffect(() => {
    if(!mapElem || !tooltipRef.current || !pointerPosition || !pointerPosition.pixel) {
      return;
    }

    const mapRect = mapElem.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    // Check if the tooltip is outside the map
    let tooltipX = pointerPosition.pixel[0];
    let tooltipY = pointerPosition.pixel[1] - 35;

    if (pointerPosition.pixel[0] + tooltipRect.width > mapRect.width) {
      tooltipX = pointerPosition.pixel[0] - (tooltipRect.width );
    }

    if (pointerPosition.pixel[1] - tooltipRect.height < mapRect.top) {
      tooltipY = pointerPosition.pixel[1]+ 10;
    }

    tooltipRef.current.style.left = `${tooltipX}px`;
    tooltipRef.current.style.top = `${tooltipY}px`;

  }, [tooltipValue]);

  

  if (showTooltip && !tooltipValue) {
    return null;
  }

  return (
    <Box
      ref={tooltipRef}
      sx={sxClasses.tooltipItem}
      style={{
        visibility: showTooltip ? 'visible' : 'hidden',
      }}
    >
      <Box component="img" className="layer-icon" alt={t('hovertooltip.alticon')!} src={tooltipIcon} />
      <Box sx={sxClasses.tooltipText}>{tooltipValue}</Box>
    </Box>
  );
}
