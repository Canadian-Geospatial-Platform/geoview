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

/**
 * Creates the hover tooltip component.
 *
 * Memoized to prevent re-renders since this component has no props.
 *
 * @returns The hover tooltip element, or null when not visible
 */
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

  /**
   * Formats the hovered feature value for display.
   */
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

  /**
   * Calculates the tooltip position with boundary checks.
   */
  const memoPosition = useMemo(() => {
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

  /**
   * Computes the tooltip content and visibility state.
   */
  const memoTooltipContent = useMemo(() => {
    if (!hoverFeatureInfo || !memoPosition.isValid) {
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
  }, [hoverFeatureInfo, memoValue, memoPosition.isValid]);

  return (
    <Box
      ref={tooltipRef}
      sx={sxClasses.tooltipItem}
      style={{
        visibility: memoPosition.isValid && memoTooltipContent.isVisible ? 'visible' : 'hidden',
        left: memoPosition.left,
        top: memoPosition.top,
      }}
    >
      {memoTooltipContent.content.icon ? (
        <Box component="img" className="layer-icon" alt={t('hovertooltip.alticon')!} src={memoTooltipContent.content.icon} />
      ) : (
        <Box component="div" className="layer-icon" aria-label={t('hovertooltip.alticon')!}>
          <BrowserNotSupportedIcon />
        </Box>
      )}
      {memoTooltipContent.content.value !== undefined && <Box sx={sxClasses.tooltipText}>{memoTooltipContent.content.value}</Box>}
    </Box>
  );
});
