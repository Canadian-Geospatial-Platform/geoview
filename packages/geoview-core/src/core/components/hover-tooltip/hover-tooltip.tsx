import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';

import { getUid } from 'ol/util';

import { getGeoViewStore } from '@/core/stores/stores-managers';

import { Box } from '@/ui';
import { api, useGeoViewMapId } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { PayloadBaseClass, TypeFeatureInfoEntry, payloadIsAllQueriesDone } from '@/api/events/payloads';
import { logger } from '@/core/utils/logger';

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
  // Currently selected feature - will not show tooltip
  const selectedFeature = useRef<TypeFeatureInfoEntry>();

  const allQueriesDoneListenerFunciton = (payload: PayloadBaseClass) => {
    // Log
    logger.logTraceCoreAPIEvent('HOVER-TOOLTIP - allQueriesDoneListenerFunciton', payload);

    if (payloadIsAllQueriesDone(payload)) {
      const { eventType, resultSet } = payload;
      if (eventType === 'hover') {
        // eslint-disable-next-line no-restricted-syntax
        for (const [, value] of Object.entries(resultSet)) {
          // if there is a result and layer is not ogcWms, and it is not selected, show tooltip
          if (
            value?.data?.hover?.features &&
            value.data.hover.features.length > 0 &&
            value.data.hover.features[0].geoviewLayerType !== 'ogcWms' &&
            !(selectedFeature.current && getUid(value.data.hover.features[0].geometry) === getUid(selectedFeature.current?.geometry))
          ) {
            const item = value.data.hover.features[0];
            const nameField = item.nameField || Object.entries(item.fieldInfo)[0][0];
            const field = item.fieldInfo[nameField];
            setTooltipValue(field?.value as string | '');
            setTooltipIcon(item.featureIcon.toDataURL());
            setShowTooltip(true);
            break;
          }
        }
      } else if (eventType === 'click') {
        Object.keys(resultSet).every((layerPath) => {
          const features = resultSet[layerPath]!.data.click?.features;
          if (features && features.length > 0 && features[0].geoviewLayerType !== 'ogcWms') {
            [selectedFeature.current] = features;
            return false;
          }
          return true;
        });
      }
    }
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('HOVER-TOOLTIP - mount');

    // if pointerPosition changed, map pointer event has been triggered
    const unsubMapPointer = getGeoViewStore(mapId).subscribe(
      (state) => state.mapState.pointerPosition,
      (curPos, prevPos) => {
        // Log too annoying
        // logger.logTraceCoreStoreSubscription('CLICK-MARKER - pointerPosition', mapId, curPos);

        if (curPos !== prevPos) {
          setShowTooltip(false);
          setTooltipValue('');
          setPixel(curPos!.pixel as [number, number]);
        }
      }
    );

    // if mapClickCoordinates changed, single click event has been triggered
    const unsubMapSingleClick = getGeoViewStore(mapId).subscribe(
      (state) => state.mapState.clickCoordinates,
      (curClick, prevClick) => {
        // Log
        logger.logTraceCoreStoreSubscription('CLICK-MARKER - clickCoordinates', mapId, curClick);

        if (curClick !== prevClick) {
          selectedFeature.current = undefined;
          setShowTooltip(false);
          setTooltipValue('');
        }
      }
    );

    // Get a feature when it is selected
    api.event.on(EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE, allQueriesDoneListenerFunciton, `${mapId}/FeatureInfoLayerSet`);

    return () => {
      api.event.off(EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId, allQueriesDoneListenerFunciton);
      unsubMapPointer();
      unsubMapSingleClick();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
