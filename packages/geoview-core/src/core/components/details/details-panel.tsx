/* eslint-disable react/require-default-props */
import React, { useEffect, useState, useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import {
  IconButton,
  Grid,
  Typography,
  ArrowForwardIosOutlinedIcon,
  ArrowBackIosOutlinedIcon,
  LayersClearOutlinedIcon,
  Box,
  Paper,
} from '@/ui';
import { FeatureInfo } from './feature-info-new';
import { TypeFeatureInfoEntry, TypeArrayOfLayerData, TypeLayerData, TypeGeometry } from '@/api/events/payloads';
import { getSxClasses } from './details-style';
import {
  useDetailsStoreActions,
  useDetailsStoreCheckedFeatures,
  useDetailsStoreLayerDataArray,
  useDetailsStoreSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/details-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { ResponsiveGrid, CloseButton, EnlargeButton, LayerList, LayerTitle } from '../common';
import { useUIStoreActions } from '@/app';

/**
 * layers list
 *
 * @param {DetailsPanelProps} props The properties passed to LayersListFooter
 * @returns {JSX.Element} the layers list
 */
export function Detailspanel(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get values from store
  const selectedLayerPath = useDetailsStoreSelectedLayerPath();
  const arrayOfLayerData = useDetailsStoreLayerDataArray();
  const checkedFeatures = useDetailsStoreCheckedFeatures();
  const { setSelectedLayerPath, removeCheckedFeature } = useDetailsStoreActions();
  const { addSelectedFeature, removeSelectedFeature } = useMapStoreActions();
  const { setActiveFooterTab } = useUIStoreActions();

  // internal state
  const [layerDataInfo, setLayerDataInfo] = useState<TypeLayerData | null>(arrayOfLayerData[0]);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState<number>(0);
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);

  /**
   * Find the layer path index which is selected in previous layerData based on layerPath and have more than Zero features.
   * @param {TypeArrayOfLayerData} layerDataArray list of layers.
   * @param {string} layerPathSearch layer path to be searched in layers array.
   * @returns number
   */
  const findLayerPathIndex = (layerDataArray: TypeArrayOfLayerData, layerPathSearch: string): number => {
    return layerDataArray.findIndex((item) => item.layerPath === layerPathSearch && item?.features?.length);
  };

  /**
   * Check if feature is in the store checkedFeatures array
   *
   * @param {TypeFeatureInfoEntry} feature The feature to check
   * @returns {boolean} true if feature is in checkedFeatures
   */
  const isFeatureInCheckedFeatures = (feature: TypeFeatureInfoEntry): boolean => {
    return checkedFeatures.some((checkedFeature) => {
      return (checkedFeature.geometry as TypeGeometry).ol_uid === (feature.geometry as TypeGeometry).ol_uid;
    });
  };

  const handleClearAllFeatures = () => {
    // clear all highlights from features on the map in all layers
    removeSelectedFeature('all');
    // clear checked features array
    removeCheckedFeature('all');
    // add the highlight to the current feature
    addSelectedFeature(layerDataInfo?.features![currentFeatureIndex] as TypeFeatureInfoEntry);
  };

  useEffect(() => {
    if (arrayOfLayerData.length > 0) {
      // Check if have the previous selected layer path in incoming arrayOfLayerData
      // if so, get the index of the found layer, we need to pass to setLayerDataInfo to load layer in left panel
      const commonLayerPathIndex = selectedLayerPath ? findLayerPathIndex(arrayOfLayerData, selectedLayerPath) : -1;

      // Get index of first layer from array which doesn't have feature zero.
      const firstLayerIndex = arrayOfLayerData.findIndex((layer) => layer?.features?.length);

      const selectedLayer = arrayOfLayerData[commonLayerPathIndex > -1 ? commonLayerPathIndex : firstLayerIndex];

      // update selected layer data info when layer have atleast 1 feature.
      if (selectedLayer) {
        setLayerDataInfo(selectedLayer);
        setCurrentFeatureIndex(0);
        setActiveFooterTab('details');
      }
    } else setLayerDataInfo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayOfLayerData]);

  /**
   * Get number of features of a layer.
   * @returns string
   */
  const getFeaturesOfLayer = (layer: TypeLayerData): string => {
    const numOfFeatures = layer.features?.length ?? 0;
    return `${numOfFeatures} ${t('details.feature')}${numOfFeatures > 1 ? 's' : ''}`;
  };

  /**
   * Check if any layer has features.
   */
  const isLayersHasFeatures = useMemo(() => {
    return () => arrayOfLayerData.some((layer) => (layer?.features?.length ?? 0) > 0);
  }, [arrayOfLayerData]);

  /**
   * Handles clicks to forward and back arrows in right panel.
   * Removes previous feature from selectedFeatures store if it is not checked, and adds new feature.
   *
   * @param {-1 | 1} change The change to index number (-1 for back, 1 for forward)
   */
  const handleFeatureNavigateChange = (change: -1 | 1): void => {
    const currentFeature = layerDataInfo!.features![currentFeatureIndex];
    const nextFeature = layerDataInfo!.features![currentFeatureIndex + change];
    if (!isFeatureInCheckedFeatures(currentFeature)) removeSelectedFeature(currentFeature);
    addSelectedFeature(nextFeature);
    setCurrentFeatureIndex(currentFeatureIndex + change);
  };

  /**
   * Handles clicks to layers in left panel. Removes highlight from previous layers feature if it is not checked,
   * before updating current layer and highlighting first feature.
   *
   * @param {TypeLayerData} layerData The data of the selected layer
   */
  const handleLayerChange = (layerData: TypeLayerData): void => {
    const currentFeature = layerDataInfo!.features![currentFeatureIndex];
    if (!isFeatureInCheckedFeatures(currentFeature)) removeSelectedFeature(currentFeature);
    setLayerDataInfo(layerData);
    setCurrentFeatureIndex(0);
    setSelectedLayerPath(layerData.layerPath);
    setIsLayersPanelVisible(true);
    addSelectedFeature(layerData.features![0]);
  };

  const renderLayerList = useCallback(() => {
    return (
      <LayerList
        layerList={arrayOfLayerData.map((layer) => ({
          layerName: layer.layerName ?? '',
          layerPath: layer.layerPath,
          numOffeatures: layer.features?.length ?? 0,
          layerFeatures: getFeaturesOfLayer(layer),
          tooltip: `${layer.layerName}, ${getFeaturesOfLayer(layer)}`,
        }))}
        isEnlargeDataTable={isEnlargeDataTable}
        selectedLayerIndex={arrayOfLayerData.findIndex((layer) => layer.layerPath === layerDataInfo?.layerPath)}
        handleListItemClick={(_layer, index: number) => {
          handleLayerChange(arrayOfLayerData[index]);
        }}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerDataInfo, isEnlargeDataTable, checkedFeatures]);

  return (
    <Box sx={sxClasses.detailsContainer}>
      {layerDataInfo && (
        <>
          <ResponsiveGrid.Root>
            <ResponsiveGrid.Left isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
              <LayerTitle>{t('general.layers')}</LayerTitle>
            </ResponsiveGrid.Left>
            <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  [theme.breakpoints.up('md')]: { justifyContent: 'right' },
                  [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
                }}
              >
                <LayerTitle hideTitle>{layerDataInfo.layerName}</LayerTitle>

                <Box>
                  <EnlargeButton isEnlargeDataTable={isEnlargeDataTable} setIsEnlargeDataTable={setIsEnlargeDataTable} />
                  <CloseButton isLayersPanelVisible={isLayersPanelVisible} setIsLayersPanelVisible={setIsLayersPanelVisible} />
                </Box>
              </Box>
            </ResponsiveGrid.Right>
          </ResponsiveGrid.Root>
          <ResponsiveGrid.Root sx={{ mt: 8 }}>
            <ResponsiveGrid.Left isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
              {renderLayerList()}
            </ResponsiveGrid.Left>
            <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
              {!isLayersHasFeatures() && (
                <Paper sx={{ padding: '2rem' }}>
                  <Typography variant="h3" gutterBottom sx={sxClasses.detailsInstructionsTitle}>
                    {t('details.detailsInstructions')}
                  </Typography>
                  <Typography component="p" sx={sxClasses.detailsInstructionsBody}>
                    {t('details.selectVisbleLayer')}
                  </Typography>
                </Paper>
              )}
              {isLayersHasFeatures() && (
                <Box sx={sxClasses.rightPanelContainer}>
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
                          disabled={checkedFeatures.length === 0}
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
                          onClick={() => handleFeatureNavigateChange(-1)}
                          disabled={currentFeatureIndex === 0}
                        >
                          <ArrowBackIosOutlinedIcon />
                        </IconButton>
                        <IconButton
                          sx={{ marginLeft: '20px' }}
                          aria-label="forward"
                          tooltip="details.nextFeatureBtn"
                          tooltipPlacement="top"
                          onClick={() => handleFeatureNavigateChange(1)}
                          // eslint-disable-next-line no-unsafe-optional-chaining
                          disabled={currentFeatureIndex === layerDataInfo?.features!.length - 1}
                        >
                          <ArrowForwardIosOutlinedIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                  <FeatureInfo features={layerDataInfo?.features} currentFeatureIndex={currentFeatureIndex} />
                </Box>
              )}
            </ResponsiveGrid.Right>
          </ResponsiveGrid.Root>
        </>
      )}
    </Box>
  );
}
