/* eslint-disable react/require-default-props */
import React, { useEffect, useState, useRef, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { getUid } from 'ol/util'; // TODO no ol in component

import { IconButton, Grid, Typography, ArrowForwardIosOutlinedIcon, ArrowBackIosOutlinedIcon, LayersClearOutlinedIcon, Box } from '@/ui';
import { FeatureInfo } from './feature-info-new';
import { PayloadBaseClass, api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import {
  payloadIsAFeatureHighlight,
  payloadIsAClearHighlights,
  clearHighlightsPayload,
  featureHighlightPayload,
  TypeFeatureInfoEntry,
  TypeArrayOfFeatureInfoEntries,
  TypeGeometry,
  TypeArrayOfLayerData,
  TypeLayerData,
} from '@/api/events/payloads';
import { getSxClasses } from './details-style';
import {
  useDetailsStoreActions,
  useDetailsStoreLayerDataArray,
  useDetailsStoreSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/details-state';
import { ResponsiveGrid, CloseButton, EnlargeButton, LayerList } from '../common';

interface DetailsPanelProps {
  mapId: string;
}

/**
 * layers list
 *
 * @param {DetailsPanelProps} props The properties passed to LayersListFooter
 * @returns {JSX.Element} the layers list
 */
export function Detailspanel({ mapId }: DetailsPanelProps): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const selectedFeatures = useRef<string[]>([]);
  const [layerDataInfo, setLayerDataInfo] = useState<TypeLayerData | null>(null);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState<number>(0);
  const [isClearAllCheckboxes, setIsClearAllCheckboxes] = useState<boolean>(false);
  const [disableClearAllBtn, setDisableClearAllBtn] = useState<boolean>(false);
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);

  // get values from store
  const selectedLayerPath = useDetailsStoreSelectedLayerPath();
  const { setSelectedLayerPath } = useDetailsStoreActions();
  const arrayOfLayerData = useDetailsStoreLayerDataArray();

  // Returns the index of matching layer based on the found layer path
  const findLayerPathIndex = (layerDataArray: TypeArrayOfLayerData, layerPathSearch: string): number => {
    return layerDataArray.findIndex((item) => item.layerPath === layerPathSearch);
  };

  const highlightCallbackFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFeatureHighlight(payload) && payload.feature.geometry) {
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
    // clear all highlights from features on the map in all layers,
    api.event.emit(clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, 'all'));
    // add the highlight to the current feature
    api.event.emit(
      featureHighlightPayload(
        EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE,
        mapId,
        layerDataInfo?.features![currentFeatureIndex] as TypeFeatureInfoEntry
      )
    );

    setIsClearAllCheckboxes(true);
  };

  const allUncheckedFeatures = (
    checkedFeatures: Exclude<TypeArrayOfFeatureInfoEntries, null | undefined>,
    allFeatures: Exclude<TypeArrayOfFeatureInfoEntries, null | undefined>
  ) => {
    const uncheckedFeatures = allFeatures.filter(
      (feature) =>
        !checkedFeatures.some(
          (checkedFeature) => (checkedFeature.geometry as TypeGeometry)?.ol_uid === (feature.geometry as TypeGeometry)?.ol_uid
        )
    );
    return uncheckedFeatures;
  };

  const handleFeatureNavigateChange = (
    checkedFeatures: Exclude<TypeArrayOfFeatureInfoEntries, null | undefined>,
    currentFeature: TypeFeatureInfoEntry
  ) => {
    // remove the highlight for unchecked feature
    arrayOfLayerData.forEach((layer: TypeLayerData) => {
      const getAllUnCheckedFeatures = allUncheckedFeatures(checkedFeatures, layer.features!);

      getAllUnCheckedFeatures.forEach((obj: TypeFeatureInfoEntry) => {
        if (obj.geometry)
          api.event.emit(clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, getUid(obj.geometry)));
      });
    });

    // add highlight to current feature
    api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, currentFeature));
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
      // Check if have the previous selected layer path in incoming arrayOfLayerData
      // if so, get the index of the found layer, we need to pass to setLayerDataInfo to load layer in left panel
      const commonLayerPathIndex = selectedLayerPath ? findLayerPathIndex(arrayOfLayerData, selectedLayerPath) : -1;
      setLayerDataInfo(arrayOfLayerData[commonLayerPathIndex > -1 ? commonLayerPathIndex : 0]);
      setCurrentFeatureIndex(0);
    } else setLayerDataInfo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayOfLayerData]);

  /**
   * Get number of features of a layer.
   * @returns string
   */
  const getFeaturesOfLayer = (): string => {
    const numOfFeatures = layerDataInfo?.features?.length ?? 0;
    return `${numOfFeatures} ${t('details.feature')}${numOfFeatures > 1 ? 's' : ''}`;
  };

  const renderLayerList = useCallback(() => {
    return (
      <LayerList
        layerList={arrayOfLayerData.map((layer, index) => ({
          layerName: layer.layerName ?? '',
          layerPath: layer.layerPath,
          numOffeatures: layer.features?.length ?? 0,
          layerFeatures: getFeaturesOfLayer(),
          tooltip: `${layer.layerName}, ${getFeaturesOfLayer()}`,
        }))}
        isEnlargeDataTable={isEnlargeDataTable}
        selectedLayerIndex={arrayOfLayerData.findIndex((layer) => layer.layerPath === layerDataInfo?.layerPath)}
        handleListItemClick={(layer, index: number) => {
          setLayerDataInfo(arrayOfLayerData[index]);
          setCurrentFeatureIndex(0);
          setSelectedLayerPath(arrayOfLayerData[index].layerPath);
          setIsLayersPanelVisible(false);
        }}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerDataInfo, arrayOfLayerData, isEnlargeDataTable]);

  return (
    <Box sx={sxClasses.detailsContainer}>
      {!layerDataInfo && (
        <ResponsiveGrid.Root>
          <ResponsiveGrid.Left xs={12} isLayersPanelVisible={isLayersPanelVisible}>
            <Typography component="p">{t('details.selectVisbleLayer')}</Typography>
          </ResponsiveGrid.Left>
        </ResponsiveGrid.Root>
      )}
      {layerDataInfo && (
        <>
          <ResponsiveGrid.Root>
            <ResponsiveGrid.Left xs={isLayersPanelVisible ? 12 : 0} md={4} isLayersPanelVisible={isLayersPanelVisible}>
              <Typography component="div" sx={sxClasses.panelHeaders}>
                {t('details.availableLayers')}
              </Typography>
            </ResponsiveGrid.Left>
            <ResponsiveGrid.Right isLayersPanelVisible={isLayersPanelVisible} xs={!isLayersPanelVisible ? 12 : 0} md={8}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  [theme.breakpoints.up('md')]: { justifyContent: 'right' },
                  [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
                }}
              >
                <Box sx={{ [theme.breakpoints.up('md')]: { display: 'none' } }}>
                  <Typography component="span">{layerDataInfo.layerName}</Typography>
                </Box>
                <Box>
                  <EnlargeButton isEnlargeDataTable={isEnlargeDataTable} setIsEnlargeDataTable={setIsEnlargeDataTable} />
                  <CloseButton isLayersPanelVisible={isLayersPanelVisible} setIsLayersPanelVisible={setIsLayersPanelVisible} />
                </Box>
              </Box>
            </ResponsiveGrid.Right>
          </ResponsiveGrid.Root>
          <ResponsiveGrid.Root sx={{ marginTop: '1rem' }}>
            <ResponsiveGrid.Left
              isLayersPanelVisible={isLayersPanelVisible}
              xs={isLayersPanelVisible ? 12 : 0}
              md={!isEnlargeDataTable ? 4 : 2}
              lg={!isEnlargeDataTable ? 4 : 1.25}
            >
              {renderLayerList()}
            </ResponsiveGrid.Left>
            <ResponsiveGrid.Right
              xs={!isLayersPanelVisible ? 12 : 0}
              md={!isEnlargeDataTable ? 8 : 10}
              lg={!isEnlargeDataTable ? 8 : 10.75}
              isLayersPanelVisible={isLayersPanelVisible}
            >
              <Box sx={sxClasses.rightPanleContainer}>
                <Grid container sx={sxClasses.rightPanelBtnHolder}>
                  <Grid item xs={6}>
                    <Box style={{ marginLeft: '22px' }}>
                      Feature {currentFeatureIndex + 1} of {layerDataInfo?.features!.length}
                      <IconButton
                        sx={{ marginLeft: '20px' }}
                        aria-label="clear-all-features"
                        tooltip="details.clearAllfeatures"
                        tooltipPlacement="top"
                        onClick={() => handleClearAllFeatures()}
                        disabled={disableClearAllBtn}
                      >
                        <LayersClearOutlinedIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'right', marginRight: '26px' }}>
                      <IconButton
                        aria-label="backward"
                        tooltip="details.previousFeatureBtn"
                        tooltipPlacement="top"
                        onClick={() => setCurrentFeatureIndex(currentFeatureIndex - 1)}
                        disabled={currentFeatureIndex === 0}
                      >
                        <ArrowBackIosOutlinedIcon />
                      </IconButton>
                      <IconButton
                        sx={{ marginLeft: '20px' }}
                        aria-label="forward"
                        tooltip="details.nextFeatureBtn"
                        tooltipPlacement="top"
                        onClick={() => setCurrentFeatureIndex(currentFeatureIndex + 1)}
                        // eslint-disable-next-line no-unsafe-optional-chaining
                        disabled={currentFeatureIndex === layerDataInfo?.features!.length - 1}
                      >
                        <ArrowForwardIosOutlinedIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
                <FeatureInfo
                  features={layerDataInfo?.features}
                  currentFeatureIndex={currentFeatureIndex}
                  selectedFeatures={selectedFeatures}
                  mapId={mapId}
                  onClearCheckboxes={() => setIsClearAllCheckboxes(false)}
                  onFeatureNavigateChange={handleFeatureNavigateChange}
                  clearAllCheckboxes={isClearAllCheckboxes}
                  setDisableClearAllBtn={setDisableClearAllBtn}
                />
              </Box>
            </ResponsiveGrid.Right>
          </ResponsiveGrid.Root>
        </>
      )}
    </Box>
  );
}
