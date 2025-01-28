import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { TypeMapMouseInfo } from '@/geo/map/map-viewer';

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

  // Keep track of previous hoverFeatureInfo
  const prevHoverFeatureInfo = useRef(hoverFeatureInfo);

  const updateTooltipPosition = useCallback(
    (currentMapElem: HTMLElement | null, currentPosition: TypeMapMouseInfo | undefined, currentTooltipValue: string) => {
      if (!currentMapElem || !tooltipRef.current || !currentPosition?.pixel || !currentTooltipValue) {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = `-1000px`;
          tooltipRef.current.style.top = `-1000px`;
        }
        return;
      }

      const mapRect = currentMapElem.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // Check if the tooltip is outside the map
      let tooltipX = currentPosition.pixel[0] + 10;
      let tooltipY = currentPosition.pixel[1] - 35;

      if (currentPosition.pixel[0] + tooltipRect.width > mapRect.width) {
        tooltipX = currentPosition.pixel[0] - tooltipRect.width - 10;
      }

      if (currentPosition.pixel[1] - tooltipRect.height < mapRect.top) {
        tooltipY = currentPosition.pixel[1] + 10;
      }

      tooltipRef.current.style.left = `${tooltipX}px`;
      tooltipRef.current.style.top = `${tooltipY}px`;
    },
    []
  );

  // Update tooltip when store value change from propagation by hover-layer-set to map-event-processor
  useEffect(() => {
    // Check if the feature info has actually changed
    const currentValue = hoverFeatureInfo?.fieldInfo?.value as string;
    const previousValue = prevHoverFeatureInfo.current?.fieldInfo?.value as string;

    // Only re render if there is a new value and mouse in map
    if (hoverFeatureInfo && isMouseouseInMap && currentValue !== previousValue) {
      // Log
      logger.logTraceUseEffect('HOVER-TOOLTIP - hoverFeatureInfo', hoverFeatureInfo);

      setTooltipValue((hoverFeatureInfo.fieldInfo?.value as string) || '');
      setTooltipIcon(hoverFeatureInfo.featureIcon.toDataURL());
      updateTooltipPosition(mapElem, pointerPosition, (hoverFeatureInfo.fieldInfo?.value as string) || '');
    }

    // Update the ref with current value
    prevHoverFeatureInfo.current = hoverFeatureInfo;
  }, [hoverFeatureInfo, isMouseouseInMap, mapElem, pointerPosition, updateTooltipPosition]);

  // Clear tooltip on mouse move
  useEffect(() => {
    if (tooltipIcon !== '' || tooltipValue !== '')
    setTooltipIcon('');
    setTooltipValue('');
    updateTooltipPosition(null, undefined, '');
  }, [pointerPosition, updateTooltipPosition]);

  return (
    <Box ref={tooltipRef} sx={sxClasses.tooltipItem}>
      <Box component="img" className="layer-icon" alt={t('hovertooltip.alticon')!} src={tooltipIcon} />
      <Box sx={sxClasses.tooltipText}>{tooltipValue}</Box>
    </Box>
  );
});
