/* eslint-disable react/require-default-props */
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getUid } from 'ol/util';
import {
  ListItemText,
  ListItem,
  List,
  Tooltip,
  IconButton,
  Grid,
  Paper,
  Typography,
  KeyboardArrowRightIcon,
  ArrowForwardIosOutlinedIcon,
  ArrowBackIosOutlinedIcon,
  LayersClearOutlinedIcon,
} from '@/ui';
import { TypeArrayOfLayerData, TypeLayerData } from './details';
import { FeatureInfo } from './feature-info-new';
import { PayloadBaseClass, api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { payloadIsAFeatureHighlight, payloadIsAClearHighlights, clearHighlightsPayload, TypeFeatureInfoEntry } from '@/api/events/payloads';

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
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState<number>(0);
  const [isClearFeature, setIsClearFeature] = useState<boolean>(false);

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

  const handleClearAllFeatures = () => {
    arrayOfLayerData.forEach((layer: TypeLayerData) => {
      layer.features.forEach((feature: TypeFeatureInfoEntry) => {
        api.event.emit(clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, getUid(feature.geometry)));
      });
    });
    setIsClearFeature(true);
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
              <List sx={{ color: 'text.primary', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {arrayOfLayerData.map((layerData) => {
                  const isSelectedBorder = layerData.layerPath === layerDataInfo?.layerPath;
                  const numOfFeatures = layerData.features.length;

                  return (
                    <ListItem
                      onClick={() => {
                        setLayerDataInfo(layerData);
                        setCurrentFeatureIndex(0);
                      }}
                      key={layerData.layerPath}
                      sx={{
                        padding: '8px 40px 8px 16px',
                        border: isSelectedBorder ? '2px solid #515BA5' : 'none',
                        borderRadius: isSelectedBorder ? '5px' : 'none',
                        cursor: 'pointer',
                        height: '50px',
                      }}
                      secondaryAction={
                        <IconButton edge="end" aria-label="expand">
                          <KeyboardArrowRightIcon />
                        </IconButton>
                      }
                    >
                      <Tooltip title={layerData.layerName} placement="top" enterDelay={1000}>
                        <ListItemText
                          sx={getSxClasses().layerNamePrimary}
                          primary={layerData.layerName ? layerData.layerName : t('details.clickOnMap')}
                          secondary={`${numOfFeatures} ${t('details.feature')}${numOfFeatures > 1 ? 's' : ''}`}
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
              <div style={{ border: '2px solid #515BA5', borderRadius: '5px', marginRight: '20px', backgroundColor: 'white' }}>
                <Grid container sx={{ marginTop: '20px', marginBottom: '9px', boxShadow: '0px 12px 9px -13px #E0E0E0' }}>
                  <Grid item xs={6}>
                    <div style={{ marginLeft: '26px' }}>
                      Feature {currentFeatureIndex + 1} of {layerDataInfo?.features.length}
                      <IconButton
                        sx={{ marginLeft: '20px' }}
                        aria-label="clear-all-features"
                        tooltip="details.clearAllfeatures"
                        tooltipPlacement="top"
                        onClick={() => handleClearAllFeatures()}
                      >
                        <LayersClearOutlinedIcon />
                      </IconButton>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div style={{ textAlign: 'right', marginRight: '26px' }}>
                      <IconButton
                        aria-label="backward"
                        tooltip="details.previousFeatureBtn"
                        tooltipPlacement="top"
                        onClick={() => setCurrentFeatureIndex((prevValue) => prevValue - 1)}
                        disabled={currentFeatureIndex === 0}
                      >
                        <ArrowBackIosOutlinedIcon />
                      </IconButton>
                      <IconButton
                        sx={{ marginLeft: '20px' }}
                        aria-label="forward"
                        tooltip="details.nextFeatureBtn"
                        tooltipPlacement="top"
                        onClick={() => setCurrentFeatureIndex((prevValue) => prevValue + 1)}
                        // eslint-disable-next-line no-unsafe-optional-chaining
                        disabled={currentFeatureIndex === layerDataInfo?.features.length - 1}
                      >
                        <ArrowForwardIosOutlinedIcon />
                      </IconButton>
                    </div>
                  </Grid>
                </Grid>
                <FeatureInfo
                  features={layerDataInfo?.features}
                  currentFeatureIndex={currentFeatureIndex}
                  selectedFeatures={selectedFeatures}
                  mapId={mapId}
                  isClearFeature={isClearFeature}
                />
              </div>
            </>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
}
