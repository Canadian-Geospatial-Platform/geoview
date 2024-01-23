/* eslint-disable react/require-default-props */
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

const sxClasses = {
  tooltipItem: {
    color: '#fff',
    background: '#222',
    opacity: 0.9,
    fontSize: '16px',
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
    fontSize: 'text.fontSize',
    color: 'palette.primary.light',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    padding: '5px',
  },
};

/**
 * Hover tooltip component to show name field information on hover
 *
 * @returns {JSX.Element} the hover tooltip component
 */
export function HoverTooltip(): JSX.Element {
  const mapId = useGeoViewMapId();

  const { t } = useTranslation<string>();

  const theme: Theme & {
    iconImage: React.CSSProperties;
  } = useTheme();

  // internal component state
  const [pixel, setPixel] = useState<[number, number]>([0, 0]);
  const [tooltipValue, setTooltipValue] = useState<string>('');
  const [tooltipIcon, setTooltipIcon] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  // Currently selected feature - will not show tooltip
  const selectedFeature = useRef<TypeFeatureInfoEntry>();

  const allQueriesDoneListenerFunciton = (payload: PayloadBaseClass) => {
    if (payloadIsAllQueriesDone(payload)) {
      const { eventType, resultSets } = payload;
      if (eventType === 'hover') {
        // eslint-disable-next-line no-restricted-syntax
        for (const [, value] of Object.entries(resultSets)) {
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
            setTooltipValue(field!.value as string | '');
            setTooltipIcon(item.featureIcon.toDataURL());
            setShowTooltip(true);
            break;
          }
        }
      } else if (eventType === 'click') {
        Object.keys(resultSets).every((layerPath) => {
          const features = resultSets[layerPath]!.data.click?.features;
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
      <img alt={t('hovertooltip.alticon')!} src={tooltipIcon} style={{ ...theme.iconImage, width: '35px', height: '35px' }} />
      <Box sx={sxClasses.tooltipText}>{tooltipValue}</Box>
    </Box>
  );
}
