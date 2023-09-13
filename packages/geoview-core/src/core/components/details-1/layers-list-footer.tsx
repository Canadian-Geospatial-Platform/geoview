/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/require-default-props */
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getUid } from 'ol/util';
import { ListItemText, ListItem, List, Tooltip, IconButton, KeyboardArrowRightIcon, Grid, Paper, Typography } from '@/ui';
import { TypeArrayOfLayerData, TypeLayerData } from './details';
import { FeatureInfo } from '../feature-info-new.ts/feature-info-new';
import { PayloadBaseClass, api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { payloadIsAFeatureHighlight, payloadIsAClearHighlights } from '@/api/events/payloads';

const getSxClasses = (isPanelHeaders = false) => {
  return {
    footerTopPanleSecondary: {
      font: 'normal normal normal 16px/24px Roboto, Helvetica, Arial, sans-serif',
    },
    panelHeaders: {
      font: 'normal normal normal 600 22px/30px Roboto, Helvetica, Arial, sans-serif',
      marginBottom: '20px',
      ...(isPanelHeaders && { paddingLeft: '20px' }),
    },
    panelHeaderSelectedFeature: {
      font: 'normal normal normal 600 22px/30px Roboto, Helvetica, Arial, sans-serif',
      marginBottom: '20px',
    },
    layerNamePrimary: {
      font: 'normal normal normal 600 20px/27px Roboto, Helvetica, Arial, sans-serif',
    },
  };
};
interface TypeLayersListProps {
  arrayOfLayerData: TypeArrayOfLayerData;
  mapId: string;
}

/**
 * layers list
 *
 * @param {TypeLayersListProps} props The properties passed to LayersListFooter
 * @returns {JSX.Element} the layers list
 */
export function LayersListFooter(props: TypeLayersListProps): JSX.Element {
  const { arrayOfLayerData, mapId } = props;
  const selectedFeatures = useRef<string[]>([]);
  const { t } = useTranslation<string>();
  const [layerDataInfo, setLayerDataInfo] = useState<TypeLayerData | null>(null);

  const highlightCallbackFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFeatureHighlight(payload)) {
      selectedFeatures.current.push(getUid(payload.feature.geometry));
    }
  };

  const clearHighlightCallbackFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAClearHighlights(payload)) {
      if (payload.id === 'all') {
        selectedFeatures.current = [];
      }
      if (selectedFeatures.current.indexOf(payload.id) !== -1)
        selectedFeatures.current.splice(selectedFeatures.current.indexOf(payload.id), 1);
    }
  };

  useEffect(() => {
    api.event.on(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, highlightCallbackFunction, mapId);
    api.event.on(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, clearHighlightCallbackFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, highlightCallbackFunction);
      api.event.off(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, clearHighlightCallbackFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (arrayOfLayerData.length > 0) {
      // load the first layer we clicked with its feature info in right panel
      // if there are multiple layers, we load the first one on the list with its feature info
      setLayerDataInfo(arrayOfLayerData[0]);
      // select the first feature info (checks the checkbox of the first feature info)
      selectedFeatures.current.push(getUid(arrayOfLayerData[0].features[0].geometry));
    }
  }, [arrayOfLayerData]);

  return (
    <Grid container spacing={2} sx={{ backgroundColor: '#F1F2F5' }}>
      <div style={{ padding: '20px 28px 28px 28px' }}>
        {layerDataInfo === null ? (
          <Typography component="p" sx={getSxClasses().footerTopPanleSecondary}>
            {t('details.selectVisbleLayer')}
          </Typography>
        ) : (
          <Typography component="p" sx={getSxClasses().footerTopPanleSecondary}>
            {t('details.mainDescription')}
          </Typography>
        )}
      </div>
      {layerDataInfo !== null && (
        <Grid container spacing={12} sx={{ height: '300vh', overflow: 'hidden', display: 'flex' }}>
          {/* ================= LEFT PANEL ================= */}

          <Grid item md={4} sx={{ flex: '1', overflow: 'auto' }}>
            <Typography component="div" sx={getSxClasses(true).panelHeaders}>
              {t('details.availableLayers')}
            </Typography>
            <Paper sx={{ marginLeft: '20px' }}>
              <List sx={{ color: 'text.primary' }}>
                {arrayOfLayerData.map((layerData) => {
                  const isSelectedBorder = layerData.layerPath === layerDataInfo?.layerPath;
                  return (
                    <ListItem
                      onClick={() => setLayerDataInfo(layerData)}
                      key={layerData.layerPath}
                      sx={{
                        padding: '8px 16px',
                        border: isSelectedBorder ? '2px solid #515BA5' : 'none',
                        borderRadius: isSelectedBorder ? '5px' : 'none',
                        cursor: 'pointer',
                      }}
                      secondaryAction={
                        <IconButton edge="end" aria-label="expand">
                          <KeyboardArrowRightIcon />
                        </IconButton>
                      }
                    >
                      <Tooltip title={layerData.layerPath} placement="top" enterDelay={1000}>
                        <ListItemText
                          sx={getSxClasses().layerNamePrimary}
                          primary={layerData.layerPath ? layerData.layerName : 'Click on map'}
                        />
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          </Grid>
          {/* ================= RIGHT PANEL ================= */}
          <Grid item md={8} sx={{ paddingLeft: '40px' }}>
            <>
              <Typography component="div" sx={getSxClasses().panelHeaderSelectedFeature}>
                {t('details.selectedFeature')}
              </Typography>
              <div style={{ border: '2px solid #515BA5', borderRadius: '5px', marginRight: '20px' }}>
                {layerDataInfo?.features.map((feature, index: number) => (
                  // eslint-disable-next-line react/jsx-key, react/no-array-index-key
                  <FeatureInfo feature={feature} selectedFeatures={selectedFeatures} mapId={mapId} key={index} />
                ))}
              </div>
            </>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
}
