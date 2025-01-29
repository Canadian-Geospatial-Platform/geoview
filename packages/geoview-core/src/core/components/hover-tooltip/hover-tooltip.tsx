import { memo, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';
import { Box } from '@/ui';

import { useMapHoverFeatureInfo, useMapIsMouseInsideMap, useMapPointerPosition } from '@/core/stores/store-interface-and-intial-values/map-state';
import { getSxClasses } from './hover-tooltip-styles';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';

export const HoverTooltip = memo(function HoverTooltip(): JSX.Element | null {
  // Log, commented too annoying
  // logger.logTraceRender('components/hover-tooltip/hover-tooltip');

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
  const hoverFeatureInfo = useMapHoverFeatureInfo();
  const pointerPosition = useMapPointerPosition();
  const isMouseouseInMap = useMapIsMouseInsideMap();
  const mapElem = useAppGeoviewHTMLElement().querySelector(`[id^="mapTargetElement-${useGeoViewMapId()}"]`) as HTMLElement;

  // Compute tooltip content and visibility
  const tooltipContent = useMemo(() => {
    if (!hoverFeatureInfo || !isMouseouseInMap || !tooltipRef.current) {
      return {
        content: { value: '', icon: '' },
        isVisible: false,
      };
    }

    return {
      content: {
        value: (hoverFeatureInfo.fieldInfo?.value as string) || '',
        icon: hoverFeatureInfo.featureIcon ? hoverFeatureInfo.featureIcon.toDataURL() : '',
      },
      isVisible: true,
    };
  }, [hoverFeatureInfo, isMouseouseInMap]);

  // Calculate position with boundary checks
  const position = useMemo(() => {
    if (!pointerPosition?.pixel || !mapElem || !tooltipContent.content.value) {
      return { left: '0px', top: '0px' };
    }

    let tooltipX = pointerPosition.pixel[0] + 10;
    let tooltipY = pointerPosition.pixel[1] - 30;

    // Approximate width calculation (50px for empty tooltip)
    // Assuming average character width of 12px and adding padding/margins
    const approximateWidth = 50 + String(tooltipContent.content.value).length * 12;

    // Only get getBoundingClientRect if we don't have it stored
    if (!mapRectRef.current) mapRectRef.current = mapElem.getBoundingClientRect();

    // Convert pointer position to be relative to map container and check if tooltip would overflow the viewport
    const mapRect = mapElem.getBoundingClientRect();
    const relativePointerX = pointerPosition.pixel[0] + mapRectRef.current.left;
    const wouldOverflow = relativePointerX + approximateWidth > mapRectRef.current.right;

    // If overflow, apply offset
    if (wouldOverflow) tooltipX = pointerPosition.pixel[0] - approximateWidth;

    // For height we can use a fixed value since tooltip is typically single line
    if (tooltipY < mapRect.top) tooltipY = pointerPosition.pixel[1] + 10;

    return { left: `${tooltipX}px`, top: `${tooltipY}px` };
  }, [pointerPosition, tooltipContent.content.value]);

  return (
    <Box
      ref={tooltipRef}
      sx={sxClasses.tooltipItem}
      style={{
        visibility: tooltipContent.isVisible ? 'visible' : 'hidden',
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
