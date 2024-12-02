import { memo, useCallback, useEffect, useRef, useState } from 'react';
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
  const sxClasses = getSxClasses(theme);

  // State
  const [tooltipValue, setTooltipValue] = useState('');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipState = useRef({
    value: '',
    icon: '',
    show: false,
  }); // state management using refs to avoid re-renders

  // Store
  const hoverFeatureInfo = useMapHoverFeatureInfo();
  const pointerPosition = useMapPointerPosition();
  const isMouseouseInMap = useMapIsMouseInsideMap();
  const mapElem = useAppGeoviewHTMLElement().querySelector(`[id^="mapTargetElement-${useGeoViewMapId()}"]`) as HTMLElement;

  // Callbacks
  const hideTooltip = useCallback(() => {
    tooltipState.current = {
      value: '',
      icon: '',
      show: false,
    };
  }, []);

  // Update tooltip position when we have the dimensions of the tooltip
  const updateTooltipPosition = useCallback(() => {
    if (!mapElem || !tooltipRef.current || !pointerPosition?.pixel || !tooltipState.current.value) {
      return;
    }

    const mapRect = mapElem.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

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
  }, [mapElem, pointerPosition]);

  // Update tooltip when store value change from propagation by hover-layer-set to map-event-processor
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('HOVER-TOOLTIP - hoverFeatureInfo', hoverFeatureInfo);

    if (!hoverFeatureInfo || !isMouseouseInMap) {
      // clear the tooltip, no info at pixel location
      hideTooltip();
    } else {
      tooltipState.current = {
        value: (hoverFeatureInfo.fieldInfo?.value as string) || '',
        icon: hoverFeatureInfo.featureIcon.toDataURL(),
        show: true,
      };

      // Use value to force the ref state to change (multiple hoverInfo response)
      // TODO: refactor: From the hover layer set, only return the good value
      setTooltipValue((hoverFeatureInfo.fieldInfo?.value as string) || '');

      updateTooltipPosition();
    }
  }, [hideTooltip, hoverFeatureInfo, isMouseouseInMap, updateTooltipPosition]);

  // Clear tooltip on mouse move
  useEffect(() => {
    hideTooltip();
  }, [pointerPosition, hideTooltip]);

  // Don't render if we should show tooltip but have no value
  if (tooltipState.current.show && !tooltipState.current.value) {
    return null;
  }

  return (
    <Box
      ref={tooltipRef}
      sx={sxClasses.tooltipItem}
      style={{
        visibility: tooltipState.current.show ? 'visible' : 'hidden',
      }}
    >
      <Box component="img" className="layer-icon" alt={t('hovertooltip.alticon')!} src={tooltipState.current.icon} />
      <Box sx={sxClasses.tooltipText}>{tooltipValue}</Box>
    </Box>
  );
});
