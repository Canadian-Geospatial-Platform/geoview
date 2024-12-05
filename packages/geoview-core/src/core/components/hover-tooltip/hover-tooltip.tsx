import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';
import { Box } from '@/ui';

import { logger } from '@/core/utils/logger';
import {
  useMapHoverFeatureInfo,
  useMapIsMouseInsideMap,
  useMapPointerPosition,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { getSxClasses } from './hover-tooltip-styles';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';

/**
 * Hover tooltip component to show name field information on hover
 *
 * @returns {JSX.Element} the hover tooltip component
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const HoverTooltip = memo(function HoverTooltip(): JSX.Element | null {
  // Log, commented too annoying
  // logger.logTraceRender('components/hover-tooltip/hover-tooltip');

  // Hooks
  const { t } = useTranslation<string>();
  const theme: Theme & {
    iconImage: React.CSSProperties;
  } = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipValue, setTooltipValue] = useState<string>('');
  const [tooltipIcon, setTooltipIcon] = useState<string>('');

  // Store
  const hoverFeatureInfo = useMapHoverFeatureInfo();
  const pointerPosition = useMapPointerPosition();
  const isMouseouseInMap = useMapIsMouseInsideMap();
  const mapElem = useAppGeoviewHTMLElement().querySelector(`[id^="mapTargetElement-${useGeoViewMapId()}"]`) as HTMLElement;

  useEffect(() => {
    logger.logTraceUseEffect('HOVER-TOOLTIP - tooltipValue changed', tooltipValue);

    if (!mapElem || !tooltipRef.current || !pointerPosition || !pointerPosition.pixel || !tooltipValue) {
      tooltipRef.current!.style.left = `-1000px`;
      tooltipRef.current!.style.top = `-1000px`;

      return;
    }

    const mapRect = mapElem.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    // Check if the tooltip is outside the map
    let tooltipX = pointerPosition.pixel[0] + 10;
    let tooltipY = pointerPosition.pixel[1] - 35;

    if (pointerPosition.pixel[0] + tooltipRect.width > mapRect.width) {
      tooltipX = pointerPosition.pixel[0] - tooltipRect.width - 10;
    }

    if (pointerPosition.pixel[1] - tooltipRect.height < mapRect.top) {
      tooltipY = pointerPosition.pixel[1] + 10;
    }

    tooltipRef.current.style.left = `${tooltipX}px`;
    tooltipRef.current.style.top = `${tooltipY}px`;
  }, [tooltipValue, mapElem, pointerPosition]);

  // Update tooltip when store value change from propagation by hover-layer-set to map-event-processor
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('HOVER-TOOLTIP - hoverFeatureInfo', hoverFeatureInfo);

    if (hoverFeatureInfo && isMouseouseInMap) {
      setTooltipValue((hoverFeatureInfo.fieldInfo?.value as string) || '');
      setTooltipIcon(hoverFeatureInfo.featureIcon.toDataURL());
    }
  }, [hoverFeatureInfo, isMouseouseInMap]);

  // Clear tooltip on mouse move
  useEffect(() => {
    setTooltipIcon('');
    setTooltipValue('');
  }, [pointerPosition]);

  return (
    <Box ref={tooltipRef} sx={sxClasses.tooltipItem}>
      <Box component="img" className="layer-icon" alt={t('hovertooltip.alticon')!} src={tooltipIcon} />
      <Box sx={sxClasses.tooltipText}>{tooltipValue}</Box>
    </Box>
  );
});
