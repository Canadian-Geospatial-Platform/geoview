import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';
import { getUid } from 'ol/util';

import { Box } from '@/ui';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

import { logger } from '@/core/utils/logger';
import { TypeHoverFeatureInfo } from '@/geo/utils/hover-feature-info-layer-set';
import { useDetailsStoreHoverDataArray } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { MapPointerMoveEvent, MapViewer, api } from '@/app';

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
  const selectedFeature = useRef<TypeHoverFeatureInfo>();

  // store state
  const hoverDataArray = useDetailsStoreHoverDataArray();

  /**
   * Handles when the pointer moves on the map
   * @param {MapViewer} sender - The MapViewer raising the event
   * @param {MapPointerMoveEvent} event - The pointer move event
   */
  const handleMapPointerMove = (sender: MapViewer, event: MapPointerMoveEvent): void => {
    setShowTooltip(false);
    setTooltipValue('');
    setPixel(event.pixel as [number, number]);
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('HOVER-TOOLTIP - hoverDataArray', hoverDataArray);

    // eslint-disable-next-line no-restricted-syntax
    for (const data of hoverDataArray) {
      // if there is a result and layer is not ogcWms, and it is not selected, show tooltip
      if (
        data?.feature &&
        data.feature.geoviewLayerType !== CONST_LAYER_TYPES.WMS &&
        !(selectedFeature.current && getUid(data.feature.geometry) === getUid(selectedFeature.current?.geometry))
      ) {
        const item = data.feature;
        const nameField = item.nameField || Object.entries(item.fieldInfo)[0];
        const field = item.fieldInfo[nameField as string];
        setTooltipValue(field?.value as string | '');
        setTooltipIcon(item.featureIcon.toDataURL());
        setShowTooltip(true);
        break;
      }
    }
  }, [hoverDataArray]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('HOVER-TOOLTIP - mount');

    // Register a map pointer move
    api.maps[mapId].onMapPointerMove(handleMapPointerMove);

    return () => {
      // Unregister the map pointer move
      api.maps[mapId].offMapPointerMove(handleMapPointerMove);
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
