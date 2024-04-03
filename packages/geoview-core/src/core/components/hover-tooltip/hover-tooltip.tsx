import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';

import { Box } from '@/ui';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { logger } from '@/core/utils/logger';
import { useMapHoverFeatureInfo } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Hover tooltip component to show name field information on hover
 *
 * @returns {JSX.Element} the hover tooltip component
 */
export function HoverTooltip(): JSX.Element {
  // Log too annoying
  // logger.logTraceRender('components/hover-tooltip/hover-tooltip');

  const mapId = useGeoViewMapId();

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

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('HOVER-TOOLTIP - hoverFeatureInfo', hoverFeatureInfo);

    if (hoverFeatureInfo !== undefined) {
      setTooltipValue(hoverFeatureInfo!.fieldInfo?.value as string | '');
      setTooltipIcon(hoverFeatureInfo!.featureIcon.toDataURL());
      setShowTooltip(true);
    }
  }, [hoverFeatureInfo]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('HOVER-TOOLTIP - mount');

    // if pointer position changed, reset tooltip
    const unsubPointerPosition = getGeoViewStore(mapId).subscribe(
      (state) => state.mapState.pointerPosition,
      (curPos, prevPos) => {
        // Log - commented, too anoying
        // logger.logTraceCoreStoreSubscription('HOVER-TOOLTIP - pointer position', curPos);

        setPixel(curPos!.pixel as [number, number]);
        if (curPos !== prevPos) {
          setTooltipValue('');
          setTooltipIcon('');
          setShowTooltip(false);
        }
      }
    );

    return () => {
      unsubPointerPosition();
    };
  }, [mapId]);

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
