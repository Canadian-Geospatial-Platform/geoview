import { memo, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';
import { Box } from '@/ui';

import {
  getMapPointerPosition,
  useMapHoverFeatureInfo,
  useMapIsMouseInsideMap,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { getSxClasses } from './hover-tooltip-styles';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { logger } from '@/core/utils/logger';

export const HoverTooltip = memo(function HoverTooltip(): JSX.Element | null {
  // Log, commented too annoying
  logger.logTraceRender('components/hover-tooltip/hover-tooltip');

  // Hooks
  const { t } = useTranslation<string>();
  const theme: Theme & {
    iconImage: React.CSSProperties;
  } = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Refs
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mapRectRef = useRef<DOMRect | null>(null);

  // Store values
  const mapId = useGeoViewMapId();
  const hoverFeatureInfo = useMapHoverFeatureInfo();
  const isMouseouseInMap = useMapIsMouseInsideMap();
  const mapElem = useAppGeoviewHTMLElement().querySelector(`[id^="mapTargetElement-${useGeoViewMapId()}"]`) as HTMLElement;

  // Calculate position with boundary checks
  const position = useMemo(() => {
    // Use store getter, we do not subcribe to modification and use it only when needed
    const pointerPosition = getMapPointerPosition(mapId);

    // Early return in memo
    // Check for all required conditions upfront
    if (!pointerPosition?.pixel || !mapElem || !hoverFeatureInfo?.fieldInfo?.value || !isMouseouseInMap) {
      return { left: '0px', top: '0px', isValid: false };
    }
    logger.logTraceUseMemo('HOVER TOOLTIP - position', pointerPosition);

    let tooltipX = pointerPosition.pixel[0] + 10;
    let tooltipY = pointerPosition.pixel[1] - 30;

    // Approximate width calculation (50px for empty tooltip)
    // Assuming average character width of 10px and adding padding/margins
    const approximateWidth = 50 + String(hoverFeatureInfo.fieldInfo?.value).length * 10;

    // Only get getBoundingClientRect if we don't have it stored
    if (!mapRectRef.current) mapRectRef.current = mapElem.getBoundingClientRect();

    // Convert pointer position to be relative to map container and check if tooltip would overflow the viewport
    const relativePointerX = pointerPosition.pixel[0] + mapRectRef.current.left;
    const wouldOverflow = relativePointerX + approximateWidth > mapRectRef.current.right;

    // If overflow, apply offset
    if (wouldOverflow) tooltipX -= approximateWidth;

    // For height we can use a fixed value since tooltip is typically single line
    if (tooltipY < mapRectRef.current.top) tooltipY = pointerPosition.pixel[1] + 10;

    return { left: `${tooltipX}px`, top: `${tooltipY}px`, isValid: true };
  }, [hoverFeatureInfo, isMouseouseInMap, mapElem, mapId]);

  // Compute tooltip content and visibility
  const tooltipContent = useMemo(() => {
    if (!hoverFeatureInfo || !position.isValid) {
      return {
        content: { value: '', icon: '' },
        isVisible: false,
      };
    }

    logger.logTraceUseMemo('HOVER TOOLTIP - tooltipContent', hoverFeatureInfo);
    return {
      content: {
        value: (hoverFeatureInfo.fieldInfo?.value as string) || '',
        icon: hoverFeatureInfo.featureIcon ? hoverFeatureInfo.featureIcon : '',
      },
      isVisible: true,
    };
  }, [hoverFeatureInfo, position.isValid]);

  return (
    <Box
      ref={tooltipRef}
      sx={sxClasses.tooltipItem}
      style={{
        visibility: position.isValid && tooltipContent.isVisible ? 'visible' : 'hidden',
        left: position.left,
        top: position.top,
      }}
    >
      {tooltipContent.content.icon && (
        <Box component="img" className="layer-icon" alt={t('hovertooltip.alticon')!} src={tooltipContent.content.icon} />
      )}
      {tooltipContent.content.value && <Box sx={sxClasses.tooltipText}>{tooltipContent.content.value}</Box>}
    </Box>
  );
});
