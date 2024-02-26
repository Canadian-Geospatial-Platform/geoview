import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { TypeFeatureInfoEntry, TypeLayerData, TypeGeometry, TypeArrayOfFeatureInfoEntries } from '@/api/events/payloads';
import {
  useMapStoreActions,
  useMapOrderedLayerInfo,
  useDetailsStoreActions,
  useDetailsStoreCheckedFeatures,
  useDetailsStoreLayerDataArrayBatch,
  useDetailsStoreSelectedLayerPath,
} from '@/core/stores';
import { logger } from '@/core/utils/logger';

import { LayerListEntry, Layout } from '../common';
import { getSxClasses } from './details-style';
import { FeatureInfo } from './feature-info-new';

interface DetailsPanelType {
  fullWidth?: boolean;
}
/**
 * layers list
 *
 * @param {DetailsPanelProps} props The properties passed to LayersListFooter
 * @returns {JSX.Element} the layers list
 */
export function DetailsPanel({ fullWidth }: DetailsPanelType): JSX.Element {
  // Log
  logger.logTraceRender('components/details/details-panel');

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Get states and actions from store
  const selectedLayerPath = useDetailsStoreSelectedLayerPath();
  const arrayOfLayerDataBatch = useDetailsStoreLayerDataArrayBatch();
  const checkedFeatures = useDetailsStoreCheckedFeatures();
  const orderedLayerInfo = useMapOrderedLayerInfo();
  const { setSelectedLayerPath, removeCheckedFeature, setLayerDataArrayBatchLayerPathBypass } = useDetailsStoreActions();
  const { addSelectedFeature, removeSelectedFeature } = useMapStoreActions();

  // #region USE STATE SECTION ****************************************************************************************

  // internal state
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState<number>(0);
  const [selectedLayerPathLocal, setselectedLayerPathLocal] = useState<string>(selectedLayerPath);
  const [arrayOfLayerListLocal, setArrayOfLayerListLocal] = useState<LayerListEntry[]>([]);

  const prevLayerSelected = useRef<TypeLayerData>();
  const prevLayerFeatures = useRef<TypeArrayOfFeatureInfoEntries>();
  const prevFeatureIndex = useRef<number>(0); // 0 because that's the default index for the features

  // #endregion

  // #region MAIN HOOKS SECTION ***************************************************************************************

  /**
   * Checks if feature is in the store checkedFeatures array
   *
   * @param {TypeFeatureInfoEntry} feature The feature to check
   * @returns {boolean} true if feature is in checkedFeatures
   */
  const isFeatureInCheckedFeatures = useCallback(
    (feature: TypeFeatureInfoEntry): boolean => {
      // Log
      logger.logTraceUseCallback('DETAILS-PANEL - isFeatureInCheckedFeatures');

      return checkedFeatures.some((checkedFeature) => {
        return (checkedFeature.geometry as TypeGeometry)?.ol_uid === (feature.geometry as TypeGeometry)?.ol_uid;
      });
    },
    [checkedFeatures]
  );

  /**
   * Clears the highlighed features when they are not checked.
   * @param {TypeArrayOfFeatureInfoEntries} arrayToClear The array to clear of the unchecked features
   */
  const clearHighlightsUnchecked = useCallback(
    (arrayToClear: TypeArrayOfFeatureInfoEntries | undefined) => {
      // Log
      logger.logTraceUseCallback('DETAILS-PANEL - clearHighlightsUnchecked');

      // Clear any feature that's not currently checked
      arrayToClear?.forEach((feature) => {
        if (!isFeatureInCheckedFeatures(feature)) removeSelectedFeature(feature);
      });
    },
    [isFeatureInCheckedFeatures, removeSelectedFeature]
  );

  /**
   * Gets the label for the number of features of a layer.
   * @returns string
   */
  const getNumFeaturesLabel = useCallback(
    (layer: TypeLayerData): string => {
      // Log
      logger.logTraceUseCallback('DETAILS-PANEL - getNumFeaturesLabel');

      const numOfFeatures = layer.features?.length ?? 0;
      return `${numOfFeatures} ${t('details.feature')}${numOfFeatures > 1 ? 's' : ''}`;
    },
    [t]
  );

  /**
   * Memoizes the layers list for the LayerList component and centralizing indexing purposes.
   */
  const memoLayersList = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DETAILS-PANEL - memoLayersList', orderedLayerInfo, arrayOfLayerDataBatch);

    const visibleLayers = orderedLayerInfo
      .map((layerInfo) => {
        if (layerInfo.visible) return layerInfo.layerPath;
        return undefined;
      })
      .filter((layerPath) => layerPath !== undefined);

    if (!visibleLayers.includes(selectedLayerPath)) setSelectedLayerPath('');

    // Set the layers list
    const layerListEntries = visibleLayers
      .map((layerPath) => arrayOfLayerDataBatch.find((layerData) => layerData.layerPath === layerPath))
      .filter((layer) => layer)
      .map(
        (layer) =>
          ({
            layerName: layer!.layerName ?? '',
            layerPath: layer!.layerPath,
            layerStatus: layer!.layerStatus,
            queryStatus: layer!.queryStatus,
            numOffeatures: layer!.features?.length ?? 0,
            layerFeatures: getNumFeaturesLabel(layer!),
            tooltip: `${layer!.layerName}, ${getNumFeaturesLabel(layer!)}`,
          } as LayerListEntry)
      );
    if (!layerListEntries.length) setSelectedLayerPath('');
    return layerListEntries;
  }, [orderedLayerInfo, arrayOfLayerDataBatch, selectedLayerPath, setSelectedLayerPath, getNumFeaturesLabel]);

  /**
   * Memoizes the selected layer for the LayerList component.
   */
  const memoLayerSelectedItem = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DETAILS-PANEL - memoLayerSelectedItem', memoLayersList, selectedLayerPath);
    return memoLayersList.find((layer) => layer.layerPath === selectedLayerPath);
  }, [memoLayersList, selectedLayerPath]);

  /**
   * Memoizes the selected layer data.
   */
  const memoSelectedLayerData = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DETAILS-PANEL - memoSelectedLayerData', arrayOfLayerDataBatch, selectedLayerPath);
    return arrayOfLayerDataBatch.find((layer) => layer.layerPath === selectedLayerPath);
  }, [arrayOfLayerDataBatch, selectedLayerPath]);

  /**
   * Memoizes the selected layer data features.
   */
  const memoSelectedLayerDataFeatures = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DETAILS-PANEL - memoSelectedLayerDataFeatures', memoSelectedLayerData?.features);
    return memoSelectedLayerData?.features;
  }, [memoSelectedLayerData?.features]);

  /**
   * Updates the selected features for the highlight on the map.
   * Removes the previously highlighted feature and adds a new one.
   * @param {number} newIndex The new index to select the feature
   * @param {TypeLayerData?} prevLayer The layer on which to unselect features
   */
  const updateFeatureSelected = useCallback(
    (newIndex: number, prevLayer?: TypeLayerData) => {
      // Log
      logger.logTraceUseCallback('DETAILS-PANEL - updateFeatureSelected');

      // Get the current feature in highlight
      let currentFeature;
      if (prevLayer?.features) {
        currentFeature = prevLayer?.features?.[prevFeatureIndex.current];
      }

      // If found, remove it
      if (currentFeature && !isFeatureInCheckedFeatures(currentFeature)) removeSelectedFeature(currentFeature);

      // Get the next feature navigating to
      const nextFeature = memoSelectedLayerData?.features?.[newIndex];

      // If found, add it
      if (nextFeature) addSelectedFeature(nextFeature);

      // Update the current feature index
      setCurrentFeatureIndex(newIndex);
    },
    [memoSelectedLayerData, isFeatureInCheckedFeatures, removeSelectedFeature, addSelectedFeature]
  );

  /**
   * Effect used when the layers list changes.
   * Note: This useEffect is triggered many times as the layerDataArray gets processed.
   * History: Logic was initially in click-marker. Brought here.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - memoLayersList changed', memoLayersList);

    // Clear all
    removeSelectedFeature('all');
  }, [memoLayersList, removeSelectedFeature]);

  /**
   * Effect used when the layers list changes.
   * Note: This useEffect is triggered many times as the layerDataArray gets processed.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - memoSelectedLayerDataFeatures changed', memoLayersList, memoSelectedLayerDataFeatures);

    // Clear the unchecked highlights
    clearHighlightsUnchecked(prevLayerFeatures.current);
    clearHighlightsUnchecked(memoSelectedLayerDataFeatures);

    // If any features
    if (memoSelectedLayerDataFeatures && memoSelectedLayerDataFeatures.length) {
      addSelectedFeature(memoSelectedLayerDataFeatures[currentFeatureIndex]);
    }
  }, [
    memoLayersList,
    memoSelectedLayerDataFeatures,
    currentFeatureIndex,
    addSelectedFeature,
    removeSelectedFeature,
    clearHighlightsUnchecked,
  ]);

  /**
   * Effect used to reset the layer path for the bypass.
   * A useEffect is necessary in order to keep this component pure and be able to set the layer path bypass elsewhere than in this component.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - update layer data bypass', selectedLayerPath);

    // Set the layer data array batch bypass to the currently selected layer
    setLayerDataArrayBatchLayerPathBypass(selectedLayerPath);
  }, [selectedLayerPath, setLayerDataArrayBatchLayerPathBypass]);

  /**
   * Effect used to persist or alter the current layer selection based on the layers list changes
   * A useEffect is necessary in order to keep this component pure and be able to set the selected layer path elsewhere than in this component.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - check selection', memoLayerSelectedItem);

    // Check if the layer we are on is not 'processed' or 'error', ignore if so
    if (memoLayerSelectedItem && !(memoLayerSelectedItem.queryStatus === 'processed' || memoLayerSelectedItem.queryStatus === 'error'))
      return;

    // If the layer has features
    if (memoLayerSelectedItem?.numOffeatures) {
      // Log
      logger.logDebug('DETAILS-PANEL', 'keep selection', memoLayerSelectedItem);
      // All good, keep selection
      // Reset the bypass for next time
      setLayerDataArrayBatchLayerPathBypass(memoLayerSelectedItem.layerPath);
    } else {
      // Find the first layer with features
      const anotherLayerEntry = memoLayersList.find((layer) => {
        return memoLayersList.find((layer2) => layer.layerPath === layer2.layerPath && layer2.numOffeatures);
      });

      // If found
      if (anotherLayerEntry) {
        // Log
        logger.logDebug('DETAILS-PANEL', 'select another', memoLayerSelectedItem, anotherLayerEntry.layerPath);
        // Select that one
        setSelectedLayerPath(anotherLayerEntry.layerPath);
      } else {
        // Log
        logger.logDebug('DETAILS-PANEL', 'select none', memoLayerSelectedItem);
        // None found, select none
        //  TODO:: Investigate infinte loop in appbar for statement.
        // setSelectedLayerPath('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoLayerSelectedItem, memoLayersList]);

  // #endregion

  // #region EVENT HANDLERS SECTION ***********************************************************************************

  /**
   * Handles click to remove all features in right panel.
   */
  const handleClearAllHighlights = () => {
    // clear all highlights from features on the map in all layers
    removeSelectedFeature('all');
    // clear checked features array
    removeCheckedFeature('all');
    // add the highlight to the current feature
    addSelectedFeature(memoSelectedLayerData?.features?.[currentFeatureIndex] as TypeFeatureInfoEntry);
  };

  /**
   * Handles clicks to forward and back arrows in right panel.
   * Removes previous feature from selectedFeatures store if it is not checked, and adds new feature.
   *
   * @param {-1 | 1} change The change to index number (-1 for back, 1 for forward)
   */
  const handleFeatureNavigateChange = (change: -1 | 1): void => {
    // Keep previous index for navigation
    prevFeatureIndex.current = currentFeatureIndex;

    // Update current index
    updateFeatureSelected(currentFeatureIndex + change, memoSelectedLayerData!);
  };

  /**
   * Handles click to change the selected layer in left panel.
   *
   * @param {LayerListEntry} layerEntry The data of the newly selected layer
   */
  const handleLayerChange = useCallback(
    (layerEntry: LayerListEntry): void => {
      // Set the selected layer path in the store which will in turn trigger the store listeners on this component
      setSelectedLayerPath(layerEntry.layerPath);
    },
    [setSelectedLayerPath]
  );

  // #endregion

  // #region PROCESSING ***********************************************************************************************

  /**
   * Resets the currently selected feature index to 0 and keeps in reference the previously selected layer and
   * the previously selected feature index so that in the useEffect, later, the component can udpate
   * the selected features with the store.
   */
  const resetCurrentIndex = () => {
    // Keep reference on previously selected layer
    prevLayerSelected.current = arrayOfLayerDataBatch.find((layer) => layer.layerPath === selectedLayerPathLocal);
    // Keep reference on previously selected features
    prevLayerFeatures.current = prevLayerSelected.current?.features;
    // Keep reference on previously selected index
    prevFeatureIndex.current = currentFeatureIndex;
    // Reset the indexing
    setCurrentFeatureIndex(0);
  };

  // If the array of layer data has changed since last render
  if (arrayOfLayerListLocal !== memoLayersList) {
    // Selected array layer data changed
    setArrayOfLayerListLocal(memoLayersList);
    // Reset the feature index, because there may be less features this time than where the index was before
    resetCurrentIndex();
  }

  // If the layer path has changed since last render
  if (selectedLayerPathLocal !== selectedLayerPath) {
    // Selected layer path changed
    setselectedLayerPathLocal(selectedLayerPath);
    // Reset the feature index, because it's a whole different selected layer with different features
    resetCurrentIndex();
  }

  // #endregion

  // #region RENDER SECTION *******************************************************************************************

  /**
   * Renders the complete Details Panel component
   * @returns JSX.Element
   */
  const renderComplete = () => {
    if (memoLayersList) {
      return (
        <Layout
          selectedLayerPath={selectedLayerPath || ''}
          layerList={memoLayersList}
          onLayerListClicked={handleLayerChange}
          fullWidth={fullWidth}
        >
          {memoSelectedLayerDataFeatures && (
            <Box sx={sxClasses.rightPanelContainer}>
              <Grid container sx={sxClasses.rightPanelBtnHolder}>
                <Grid item xs={6}>
                  <Box style={{ marginLeft: '22px' }}>
                    Feature {currentFeatureIndex + 1} of {memoSelectedLayerDataFeatures.length}
                    <IconButton
                      sx={{ marginLeft: '20px', [theme.breakpoints.down('sm')]: { display: 'none' } }}
                      aria-label="clear-all-features"
                      tooltip="details.clearAllfeatures"
                      tooltipPlacement="top"
                      onClick={() => handleClearAllHighlights()}
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
                      disabled={currentFeatureIndex <= 0}
                      className="style1"
                    >
                      <ArrowBackIosOutlinedIcon />
                    </IconButton>
                    <IconButton
                      sx={{ marginLeft: '20px' }}
                      aria-label="forward"
                      tooltip="details.nextFeatureBtn"
                      tooltipPlacement="top"
                      onClick={() => handleFeatureNavigateChange(1)}
                      disabled={!memoSelectedLayerData?.features || currentFeatureIndex + 1 >= memoSelectedLayerData!.features!.length}
                      className="style1"
                    >
                      <ArrowForwardIosOutlinedIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
              <FeatureInfo features={memoSelectedLayerData?.features} currentFeatureIndex={currentFeatureIndex} />
            </Box>
          )}
          {!memoSelectedLayerDataFeatures && (
            <Paper sx={{ padding: '2rem' }} className="bordered">
              <Typography variant="h3" gutterBottom sx={sxClasses.detailsInstructionsTitle}>
                {t('details.detailsInstructions')}
              </Typography>
              <Typography component="p" sx={sxClasses.detailsInstructionsBody}>
                {t('details.selectVisbleLayer')}
              </Typography>
            </Paper>
          )}
        </Layout>
      );
    }

    // Loading UI
    return <Typography>{t('details.loadingUI')}</Typography>;
  };

  // Render
  return renderComplete();

  // # endregion
}
