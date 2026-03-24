import { memo, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { Box, BrowserNotSupportedIcon } from '@/ui';

import {
  getMapPointerPosition,
  useMapHoverFeatureInfo,
  useMapIsMouseInsideMap,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { getSxClasses } from './hover-tooltip-styles';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppDisplayLanguage, useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { logger } from '@/core/utils/logger';
import { DateMgt } from '@/core/utils/date-mgt';
import {
  useLayerDateTemporalModes,
  useLayerDisplayDateFormats,
  useLayerDisplayDateTimezones,
} from '@/core/stores/store-interface-and-intial-values/layer-state';

export const HoverTooltip = memo(function HoverTooltip(): JSX.Element | null {
  // Log
  logger.logTraceRenderDetailed('components/hover-tooltip/hover-tooltip');

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
  const language = useAppDisplayLanguage();
  const layerDateTemporalModes = useLayerDateTemporalModes();
  const displayDateFormats = useLayerDisplayDateFormats();
  const displayDateTimezones = useLayerDisplayDateTimezones();

  const memoValue = useMemo(() => {
    logger.logTraceUseMemo('HOVER TOOLTIP - memoValue', hoverFeatureInfo?.fieldInfo?.value);

    const valueRaw = hoverFeatureInfo?.fieldInfo?.value;
    let valueString = valueRaw !== undefined ? (valueRaw as string) : undefined;

    // If the value is a date
    if (valueRaw instanceof Date) {
      const layerDateTemporalMode = layerDateTemporalModes[hoverFeatureInfo!.layerPath];
      valueString = DateMgt.formatDate(
        valueRaw,
        displayDateFormats[hoverFeatureInfo!.layerPath][language],
        language,
        displayDateTimezones[hoverFeatureInfo!.layerPath],
        layerDateTemporalMode
      );
    }
    return valueString;
  }, [hoverFeatureInfo, displayDateFormats, displayDateTimezones, language, layerDateTemporalModes]);

  // Calculate position with boundary checks
  const position = useMemo(() => {
    // Use store getter, we do not subcribe to modification and use it only when needed
    const pointerPosition = getMapPointerPosition(mapId);

    // Early return in memo
    // Check for all required conditions upfront
    if (!pointerPosition?.pixel || !mapElem || memoValue === undefined || !isMouseouseInMap) {
      return { left: '0px', top: '0px', isValid: false };
    }
    logger.logTraceUseMemo('HOVER TOOLTIP - position', pointerPosition);

    let tooltipX = pointerPosition.pixel[0] + 10;
    let tooltipY = pointerPosition.pixel[1] - 30;

    // Approximate width calculation (50px for empty tooltip)
    // Assuming average character width of 10px and adding padding/margins
    let approximateWidth = 25 + memoValue.length * 10;

    // After a certain length, the string is cut off with ellipsis in the tooltip, so we have a max width.
    if (approximateWidth > 370) approximateWidth = 370; // Cap to max width

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
  }, [mapId, mapElem, memoValue, isMouseouseInMap]);

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
        value: memoValue,
        icon: hoverFeatureInfo.featureIcon ? hoverFeatureInfo.featureIcon : '',
      },
      isVisible: true,
    };
  }, [hoverFeatureInfo, memoValue, position.isValid]);

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
      {tooltipContent.content.icon ? (
        <Box component="img" className="layer-icon" alt={t('hovertooltip.alticon')!} src={tooltipContent.content.icon} />
      ) : (
        <Box component="div" className="layer-icon" aria-label={t('hovertooltip.alticon')!}>
          <BrowserNotSupportedIcon />
        </Box>
      )}
      {tooltipContent.content.value !== undefined && <Box sx={sxClasses.tooltipText}>{tooltipContent.content.value}</Box>}
    </Box>
  );
});
