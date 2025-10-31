import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { IconButton, Grid, ArrowForwardIosOutlinedIcon, ArrowBackIosOutlinedIcon, ClearHighlightIcon, Box } from '@/ui';
import {
  useDetailsStoreActions,
  useDetailsCheckedFeatures,
  useDetailsLayerDataArrayBatch,
  useDetailsSelectedLayerPath,
  useDetailsCoordinateInfoEnabled,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import {
  useUIActiveFooterBarTabId,
  useUIFooterBarIsCollapsed,
  useUIActiveAppBarTab,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import {
  useMapStoreActions,
  useMapClickCoordinates,
  useMapHideCoordinateInfoSwitch,
  useMapAllVisibleandInRangeLayers,
  useMapOrderedLayers,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { doUntil } from '@/core/utils/utilities';
import type { TypeFeatureInfoEntry, TypeLayerData } from '@/api/types/map-schema-types';
import type { TypeMapMouseInfo } from '@/geo/map/map-viewer';

import type { LayerListEntry, LayoutExposedMethods } from '@/core/components/common';
import { Layout } from '@/core/components/common';
import { checkSelectedLayerPathList } from '@/core/components/common/comp-common';
import { getSxClasses } from './details-style';
import { FeatureInfo } from './feature-info';
import { CONTAINER_TYPE, FEATURE_INFO_STATUS, TABS } from '@/core/utils/constant';
import { DetailsSkeleton } from './details-skeleton';
import { CoordinateInfo, CoordinateInfoSwitch } from './coordinate-info';
import type { TypeContainerBox } from '@/core/types/global-types';

interface DetailsPanelType {
  containerType?: TypeContainerBox;
}

/**
 * layers list
 *
 * @param {DetailsPanelProps} props The properties passed to LayersListFooter
 * @returns {JSX.Element} the layers list
 */
export function DetailsPanel({ containerType = CONTAINER_TYPE.FOOTER_BAR }: DetailsPanelType): JSX.Element {
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
  const visibleInRangeLayers = useMapAllVisibleandInRangeLayers();
  const orderedLayers = useMapOrderedLayers();
  const mapClickCoordinates = useMapClickCoordinates();
  const selectedTab = useUIActiveFooterBarTabId();
  const isCollapsed = useUIFooterBarIsCollapsed();
  const activeAppBarTab = useUIActiveAppBarTab();
  const { setSelectedLayerPath, removeCheckedFeature, setLayerDataArrayBatchLayerPathBypass } = useDetailsStoreActions();
  const { addHighlightedFeature, removeHighlightedFeature, isLayerHiddenOnMap } = useMapStoreActions();

  // States
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState<number>(0);
  const [selectedLayerPathLocal, setSelectedLayerPathLocal] = useState<string>(selectedLayerPath);
  const [arrayOfLayerListLocal, setArrayOfLayerListLocal] = useState<LayerListEntry[]>([]);
  const [geometryLoaded, setGeometryLoaded] = useState<number>(0); // Counter to force re-render when geometry loads
  const [isRightPanelVisible, setIsRightPanelVisible] = useState<boolean>(false);
  const prevLayerSelected = useRef<TypeLayerData>();
  const prevLayerFeatures = useRef<TypeFeatureInfoEntry[] | undefined | null>();
  const prevFeatureIndex = useRef<number>(0); // 0 because that's the default index for the features
  const prevMapClickCoordinates = useRef<TypeMapMouseInfo | undefined>(mapClickCoordinates);
  const layoutRef = useRef<LayoutExposedMethods>(null);

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
      const label =
        numOfFeatures === 0
          ? `${t('general.none')} ${t('details.feature')} ${t('details.selected')}`
          : `${numOfFeatures} ${t('details.feature')}${numOfFeatures > 1 ? 's' : ''}`;
      return label;
    },
    [t]
  );

  /**
   * Checks if a feature has valid geometry
   * @param {TypeFeatureInfoEntry} feature - The feature to check
   * @returns {boolean} true if feature has valid geometry
   */
  const hasValidGeometry = useCallback((feature: TypeFeatureInfoEntry | undefined): boolean => {
    return !!(feature?.geometry && feature?.extent && !feature.extent.includes(Infinity));
  }, []);

  /**
   * Memoizes whether the panel is currently open
   */
  const isPanelOpen = useMemo(() => {
    if (containerType === CONTAINER_TYPE.FOOTER_BAR) {
      return selectedTab === TABS.DETAILS && !isCollapsed && isRightPanelVisible;
    }
    if (containerType === CONTAINER_TYPE.APP_BAR) {
      return activeAppBarTab.tabId === 'details' && activeAppBarTab.isOpen && isRightPanelVisible;
    }
    return false;
  }, [containerType, selectedTab, isCollapsed, activeAppBarTab, isRightPanelVisible]);

  /**
   * Memoizes the layers list for the LayerList component and centralizing indexing purposes.
   */
  const memoLayersList = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DETAILS-PANEL - memoLayersList', visibleInRangeLayers, arrayOfLayerDataBatch);

    // Set the layers list (filter: visible - visible in range and isQueryable)
    const layerListEntries = visibleInRangeLayers
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

    // Merge in-range and out-of-range layers while preserving order from arrayOfLayerDataBatch
    const existingLayerPaths = new Set(layerListEntries.map((entry) => entry.layerPath));

    // Add layers with features that aren't already in the list (out-of-range layers with features)
    arrayOfLayerDataBatch.forEach((layer) => {
      if ((layer.features?.length ?? 0) > 0 && !existingLayerPaths.has(layer.layerPath) && layer.layerPath !== 'coordinate-info') {
        layerListEntries.push({
          layerName: layer.layerName ?? '',
          layerPath: layer.layerPath,
          layerStatus: layer.layerStatus,
          queryStatus: layer.queryStatus,
          numOffeatures: layer.features?.length ?? 0,
          layerFeatures: getNumFeaturesLabel(layer),
          tooltip: `${layer.layerName}, ${getNumFeaturesLabel(layer)}`,
          layerUniqueId: `${mapId}-${TABS.DETAILS}-${layer.layerPath}`,
        });
      }
    });

    // Split the layers list into two groups while preserving order (exclude coordinate-info from sorting)
    const layersWithFeatures = layerListEntries.filter(
      (layer) => layer.numOffeatures && layer.numOffeatures > 0 && layer.layerPath !== 'coordinate-info'
    );
    const layersWithoutFeatures = layerListEntries.filter((layer) => layer.numOffeatures === 0 && layer.layerPath !== 'coordinate-info');

    // Sort layersWithFeatures according to orderedLayers
    layersWithFeatures.sort((a, b) => {
      const indexA = orderedLayers.indexOf(a.layerPath);
      const indexB = orderedLayers.indexOf(b.layerPath);
      // If not found in orderedLayers, put at the end
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    // Combine the lists (features first, then no features)
    const orderedLayerListEntries = [...layersWithFeatures, ...layersWithoutFeatures];

    // Add coordinate info layer at the beginning if it exists and is enabled
    const coordinateInfoLayer = arrayOfLayerDataBatch.find((layer) => layer.layerPath === 'coordinate-info');
    if (coordinateInfoLayer && coordinateInfoEnabled) {
      orderedLayerListEntries.unshift({
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

    return orderedLayerListEntries;
  }, [visibleInRangeLayers, arrayOfLayerDataBatch, coordinateInfoEnabled, isLayerHiddenOnMap, getNumFeaturesLabel, mapId, orderedLayers]);

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

    // Unselect the layer path if no more layers in the list
    if (!memoLayersList.length) setSelectedLayerPath('');
  }, [memoLayersList, setSelectedLayerPath]);

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

    // Re-highlight all checked features to ensure they persist through zoom
    checkedFeatures.forEach((checkedFeature) => {
      if (hasValidGeometry(checkedFeature)) {
        addHighlightedFeature(checkedFeature);
      }
    });

    // Highlight current feature if panel is open and feature has geometry
    if (isPanelOpen && memoSelectedLayerDataFeatures && memoSelectedLayerDataFeatures.length) {
      const featureToHighlight = memoSelectedLayerDataFeatures[currentFeatureIndex];

      if (hasValidGeometry(featureToHighlight)) {
        addHighlightedFeature(featureToHighlight);
      }
    }
  }, [
    memoSelectedLayerDataFeatures,
    currentFeatureIndex,
    addHighlightedFeature,
    clearHighlightsUnchecked,
    checkedFeatures,
    isPanelOpen,
    hasValidGeometry,
    geometryLoaded,
    memoLayersList,
  ]);

  /**
   * Poll for geometry loading on the current feature
   */
  useEffect(() => {
    const featureToCheck = memoSelectedLayerDataFeatures?.[currentFeatureIndex];

    // If feature exists but doesn't have geometry yet, set up polling
    if (featureToCheck && !featureToCheck.geometry) {
      const intervalId = doUntil(
        () => {
          const currentFeature = memoSelectedLayerDataFeatures?.[currentFeatureIndex];

          if (hasValidGeometry(currentFeature)) {
            // Geometry loaded! Trigger highlight by forcing a re-render
            if (isPanelOpen) {
              addHighlightedFeature(currentFeature);
            }

            // Force re-render to enable zoom/checkbox buttons
            setGeometryLoaded((prev) => prev + 1);

            // Return true to stop the interval
            return true;
          }

          return false;
        },
        500,
        30000
      ); // Check every 500ms, timeout after 30 seconds

      return () => {
        clearInterval(intervalId);
      };
    }

    return undefined;
  }, [memoSelectedLayerDataFeatures, currentFeatureIndex, isPanelOpen, addHighlightedFeature, hasValidGeometry]);

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
   * Handles when the right panel is closed in responsive layout.
   * Removes the currently selected feature highlight (but keeps checked features).
   */
  const handleRightPanelClosed = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('DETAILS-PANEL - handleRightPanelClosed');

    // Only remove the current selected feature highlight if it's not checked
    const currentFeature = memoSelectedLayerData?.features?.[currentFeatureIndex];
    if (currentFeature && !isFeatureInCheckedFeatures(currentFeature)) {
      removeHighlightedFeature(currentFeature);
    }
  }, [removeHighlightedFeature, memoSelectedLayerData, currentFeatureIndex, isFeatureInCheckedFeatures]);

  /**
   * Handles when the right panel visibility changes in responsive layout.
   * Updates the local state to track panel visibility.
   */
  const handleRightPanelVisibilityChanged = useCallback((isVisible: boolean): void => {
    // Log
    logger.logTraceUseCallback('DETAILS-PANEL - handleRightPanelVisibilityChanged', isVisible);
    setIsRightPanelVisible(isVisible);
  }, []);

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

      // Re-highlight the current feature when panel becomes visible (layer selection makes panel visible)
      // Use setTimeout to ensure the layer data is updated first
      setTimeout(() => {
        const layerData = arrayOfLayerDataBatch.find((layer) => layer.layerPath === layerEntry.layerPath);
        const featureToHighlight = layerData?.features?.[0]; // Will be index 0 after layer change
        if (featureToHighlight && hasValidGeometry(featureToHighlight)) {
          addHighlightedFeature(featureToHighlight);
        }
      }, 0);
    },
    [setSelectedLayerPath, arrayOfLayerDataBatch, hasValidGeometry, addHighlightedFeature]
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

    // Only reset the feature index if the number of features in the currently selected layer changed
    const currentSelectedLayer = memoLayersList.find((layer) => layer.layerPath === selectedLayerPath);
    const previousSelectedLayer = arrayOfLayerListLocal.find((layer) => layer.layerPath === selectedLayerPath);

    // Reset index only if feature count changed for the selected layer
    if (currentSelectedLayer && previousSelectedLayer && currentSelectedLayer.numOffeatures !== previousSelectedLayer.numOffeatures) {
      resetCurrentIndex();
    }
  }

  // If the layer path has changed since last render
  if (selectedLayerPathLocal !== selectedLayerPath) {
    // Selected layer path changed
    setSelectedLayerPathLocal(selectedLayerPath);
    // Reset the feature index, because it's a whole different selected layer with different features
    resetCurrentIndex();
  }

  // Select a layer after a map click happened on the map.
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL- mapClickCoordinates', mapClickCoordinates);

    // Check if coordinates actually changed (new map click)
    const coordinatesChanged =
      mapClickCoordinates && JSON.stringify(mapClickCoordinates) !== JSON.stringify(prevMapClickCoordinates.current);

    // Show the details for a feature on map click
    if (mapClickCoordinates && memoLayersList?.length) {
      // Select the first layer that has features and isn't the coordinate info
      const selectedLayer = memoLayersList.find((layer) => !!layer.numOffeatures && layer.layerPath !== 'coordinate-info');
      let newSelectedLayerPath = selectedLayer?.layerPath ?? '';

      // Fallback to the coordinate info if it's enabled and no features are available
      if (!selectedLayer && coordinateInfoEnabled) {
        newSelectedLayerPath = 'coordinate-info';
      }

      setSelectedLayerPath(newSelectedLayerPath);

      // make sure the right panel is visible
      layoutRef.current?.showRightPanel(true);
    }

    // On new map click (coordinates changed), clear all highlights, checked features, and layer features
    if (coordinatesChanged) {
      removeHighlightedFeature('all');
      removeCheckedFeature('all');
      // Clear features from all layers to remove out-of-range layers from display
      arrayOfLayerDataBatch.forEach((layer) => {
        // eslint-disable-next-line no-param-reassign
        layer.features = [];
      });
      // Update the ref to current coordinates
      prevMapClickCoordinates.current = mapClickCoordinates;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapClickCoordinates, memoLayersList, setSelectedLayerPath, coordinateInfoEnabled]);

  /**
   * Clear highlights and checked features when the details panel is closed
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - panel closed check', selectedTab, isCollapsed, activeAppBarTab, containerType);

    let shouldClear = false;

    if (containerType === CONTAINER_TYPE.FOOTER_BAR) {
      // For footer bar: clear when not on details tab or footer is collapsed
      shouldClear = selectedTab !== TABS.DETAILS || isCollapsed;
    } else if (containerType === CONTAINER_TYPE.APP_BAR) {
      // For app bar: clear when details panel is closed (tabId === 'details' and isOpen === false)
      shouldClear = activeAppBarTab.tabId === 'details' && !activeAppBarTab.isOpen;
    }

    if (shouldClear) {
      logger.logTraceUseEffect('DETAILS-PANEL - panel closed check !!!!e');

      // Clear all highlights
      removeHighlightedFeature('all');
      // Clear all checked features
      removeCheckedFeature('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, isCollapsed, activeAppBarTab, containerType]);

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
      return <CoordinateInfo />;
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
        <Box sx={sxClasses.rightPanelContainer}>
          <Grid container sx={sxClasses.rightPanelBtnHolder}>
            <Grid size={{ xs: 6 }} sx={{ alignSelf: 'center' }}>
              <Box>
                {t('details.featureDetailsTitle')
                  .replace('{count}', `${currentFeatureIndex + 1}`)
                  .replace('{total}', `${memoSelectedLayerDataFeatures?.length}`)}
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ textAlign: 'right' }}>
                <IconButton
                  aria-label={t('details.previousFeatureBtn')}
                  tooltipPlacement="top"
                  onClick={() => handleFeatureNavigateChange(-1)}
                  disabled={currentFeatureIndex <= 0}
                  className="buttonOutline"
                >
                  <ArrowBackIosOutlinedIcon />
                </IconButton>
                <IconButton
                  sx={{ marginLeft: '16px' }}
                  aria-label={t('details.nextFeatureBtn')}
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
          <FeatureInfo key={`${currentFeature?.uid}-${currentFeature?.geometry ? 'with-geo' : 'no-geo'}`} feature={currentFeature} />
        </Box>
      );
    }

    // if no condition met, return null for Guide tab
    return null;
  };

  return (
    <Layout
      ref={layoutRef}
      containerType={containerType}
      layoutSwitch={
        <Box sx={sxClasses.layoutSwitch}>
          {!hideCoordinateInfoSwitch && <CoordinateInfoSwitch />}
          <IconButton
            aria-label={t('details.clearAllfeatures')}
            tooltipPlacement="top"
            onClick={() => handleClearAllHighlights()}
            className="buttonOutline"
            disabled={checkedFeatures.length === 0}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', height: 24 }}>
              <ClearHighlightIcon sx={{ fontSize: 24 }} />
            </Box>
          </IconButton>
        </Box>
      }
      selectedLayerPath={selectedLayerPath}
      layerList={memoLayersList}
      onLayerListClicked={(layerEntry) => handleLayerChange(layerEntry)}
      onRightPanelClosed={handleRightPanelClosed}
      onRightPanelVisibilityChanged={handleRightPanelVisibilityChanged}
      guideContentIds={['details']}
      hideEnlargeBtn={containerType === CONTAINER_TYPE.APP_BAR}
      toggleMode={containerType === CONTAINER_TYPE.APP_BAR}
    >
      {renderContent()}
    </Layout>
  );
}
