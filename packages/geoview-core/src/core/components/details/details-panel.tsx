import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { IconButton, Grid, ArrowForwardIosOutlinedIcon, ArrowBackIosOutlinedIcon, LayersClearOutlinedIcon, Box } from '@/ui';
import {
  useDetailsStoreActions,
  useDetailsCheckedFeatures,
  useDetailsLayerDataArrayBatch,
  useDetailsSelectedLayerPath,
  useDetailsCoordinateInfoEnabled,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import {
  useMapStoreActions,
  useMapVisibleLayers,
  useMapClickCoordinates,
  useMapHideCoordinateInfoSwitch,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { TypeFeatureInfoEntry, TypeLayerData } from '@/api/types/map-schema-types';

import { LayerListEntry, Layout } from '@/core/components/common';
import { checkSelectedLayerPathList } from '@/core/components/common/comp-common';
import { getSxClasses } from './details-style';
import { FeatureInfo } from './feature-info';
import { CONTAINER_TYPE, FEATURE_INFO_STATUS, TABS } from '@/core/utils/constant';
import { DetailsSkeleton } from './details-skeleton';
import { CoordinateInfo, CoordinateInfoSwitch } from './coordinate-info';
import { TypeContainerBox } from '@/core/types/global-types';

interface DetailsPanelType {
  fullWidth?: boolean;
  containerType?: TypeContainerBox;
}

/**
 * layers list
 *
 * @param {DetailsPanelProps} props The properties passed to LayersListFooter
 * @returns {JSX.Element} the layers list
 */
export function DetailsPanel({ fullWidth = false, containerType = CONTAINER_TYPE.FOOTER_BAR }: DetailsPanelType): JSX.Element {
  logger.logTraceRender('components/details/details-panel');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const mapId = useGeoViewMapId();
  const selectedLayerPath = useDetailsSelectedLayerPath();
  const arrayOfLayerDataBatch = useDetailsLayerDataArrayBatch();
  const checkedFeatures = useDetailsCheckedFeatures();
  const coordinateInfoEnabled = useDetailsCoordinateInfoEnabled();
  const hideCoordinateInfoSwitch = useMapHideCoordinateInfoSwitch();
  const visibleLayers = useMapVisibleLayers();
  const mapClickCoordinates = useMapClickCoordinates();
  const { setSelectedLayerPath, removeCheckedFeature, setLayerDataArrayBatchLayerPathBypass } = useDetailsStoreActions();
  const { addHighlightedFeature, removeHighlightedFeature, isLayerHiddenOnMap } = useMapStoreActions();

  // States
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState<number>(0);
  const [selectedLayerPathLocal, setSelectedLayerPathLocal] = useState<string>(selectedLayerPath);
  const [arrayOfLayerListLocal, setArrayOfLayerListLocal] = useState<LayerListEntry[]>([]);
  const prevLayerSelected = useRef<TypeLayerData>();
  const prevLayerFeatures = useRef<TypeFeatureInfoEntry[] | undefined | null>();
  const prevFeatureIndex = useRef<number>(0); // 0 because that's the default index for the features

  // #region MAIN HOOKS SECTION ***************************************************************************************

  /**
   * Checks if feature is in the store checkedFeatures array
   *
   * @param {TypeFeatureInfoEntry} feature The feature to check
   * @returns {boolean} true if feature is in checkedFeatures
   */
  // Create a memoized Set of checked feature IDs
  const checkedFeaturesSet = useMemo(() => {
    return new Set(checkedFeatures.map((feature) => feature?.uid));
  }, [checkedFeatures]);

  // Modified isFeatureInCheckedFeatures using the Set for O(1) lookup
  const isFeatureInCheckedFeatures = useCallback(
    (feature: TypeFeatureInfoEntry): boolean => {
      return checkedFeaturesSet.has(feature?.uid);
    },
    [checkedFeaturesSet]
  );

  /**
   * Clears the highlighed features when they are not checked.
   * @param {TypeFeatureInfoEntry[] | undefined | null} arrayToClear The array to clear of the unchecked features
   */
  // Modified clearHighlightsUnchecked
  const clearHighlightsUnchecked = useCallback(
    (arrayToClear: TypeFeatureInfoEntry[] | undefined | null) => {
      logger.logTraceUseCallback('DETAILS-PANEL - clearHighlightsUnchecked');

      arrayToClear?.forEach((feature) => {
        if (!checkedFeaturesSet.has(feature.uid)) {
          removeHighlightedFeature(feature);
        }
      });
    },
    [checkedFeaturesSet, removeHighlightedFeature]
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
    logger.logTraceUseMemo('DETAILS-PANEL - memoLayersList', visibleLayers, arrayOfLayerDataBatch);

    // Set the layers list (filter: visible - visible in range and isQueryable)
    const layerListEntries = visibleLayers
      .map((layerPath) => arrayOfLayerDataBatch.find((layerData) => layerData.layerPath === layerPath))
      .filter((layer) => layer && !isLayerHiddenOnMap(layer.layerPath))
      .filter((layer) => layer && layer.eventListenerEnabled)
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
            layerUniqueId: `${mapId}-${TABS.DETAILS}-${layer?.layerPath ?? ''}`,
          }) as LayerListEntry
      );

    // Add coordinate info layer if it exists in arrayOfLayerDataBatch
    const coordinateInfoLayer = arrayOfLayerDataBatch.find((layer) => layer.layerPath === 'coordinate-info');
    if (coordinateInfoLayer && coordinateInfoEnabled) {
      layerListEntries.unshift({
        layerName: coordinateInfoLayer.layerName ?? 'Coordinate Information',
        layerPath: coordinateInfoLayer.layerPath,
        layerStatus: coordinateInfoLayer.layerStatus,
        queryStatus: coordinateInfoLayer.queryStatus,
        numOffeatures: coordinateInfoLayer.features?.length ?? 0,
        layerFeatures: getNumFeaturesLabel(coordinateInfoLayer),
        tooltip: `${coordinateInfoLayer.layerName}, ${getNumFeaturesLabel(coordinateInfoLayer)}`,
        layerUniqueId: `${mapId}-${TABS.DETAILS}-${coordinateInfoLayer.layerPath}`,
      });
    }

    // Split the layers list into two groups while preserving order
    const layersWithFeatures = layerListEntries.filter((layer) => layer.numOffeatures && layer.numOffeatures > 0);
    const layersWithoutFeatures = layerListEntries.filter((layer) => layer.numOffeatures === 0);

    // Combine the lists (features first, then no features)
    const orderedLayerListEntries = [...layersWithFeatures, ...layersWithoutFeatures];
    return orderedLayerListEntries;
  }, [visibleLayers, arrayOfLayerDataBatch, coordinateInfoEnabled, isLayerHiddenOnMap, getNumFeaturesLabel, mapId]);

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
      if (currentFeature && !isFeatureInCheckedFeatures(currentFeature)) removeHighlightedFeature(currentFeature);

      // Get the next feature navigating to
      const nextFeature = memoSelectedLayerData?.features?.[newIndex];

      // If found, add it
      if (nextFeature) addHighlightedFeature(nextFeature);

      // Update the current feature index
      setCurrentFeatureIndex(newIndex);
    },
    [memoSelectedLayerData, isFeatureInCheckedFeatures, removeHighlightedFeature, addHighlightedFeature]
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
    removeHighlightedFeature('all');

    // Unselect the layer path if no more layers in the list
    if (!memoLayersList.length) setSelectedLayerPath('');
  }, [memoLayersList, setSelectedLayerPath, removeHighlightedFeature]);

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
      addHighlightedFeature(memoSelectedLayerDataFeatures[currentFeatureIndex]);
    }
  }, [
    memoLayersList,
    memoSelectedLayerDataFeatures,
    currentFeatureIndex,
    addHighlightedFeature,
    removeHighlightedFeature,
    clearHighlightsUnchecked,
  ]);

  /**
   * Effect used to persist the layer path bypass for the layerDataArray.
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
    logger.logTraceUseEffect('DETAILS-PANEL - check selection', memoLayerSelectedItem, selectedLayerPath);

    // If selected layer path is not empty, launch the checker to try to maintain the selection on the correct selected layer
    if (selectedLayerPath) {
      // Redirect to the keep selected layer path logic
      checkSelectedLayerPathList(setLayerDataArrayBatchLayerPathBypass, setSelectedLayerPath, memoLayerSelectedItem, memoLayersList);
    }
  }, [memoLayerSelectedItem, memoLayersList, selectedLayerPath, setLayerDataArrayBatchLayerPathBypass, setSelectedLayerPath]);

  // #endregion

  // #region EVENT HANDLERS SECTION ***********************************************************************************
  /**
   * Handles click to remove all features in right panel.
   */
  const handleClearAllHighlights = (): void => {
    // clear all highlights from features on the map in all layers
    removeHighlightedFeature('all');
    // clear checked features array
    removeCheckedFeature('all');
    // add the highlight to the current feature
    addHighlightedFeature(memoSelectedLayerData?.features?.[currentFeatureIndex] as TypeFeatureInfoEntry);
  };

  /**
   * Handles clicks to forward and back arrows in right panel.
   * Removes previous feature from selectedFeatures store if it is not checked, and adds new feature.
   *
   * @param {-1 | 1} change The change to index number (-1 for back, 1 for forward)
   */
  const handleFeatureNavigateChange = useCallback(
    (change: -1 | 1): void => {
      // Log
      logger.logTraceUseCallback('DETAILS-PANEL - handleFeatureNavigateChange', currentFeatureIndex);

      // Keep previous index for navigation
      prevFeatureIndex.current = currentFeatureIndex;

      // Update current index
      updateFeatureSelected(currentFeatureIndex + change, memoSelectedLayerData);
    },
    [currentFeatureIndex, memoSelectedLayerData, updateFeatureSelected]
  );

  /**
   * Handles click to change the selected layer in left panel.
   *
   * @param {LayerListEntry} layerEntry The data of the newly selected layer
   */
  const handleLayerChange = useCallback(
    (layerEntry: LayerListEntry): void => {
      // Log
      logger.logTraceUseCallback('DETAILS-PANEL - handleLayerChange', layerEntry.layerPath);
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
  const resetCurrentIndex = (): void => {
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
    setSelectedLayerPathLocal(selectedLayerPath);
    // Reset the feature index, because it's a whole different selected layer with different features
    resetCurrentIndex();
  }

  /**
   * Select a layer after a map click happened on the map.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL- mapClickCoordinates', mapClickCoordinates);

    // If nothing was previously selected at all
    if (mapClickCoordinates && memoLayersList?.length && !selectedLayerPath.length) {
      const selectedLayer = memoLayersList.find((layer) => !!layer.numOffeatures);
      // Select the first layer that has features
      setSelectedLayerPath(selectedLayer?.layerPath ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapClickCoordinates, memoLayersList, setSelectedLayerPath]);

  /**
   * Check all layers status is processed while querying
   */
  const memoIsAllLayersQueryStatusProcessed = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DETAILS-PANEL - AllLayersQueryStatusProcessed.');

    if (!arrayOfLayerDataBatch || arrayOfLayerDataBatch?.length === 0) return () => false;

    return () => arrayOfLayerDataBatch?.every((layer) => layer.queryStatus === FEATURE_INFO_STATUS.PROCESSED);
  }, [arrayOfLayerDataBatch]);

  // #endregion

  /**
   * Render the right panel content based on detail's layer and loading status.
   * NOTE: Here we return null, so that in responsive grid layout, it can be used as flag to render the guide for details.
   * @returns {JSX.Element | null} JSX.Element | null
   */
  const renderContent = (): JSX.Element | null => {
    if (selectedLayerPath === 'coordinate-info') {
      return <CoordinateInfo fullWidth={fullWidth} />;
    }

    // If there is no layer, return null for the guide to show
    if ((memoLayersList && memoLayersList.length === 0) || selectedLayerPath === '') {
      return null;
    }

    // Until process or something found for selected layerPath, return skeleton
    if (!memoIsAllLayersQueryStatusProcessed() && !(memoSelectedLayerDataFeatures && memoSelectedLayerDataFeatures.length > 0)) {
      return <DetailsSkeleton />;
    }

    if (memoSelectedLayerDataFeatures && memoSelectedLayerDataFeatures.length > 0) {
      // Get only the current feature
      const currentFeature = memoSelectedLayerDataFeatures[currentFeatureIndex];

      return (
        <Box sx={fullWidth ? sxClasses.rightPanelContainer : { ...sxClasses.rightPanelContainer }}>
          <Grid container sx={sxClasses.rightPanelBtnHolder}>
            <Grid size={{ xs: 6 }}>
              <Box style={{ marginLeft: '1.375rem' }}>
                {t('details.featureDetailsTitle')
                  .replace('{count}', `${currentFeatureIndex + 1}`)
                  .replace('{total}', `${memoSelectedLayerDataFeatures?.length}`)}
                <IconButton
                  sx={{ marginLeft: '1.25rem', [theme.breakpoints.down('sm')]: { display: 'none' } }}
                  aria-label={t('details.clearAllfeatures')!}
                  tooltip={t('details.clearAllfeatures')!}
                  tooltipPlacement="top"
                  onClick={() => handleClearAllHighlights()}
                  className="buttonOutline"
                  disabled={checkedFeatures.length === 0}
                >
                  <LayersClearOutlinedIcon />
                </IconButton>
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ textAlign: 'right', marginRight: '1.625rem' }}>
                <IconButton
                  aria-label={t('details.previousFeatureBtn')!}
                  tooltip={t('details.previousFeatureBtn')!}
                  tooltipPlacement="top"
                  onClick={() => handleFeatureNavigateChange(-1)}
                  disabled={currentFeatureIndex <= 0}
                  className="buttonOutline"
                >
                  <ArrowBackIosOutlinedIcon />
                </IconButton>
                <IconButton
                  sx={{ marginLeft: '1.25rem' }}
                  aria-label={t('details.nextFeatureBtn')!}
                  tooltip={t('details.nextFeatureBtn')!}
                  tooltipPlacement="top"
                  onClick={() => handleFeatureNavigateChange(1)}
                  disabled={!memoSelectedLayerData?.features || currentFeatureIndex + 1 >= memoSelectedLayerData.features.length}
                  className="buttonOutline"
                >
                  <ArrowForwardIosOutlinedIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
          <FeatureInfo feature={currentFeature} />
        </Box>
      );
    }

    // if no condition met, return null for Guide tab
    return null;
  };

  return (
    <Layout
      containerType={containerType}
      layoutSwitch={!hideCoordinateInfoSwitch ? <CoordinateInfoSwitch /> : undefined}
      selectedLayerPath={selectedLayerPath}
      layerList={memoLayersList}
      onLayerListClicked={(layerEntry) => handleLayerChange(layerEntry)}
      fullWidth={fullWidth}
      guideContentIds={['details']}
    >
      {renderContent()}
    </Layout>
  );
}
