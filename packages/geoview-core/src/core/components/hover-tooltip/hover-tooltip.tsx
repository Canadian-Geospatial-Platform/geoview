/* eslint-disable react/require-default-props */
import React, { useEffect, useContext, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';

import { getUid } from 'ol/util';

import { Box } from '../../../ui';
import { api, payloadIsAMapMouseEvent } from '../../../app';
import { MapContext } from '../../app-start';
import { EVENT_NAMES } from '../../../api/events/event-types';
import {
  TypeFeatureInfoEntry,
  payloadIsAllQueriesDone,
  payloadIsHoverQueryDone,
} from '../../../api/events/payloads/get-feature-info-payload';

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
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation<string>();

  const theme: Theme & {
    iconImg: React.CSSProperties;
  } = useTheme();

  const [pixel, setPixel] = useState<[number, number]>([0, 0]);

  const [tooltipValue, setTooltipValue] = useState<string>('');
  const [tooltipIcon, setTooltipIcon] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  // Currently selected feature - will not show tooltip
  const selectedFeature = useRef<TypeFeatureInfoEntry>();

  useEffect(() => {
    // listen to pointer move on map events
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE,
      (payload) => {
        if (payloadIsAMapMouseEvent(payload)) {
          if (payload.coordinates.dragging) {
            setShowTooltip(false);
            setTooltipValue('');
          }

          setPixel(payload.coordinates.pixel as [number, number]);
        }
        setShowTooltip(false);
        setTooltipValue('');
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.HOVER_QUERY_DONE,
      (payload) => {
        if (payloadIsHoverQueryDone(payload)) {
          const { resultSets } = payload;

          // eslint-disable-next-line no-restricted-syntax
          for (const [, value] of Object.entries(resultSets)) {
            // if there is a result and layer is not ogcWms, and it is not selected, show tooltip
            if (
              value!.length > 0 &&
              value![0].geoviewLayerType !== 'ogcWms' &&
              !(selectedFeature.current && getUid(value![0].geometry) === getUid(selectedFeature.current?.geometry))
            ) {
              const item = value![0];
              const nameField = item.nameField || Object.entries(item.fieldInfo)[0][0];
              const field = item.fieldInfo[nameField];
              setTooltipValue(field!.value as string | '');
              setTooltipIcon(item.featureIcon.toDataURL());
              setShowTooltip(true);
              break;
            }
          }
        }
      },
      `${mapId}/$FeatureInfoLayerSet$`
    );

    // Get a feature when it is selected
    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE,
      (payload) => {
        if (payloadIsAllQueriesDone(payload)) {
          const { resultSets } = payload;
          Object.keys(resultSets).every((layerPath) => {
            const features = resultSets[layerPath]!;
            if (features.length > 0 && features[0].geoviewLayerType !== 'ogcWms') {
              [selectedFeature.current] = features;
              return false;
            }
            return true;
          });
        }
      },
      `${mapId}/$FeatureInfoLayerSet$`
    );

    // Hide tooltip on map click, and clear selected feature
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapMouseEvent(payload)) {
          selectedFeature.current = undefined;
          setShowTooltip(false);
          setTooltipValue('');
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.GET_FEATURE_INFO.HOVER_QUERY_DONE, mapId);
      api.event.off(EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE, mapId);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK, mapId);
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
      <img alt={t('hovertooltip.alticon')!} src={tooltipIcon} style={{ ...theme.iconImg, width: '35px', height: '35px' }} />
      <Box sx={sxClasses.tooltipText}>{`${tooltipValue}`}</Box>
    </Box>
  );
}
