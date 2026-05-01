import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { IconButton, Grid, ArrowForwardIosOutlinedIcon, ArrowBackIosOutlinedIcon, ClearHighlightIcon, Box } from '@/ui';

import type { TypeContainerBox } from '@/core/types/global-types';
import {
  useStoreDetailsCheckedFeatures,
  useStoreDetailsCoordinateInfoEnabled,
  useStoreDetailsHideCoordinateInfoSwitch,
  useStoreDetailsLayerDataArray,
  useStoreDetailsLayerDataArrayBatch,
  useStoreDetailsSelectedLayerPath,
  LAYER_PATH_COORDINATE_INFO,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { useStoreUIActiveAppBarTab, useStoreUIActiveFooterBarTab } from '@/core/stores/store-interface-and-intial-values/ui-state';
import {
  useStoreLayerNameSet,
  useStoreLayerStatusSet,
  useStoreLayerQueryableByPaths,
  useStoreLayerIsHiddenOnMapSet,
  useStoreLayerIsParentHiddenOnMapSet,
  useStoreLayerAllVisibleAndInRangeLayers,
  useStoreLayerOrderedLayerPaths,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useStoreMapClickCoordinates } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { TypeFeatureInfoEntry, TypeLayerData, TypeMapMouseInfo, TypeQueryStatus } from '@/api/types/map-schema-types';

import type { LayerListEntry, LayoutExposedMethods } from '@/core/components/common';
import { Layout } from '@/core/components/common';
import { checkSelectedLayerPathList } from '@/core/components/common/comp-common';
import { getSxClasses } from './details-style';
import { FeatureInfo } from './feature-info';
import { CONTAINER_TYPE, FEATURE_INFO_STATUS, TABS, TIMEOUT } from '@/core/utils/constant';
import { DetailsSkeleton } from './details-skeleton';
import { CoordinateInfo, CoordinateInfoSwitch } from './coordinate-info';
import { logger } from '@/core/utils/logger';
import { useMapController, useUIController, useDetailsController } from '@/core/controllers/use-controllers';

/** Properties for the details panel component. */
interface DetailsPanelType {
  /** The container type (appBar or footerBar). */
  containerType: TypeContainerBox;
}

/**
 * Structural entry used for batch-sensitive selection logic in the details panel.
 *
 * Contains only the data derived from the batched layer array — feature counts, query status, and identity.
 * Display fields (layerName, layerStatus, layerFeatures, tooltip) are intentionally excluded so that live
 * store updates to those fields do not re-trigger the batch-gated selection effects.
 */
type LayerListStructureEntry = {
  /** Unique path identifying the layer. */
  layerPath: string;
  /** Number of features in the layer. */
  numOffeatures: number;
  /** Current query status of the layer, derived from batched layer data. */
  queryStatus: TypeQueryStatus;
  /** Unique DOM id for the layer list item. */
  layerUniqueId: string;
};

/**
 * Creates the details panel component.
 *
 * @param props - Properties defined in DetailsPanelType interface
 * @returns The details panel component
 */
export function DetailsPanel({ containerType }: DetailsPanelType): JSX.Element {
  logger.logTraceRender('components/details/details-panel');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('DETAILS-PANEL - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // Store
  const mapId = useStoreGeoViewMapId();
  const selectedLayerPath = useStoreDetailsSelectedLayerPath();
  const arrayOfLayerData = useStoreDetailsLayerDataArray();
  const arrayOfLayerDataBatch = useStoreDetailsLayerDataArrayBatch();
  const checkedFeatures = useStoreDetailsCheckedFeatures();
  const coordinateInfoEnabled = useStoreDetailsCoordinateInfoEnabled();
  const hideCoordinateInfoSwitch = useStoreDetailsHideCoordinateInfoSwitch();
  const visibleInRangeLayers = useStoreLayerAllVisibleAndInRangeLayers();
  const orderedLayers = useStoreLayerOrderedLayerPaths();
  const mapClickCoordinates = useStoreMapClickCoordinates();
  const { tabId: appBarTabId, isOpen: appBarIsOpen } = useStoreUIActiveAppBarTab();
  const { tabId: footerBarTabId, isOpen: footerBarIsOpen } = useStoreUIActiveFooterBarTab();
  const queryableByLayerPath = useStoreLayerQueryableByPaths(visibleInRangeLayers);
  const layerNames = useStoreLayerNameSet();
  const layerStatuses = useStoreLayerStatusSet();
  const layerHiddenSet = useStoreLayerIsHiddenOnMapSet();
  const layerParentHiddenSet = useStoreLayerIsParentHiddenOnMapSet();
  const uiController = useUIController();
  const mapController = useMapController();
  const detailsController = useDetailsController();

  // States
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState<number>(0);
  const [selectedLayerPathLocal, setSelectedLayerPathLocal] = useState<string>(selectedLayerPath);
  const [arrayOfLayerListLocal, setArrayOfLayerListLocal] = useState<LayerListStructureEntry[]>([]);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState<boolean>(false);
  const prevLayerFeatures = useRef<TypeFeatureInfoEntry[] | undefined | null>();
  const prevFeatureIndex = useRef<number>(0); // 0 because that's the default index for the features
  const prevMapClickCoordinates = useRef<TypeMapMouseInfo | undefined>(mapClickCoordinates);
  const layoutRef = useRef<LayoutExposedMethods>(null);
  const prevButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  // #region MAIN HOOKS SECTION

  /**
   * Memoizes the set of checked feature IDs for O(1) lookup.
   */
  const memoIsCheckedFeaturesSet = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DETAILS-PANEL - memoIsCheckedFeaturesSet', checkedFeatures);

    return new Set(checkedFeatures.map((feature) => feature?.uid));
  }, [checkedFeatures]);

  /**
   * Checks if a feature is in the store checkedFeatures array.
   *
   * Modified memoIsCheckedFeaturesSet using the Set for O(1) lookup
   *
   * @param feature - The feature to check
   * @returns Whether the feature is in checkedFeatures
   */
  const isFeatureInCheckedFeatures = useCallback(
    (feature: TypeFeatureInfoEntry): boolean => {
      return memoIsCheckedFeaturesSet.has(feature?.uid);
    },
    [memoIsCheckedFeaturesSet]
  );

  /**
   * Clears the highlighted features when they are not checked.
   *
   * @param arrayToClear - The array to clear of unchecked features
   */
  const clearHighlightsUnchecked = useCallback(
    (arrayToClear: TypeFeatureInfoEntry[] | undefined | null) => {
      arrayToClear?.forEach((feature) => {
        if (!memoIsCheckedFeaturesSet.has(feature.uid)) {
          mapController.removeHighlightedFeature(feature);
        }
      });
    },
    [memoIsCheckedFeaturesSet, mapController]
  );

  /**
   * Gets the formatted label for a feature count.
   *
   * @param numOfFeatures - The number of features to format
   * @returns The features count label string
   */
  const getNumFeaturesLabel = useCallback(
    (numOfFeatures: number): string => {
      return numOfFeatures === 0
        ? `${t('general.none')} ${t('details.feature')} ${t('details.selected')}`
        : `${numOfFeatures} ${t('details.feature')}${numOfFeatures > 1 ? 's' : ''}`;
    },
    [t]
  );

  /**
   * Checks if a feature has valid geometry.
   *
   * @param feature - The feature to check
   * @returns Whether the feature has valid geometry
   */
  const hasValidGeometry = useCallback((feature: TypeFeatureInfoEntry | undefined): boolean => {
    return !!(feature?.geometry && feature?.extent && !feature.extent.includes(Infinity));
  }, []);

  /**
   * Memoizes whether the panel is currently open.
   */
  const memoIsPanelOpen = useMemo(() => {
    // Log
    logger.logTraceUseMemo(
      'DETAILS-PANEL - memoIsPanelOpen',
      containerType,
      footerBarTabId,
      footerBarIsOpen,
      appBarTabId,
      appBarIsOpen,
      isRightPanelVisible
    );

    if (containerType === CONTAINER_TYPE.FOOTER_BAR) {
      return footerBarTabId === TABS.DETAILS && footerBarIsOpen && isRightPanelVisible;
    }
    if (containerType === CONTAINER_TYPE.APP_BAR) {
      return appBarTabId === TABS.DETAILS && appBarIsOpen && isRightPanelVisible;
    }
    return false;
  }, [containerType, footerBarTabId, footerBarIsOpen, appBarTabId, appBarIsOpen, isRightPanelVisible]);

  /**
   * Memoizes the full display layer list for the LayerList component.
   *
   * Fully live — uses the non-batched layer data array and all live store hooks for filtering, ordering,
   * merging, and display. Rerenders immediately when any live data changes (features, status, names,
   * visibility, ordering). The batch-gated selection effects depend on memoLayersListBatched instead.
   */
  const memoLayersList = useMemo((): LayerListEntry[] => {
    // Log
    logger.logTraceUseMemo('DETAILS-PANEL - memoLayersList', visibleInRangeLayers, arrayOfLayerData);

    // Set the layers list (filter: visible - visible in range and isQueryable)
    const layerListEntries = visibleInRangeLayers
      .map((layerPath) => arrayOfLayerData.find((layerData) => layerData.layerPath === layerPath))
      .filter((layer) => layer && !layerHiddenSet[layer.layerPath])
      .filter((layer) => layer && queryableByLayerPath[layer.layerPath])
      .map((layer) => ({
        layerPath: layer!.layerPath,
        layerName: layerNames[layer!.layerPath] ?? '',
        layerStatus: layerStatuses[layer!.layerPath],
        queryStatus: layer!.queryStatus,
        numOffeatures: layer!.features?.length ?? 0,
        layerFeatures: getNumFeaturesLabel(layer!.features?.length ?? 0),
        tooltip: t('layers.selectLayer', { layerName: layerNames[layer!.layerPath] }) ?? '',
        layerUniqueId: `${mapId}-${TABS.DETAILS}-${layer!.layerPath ?? ''}`,
      }));

    // Merge in-range and out-of-range layers while preserving order from arrayOfLayerData
    const existingLayerPaths = new Set(layerListEntries.map((entry) => entry.layerPath));

    // Add layers with features that aren't already in the list (out-of-range layers with features)
    arrayOfLayerData.forEach((layer) => {
      if (
        (layer.features?.length ?? 0) > 0 &&
        !existingLayerPaths.has(layer.layerPath) &&
        layer.layerPath !== LAYER_PATH_COORDINATE_INFO &&
        !layerParentHiddenSet[layer.layerPath]
      ) {
        layerListEntries.push({
          layerPath: layer.layerPath,
          layerName: layerNames[layer.layerPath] ?? '',
          layerStatus: layerStatuses[layer.layerPath],
          queryStatus: layer.queryStatus,
          numOffeatures: layer.features?.length ?? 0,
          layerFeatures: getNumFeaturesLabel(layer.features?.length ?? 0),
          tooltip: t('layers.selectLayer', { layerName: layerNames[layer.layerPath] }) ?? '',
          layerUniqueId: `${mapId}-${TABS.DETAILS}-${layer.layerPath}`,
        });
      }
    });

    // Split the layers list into two groups while preserving order (exclude coordinate-info from sorting)
    const layersWithFeatures = layerListEntries.filter(
      (layer) => layer.numOffeatures && layer.numOffeatures > 0 && layer.layerPath !== LAYER_PATH_COORDINATE_INFO
    );
    const layersWithoutFeatures = layerListEntries.filter(
      (layer) => layer.numOffeatures === 0 && layer.layerPath !== LAYER_PATH_COORDINATE_INFO
    );

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
    const coordinateInfoLayer = arrayOfLayerData.find((layer) => layer.layerPath === LAYER_PATH_COORDINATE_INFO);
    if (coordinateInfoLayer && coordinateInfoEnabled) {
      orderedLayerListEntries.unshift({
        layerPath: coordinateInfoLayer.layerPath,
        layerName: t('details.coordinateInfoTitle'),
        layerStatus: layerStatuses[coordinateInfoLayer.layerPath],
        queryStatus: coordinateInfoLayer.queryStatus,
        numOffeatures: coordinateInfoLayer.features?.length ?? 0,
        layerFeatures: getNumFeaturesLabel(coordinateInfoLayer.features?.length ?? 0),
        tooltip: t('layers.selectLayer', { layerName: t('details.coordinateInfoTitle') }) ?? '',
        layerUniqueId: `${mapId}-${TABS.DETAILS}-${coordinateInfoLayer.layerPath}`,
      });
    }

    return orderedLayerListEntries;
  }, [
    visibleInRangeLayers,
    arrayOfLayerData,
    coordinateInfoEnabled,
    queryableByLayerPath,
    layerNames,
    layerStatuses,
    layerHiddenSet,
    layerParentHiddenSet,
    getNumFeaturesLabel,
    mapId,
    orderedLayers,
    t,
  ]);

  /**
   * Memoizes a minimal structural snapshot derived exclusively from the batched layer data array.
   *
   * Contains only layerPath, numOffeatures, and queryStatus — the minimum needed to detect when a
   * batched update has changed feature counts or added/removed layers. This drives the batch-gated
   * selection effects and the feature-index reset logic without re-triggering on live display changes.
   */
  const memoLayersListBatched = useMemo((): LayerListStructureEntry[] => {
    // Log
    logger.logTraceUseMemo('DETAILS-PANEL - memoLayersListBatched', arrayOfLayerDataBatch);

    return arrayOfLayerDataBatch.map((layer) => ({
      layerPath: layer.layerPath,
      numOffeatures: layer.features?.length ?? 0,
      queryStatus: layer.queryStatus,
      layerUniqueId: `${mapId}-${TABS.DETAILS}-${layer.layerPath}`,
    }));
  }, [arrayOfLayerDataBatch, mapId]);

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
   * Memoizes the current feature.
   */
  const memoCurrentFeature = useMemo(() => {
    // The current feature
    logger.logTraceUseMemo('DETAILS-PANEL - memoCurrentFeature', currentFeatureIndex);

    return memoSelectedLayerDataFeatures?.[currentFeatureIndex];
  }, [memoSelectedLayerDataFeatures, currentFeatureIndex]);

  /**
   * Memoizes the current feature has geometry.
   */
  const memoCurrentFeatureHasGeometry = useMemo(() => {
    // The current feature has its geometry loaded
    logger.logTraceUseMemo('DETAILS-PANEL - memoCurrentFeatureHasGeometry', !!memoCurrentFeature?.geometry);

    return !!memoCurrentFeature?.geometry;
  }, [memoCurrentFeature?.geometry]);

  /**
   * Updates the selected features for the highlight on the map.
   *
   * Removes the previously highlighted feature and adds a new one.
   *
   * @param newIndex - The new index to select the feature
   * @param prevLayer - Optional layer on which to unselect features
   */
  const updateFeatureSelected = useCallback(
    (newIndex: number, prevLayer?: TypeLayerData) => {
      // Get the current feature in highlight
      let currentFeature;
      if (prevLayer?.features) {
        currentFeature = prevLayer?.features?.[prevFeatureIndex.current];
      }

      // If found, remove it
      if (currentFeature && !isFeatureInCheckedFeatures(currentFeature)) {
        // Remove
        mapController.removeHighlightedFeature(currentFeature);
      }

      // Get the next feature navigating to
      const nextFeature = memoSelectedLayerData?.features?.[newIndex];

      // If found, add it
      if (nextFeature) mapController.addHighlightedFeature(nextFeature);

      // Update the current feature index
      setCurrentFeatureIndex(newIndex);
    },
    [memoSelectedLayerData?.features, isFeatureInCheckedFeatures, mapController]
  );

  /**
   * Effect used when the structural layers list changes.
   * Note: This useEffect is triggered many times as the layerDataArray gets processed.
   * History: Logic was initially in click-marker. Brought here.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - memoLayersListBatched changed', memoLayersListBatched);

    // Unselect the layer path if no more layers in the list
    if (!memoLayersListBatched.length) detailsController.setSelectedLayerPath('');
  }, [memoLayersListBatched, detailsController]);

  /**
   * Effect used when the layers list changes.
   * Note: This useEffect is triggered many times as the layerDataArray gets processed.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - memoSelectedLayerDataFeatures changed', memoSelectedLayerDataFeatures);

    // Clear the unchecked highlights
    clearHighlightsUnchecked(prevLayerFeatures.current);

    // Re-highlight all checked features to ensure they persist through zoom
    checkedFeatures.forEach((checkedFeature) => {
      if (hasValidGeometry(checkedFeature)) {
        mapController.addHighlightedFeature(checkedFeature);
      }
    });
    // TODO: REFACTOR - The details-panel should be refactored to simplify the logic of the highlighted features, it's a bit confusing right now, too many useEffects
    // TO.DOCONT: For example here, it's weird to have the 'memoSelectedLayerDataFeatures' in the dependency array here to make it work...
  }, [memoSelectedLayerDataFeatures, clearHighlightsUnchecked, checkedFeatures, hasValidGeometry, mapController]);

  /**
   * Use Effect for when the current feature has a geometry loaded
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - memoCurrentFeature changed', memoCurrentFeature);

    // If current feature
    if (memoCurrentFeature) {
      // If the geometry has been loaded
      if (memoCurrentFeatureHasGeometry) {
        if (memoIsPanelOpen) mapController.addHighlightedFeature(memoCurrentFeature);
      } else {
        mapController.removeHighlightedFeature(memoCurrentFeature);
      }
    }
  }, [memoCurrentFeature, memoCurrentFeatureHasGeometry, memoIsPanelOpen, mapController]);

  /**
   * Effect used to persist the layer path bypass for the layerDataArray.
   * A useEffect is necessary in order to keep this component pure and be able to set the layer path bypass elsewhere than in this component.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - update layer data bypass', selectedLayerPath);

    // Set the layer data array batch bypass to the currently selected layer
    detailsController.setLayerDataArrayBatchLayerPathBypass(selectedLayerPath);
  }, [detailsController, selectedLayerPath]);

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
      checkSelectedLayerPathList(
        (lyrPath) => detailsController.setLayerDataArrayBatchLayerPathBypass(lyrPath),
        (lyrPath) => detailsController.setSelectedLayerPath(lyrPath),
        memoLayerSelectedItem,
        memoLayersList
      );
    }

    // NOTE: memoLayerSelectedItem and memoLayersList intentionally omitted — they are always derived from
    // memoLayersListBatched. Using memoLayersListBatched as the trigger ensures this effect only fires on
    // structural (batched) changes, not on display-only updates like layerStatus or layerName.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailsController, memoLayersListBatched, selectedLayerPath]);

  // #endregion

  // #region EVENT HANDLERS SECTION

  /**
   * Handles click to remove all features in right panel.
   */
  const handleClearAllHighlights = useCallback((): void => {
    if (checkedFeatures.length === 0) return;
    // clear all highlights from features on the map in all layers
    mapController.removeHighlightedFeature('all');
    // clear checked features array
    detailsController.removeCheckedFeature('all');
    // add the highlight to the current feature
    mapController.addHighlightedFeature(memoSelectedLayerData?.features?.[currentFeatureIndex] as TypeFeatureInfoEntry);
  }, [checkedFeatures, currentFeatureIndex, detailsController, mapController, memoSelectedLayerData?.features]);

  /**
   * Handles when the right panel is closed in responsive layout.
   * Removes the currently selected feature highlight (but keeps checked features).
   */
  const handleRightPanelClosed = useCallback((): void => {
    // Only remove the current selected feature highlight if it's not checked
    const currentFeature = memoSelectedLayerData?.features?.[currentFeatureIndex];
    if (currentFeature && !isFeatureInCheckedFeatures(currentFeature)) {
      mapController.removeHighlightedFeature(currentFeature);
    }

    // Return focus to the layer list item that opened this panel
    if (selectedLayerPath) {
      // Construct the layer list item ID
      const layerListItemId = `${mapId}-${TABS.DETAILS}-${selectedLayerPath}`;
      uiController.disableFocusTrap(layerListItemId);
    } else {
      // No layer selected, don't move focus
      uiController.disableFocusTrap('no-focus');
    }
  }, [memoSelectedLayerData, currentFeatureIndex, isFeatureInCheckedFeatures, selectedLayerPath, mapId, mapController, uiController]);

  /**
   * Handles when the right panel visibility changes.
   */
  const handleRightPanelVisibilityChanged = useCallback((isVisible: boolean): void => {
    setIsRightPanelVisible(isVisible);
  }, []);

  /**
   * Handles clicks to forward and back arrows in right panel.
   * Removes previous feature from selectedFeatures store if it is not checked, and adds new feature.
   *
   * @param change - The change to index number (-1 for back, 1 for forward)
   */
  const handleFeatureNavigateChange = useCallback(
    (change: -1 | 1): void => {
      const newIndex = currentFeatureIndex + change;
      const maxIndex = (memoSelectedLayerData?.features?.length ?? 0) - 1;

      // Don't navigate if out of bounds
      if (newIndex < 0 || newIndex > maxIndex) {
        return;
      }

      // Keep previous index for navigation
      prevFeatureIndex.current = currentFeatureIndex;

      // Update current index
      updateFeatureSelected(newIndex, memoSelectedLayerData);

      // Restore focus to the navigation button after React completes the state update and re-render
      requestAnimationFrame(() => {
        if (change === -1) {
          prevButtonRef.current?.focus();
        } else {
          nextButtonRef.current?.focus();
        }
      });
    },
    [currentFeatureIndex, memoSelectedLayerData, updateFeatureSelected]
  );

  /**
   * Handles a click on the previous feature navigation button.
   */
  const handlePrevFeature = useCallback((): void => {
    handleFeatureNavigateChange(-1);
  }, [handleFeatureNavigateChange]);

  /**
   * Handles a click on the next feature navigation button.
   */
  const handleNextFeature = useCallback((): void => {
    handleFeatureNavigateChange(1);
  }, [handleFeatureNavigateChange]);

  /**
   * Handles click to change the selected layer in left panel.
   *
   * @param layerEntry - The data of the newly selected layer
   */
  const handleLayerChange = useCallback(
    (layerEntry: LayerListEntry): void => {
      // Set the selected layer path in the store which will in turn trigger the store listeners on this component
      detailsController.setSelectedLayerPath(layerEntry.layerPath);

      // Re-highlight the current feature when panel becomes visible (layer selection makes panel visible)
      // Use setTimeout to ensure the layer data is updated first
      setTimeout(() => {
        const layerData = arrayOfLayerDataBatch.find((layer) => layer.layerPath === layerEntry.layerPath);
        const featureToHighlight = layerData?.features?.[0]; // Will be index 0 after layer change
        if (featureToHighlight && hasValidGeometry(featureToHighlight)) {
          mapController.addHighlightedFeature(featureToHighlight);
        }
      }, TIMEOUT.deferExecution);
    },
    [detailsController, mapController, arrayOfLayerDataBatch, hasValidGeometry]
  );
  // #endregion

  // #region PROCESSING

  /**
   * Resets the currently selected feature index to 0 and keeps in reference the previously selected layer and
   * the previously selected feature index so that in the useEffect, later, the component can udpate
   * the selected features with the store.
   */
  const resetCurrentIndex = (): void => {
    // Keep reference on previously selected features
    prevLayerFeatures.current = arrayOfLayerDataBatch.find((layer) => layer.layerPath === selectedLayerPathLocal)?.features;
    // Keep reference on previously selected index
    prevFeatureIndex.current = currentFeatureIndex;
    // Reset the indexing
    setCurrentFeatureIndex(0);
  };

  // If the structural layer data has changed since last render (driven by batch updates only, not display changes)
  if (arrayOfLayerListLocal !== memoLayersListBatched) {
    // Selected array layer data changed
    setArrayOfLayerListLocal(memoLayersListBatched);

    // Only reset the feature index if the number of features in the currently selected layer changed
    const currentSelectedLayer = memoLayersListBatched.find((layer) => layer.layerPath === selectedLayerPath);
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

  /**
   * Selects a layer after a map click.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL- mapClickCoordinates', mapClickCoordinates);

    // Check if coordinates actually changed (new map click)
    const coordinatesChanged =
      mapClickCoordinates && JSON.stringify(mapClickCoordinates) !== JSON.stringify(prevMapClickCoordinates.current);

    // Show the details for a feature on map click
    if (mapClickCoordinates && memoLayersList?.length) {
      // if we don't have a selected layer path with features select the first layer path with features
      if (!selectedLayerPath.length) {
        const selectedLayer = memoLayersListBatched.find((layer) => !!layer.numOffeatures);
        detailsController.setSelectedLayerPath(selectedLayer?.layerPath ?? '');
        // Ensure the info panel is visible
        layoutRef.current?.showRightPanel(true);
      }

      // Make sure the right panel is visible as long as the coordinates have changed from a user click
      if (!isRightPanelVisible && coordinatesChanged) {
        layoutRef.current?.showRightPanel(true);
      }
    }

    // On new map click (coordinates changed), clear all highlights, checked features, and layer features
    if (coordinatesChanged) {
      // Clear all highlights
      mapController.removeHighlightedFeature('all');

      // Clear all checked features
      detailsController.removeCheckedFeature('all');

      // Clear features from all layers to remove out-of-range layers from display
      arrayOfLayerDataBatch.forEach((layer) => {
        // eslint-disable-next-line no-param-reassign
        layer.features = [];
      });
      // Update the ref to current coordinates
      prevMapClickCoordinates.current = mapClickCoordinates;
    }

    // NOTE: memoLayersList intentionally omitted — they are always derived from
    // memoLayersListBatched. Using memoLayersListBatched as the trigger ensures this effect only fires on
    // structural (batched) changes, not on display-only updates like layerStatus or layerName.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailsController, mapController, mapClickCoordinates, memoLayersListBatched, coordinateInfoEnabled]);

  /**
   * Clear highlights and checked features when the details panel is closed
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - panel closed check', containerType);

    let shouldClear = false;

    if (containerType === CONTAINER_TYPE.FOOTER_BAR) {
      // For footer bar: clear when not on details tab or footer is collapsed
      shouldClear = footerBarTabId !== TABS.DETAILS || !footerBarIsOpen;
    } else if (containerType === CONTAINER_TYPE.APP_BAR) {
      // For app bar: clear when details panel is closed (tabId === 'details' and isOpen === false)
      shouldClear = appBarTabId === TABS.DETAILS && !appBarIsOpen;
    }

    if (shouldClear) {
      logger.logTraceUseEffect('DETAILS-PANEL - panel closed check !!!!');

      // Clear all highlights
      mapController.removeHighlightedFeature('all');

      // Clear all checked features
      detailsController.removeCheckedFeature('all');
    }
  }, [detailsController, mapController, footerBarTabId, footerBarIsOpen, appBarTabId, appBarIsOpen, containerType]);

  /**
   * Memoizes whether all layers query status is processed.
   */
  const memoIsAllLayersQueryStatusProcessed = useMemo((): boolean => {
    // Log
    logger.logTraceUseMemo('DETAILS-PANEL - AllLayersQueryStatusProcessed.');

    if (!arrayOfLayerDataBatch || arrayOfLayerDataBatch.length === 0) return false;

    return arrayOfLayerDataBatch.every((layer) => layer.queryStatus === FEATURE_INFO_STATUS.PROCESSED);
  }, [arrayOfLayerDataBatch]);

  /**
   * Automatically show the guide when panel opens and all layers have no features
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - check for auto-guide display', arrayOfLayerDataBatch);

    // Check if details panel just opened (from AppBar or Footer)
    const isDetailsActive =
      (containerType === CONTAINER_TYPE.FOOTER_BAR && footerBarTabId === TABS.DETAILS && footerBarIsOpen) ||
      (containerType === CONTAINER_TYPE.APP_BAR && appBarTabId === TABS.DETAILS && appBarIsOpen);

    // Only run when details is active
    if (isDetailsActive && arrayOfLayerDataBatch && arrayOfLayerDataBatch.length > 0) {
      // Check if all layers have no features (excluding coordinate-info)
      const allLayersHaveNoFeatures = arrayOfLayerDataBatch.every(
        (layer) => layer.layerPath === LAYER_PATH_COORDINATE_INFO || !layer.features || layer.features.length === 0
      );

      // Check if we should clear the selected layer
      const shouldClearSelectedLayer = allLayersHaveNoFeatures && !coordinateInfoEnabled;

      // If should clear the selected layer and queries are processed
      if (shouldClearSelectedLayer && memoIsAllLayersQueryStatusProcessed) {
        // Log
        logger.logDebug('DETAILS-PANEL - All layers have no features and coordinate info is disabled, showing right panel with guide');

        // Clear selection to show the guide
        detailsController.setSelectedLayerPath('');

        // Make sure the right panel is visible
        if (!isRightPanelVisible) {
          layoutRef.current?.showRightPanel(true);
        }
      }
    }
  }, [
    detailsController,
    appBarTabId,
    appBarIsOpen,
    footerBarTabId,
    footerBarIsOpen,
    coordinateInfoEnabled,
    containerType,
    arrayOfLayerDataBatch,
    memoIsAllLayersQueryStatusProcessed,
    isRightPanelVisible,
  ]);

  // #endregion

  /**
   * Renders the right panel content based on detail's layer and loading status.
   *
   * NOTE: Here we return null, so that in responsive grid layout, it can be used as flag to render the guide for details.
   *
   * @returns The right panel content, or null to show the guide
   */
  const renderContent = (): JSX.Element | null => {
    if (selectedLayerPath === LAYER_PATH_COORDINATE_INFO) {
      return <CoordinateInfo />;
    }

    // If there is no layer, return null for the guide to show
    if ((memoLayersList && memoLayersList.length === 0) || selectedLayerPath === '') {
      return null;
    }

    // Until process or something found for selected layerPath, return skeleton
    if (!memoIsAllLayersQueryStatusProcessed && !(memoSelectedLayerDataFeatures && memoSelectedLayerDataFeatures.length > 0)) {
      return <DetailsSkeleton />;
    }

    if (memoCurrentFeature) {
      // Get only the current feature
      const isPrevDisabled = currentFeatureIndex <= 0;
      const isNextDisabled = !memoSelectedLayerData?.features || currentFeatureIndex + 1 >= memoSelectedLayerData.features.length;

      return (
        <Box sx={memoSxClasses.rightPanelContainer} className="guide-content-container">
          <Grid container sx={memoSxClasses.rightPanelBtnHolder}>
            <Grid size={{ xs: 6 }} sx={{ alignSelf: 'center' }}>
              <Box role="status" aria-live="polite" aria-atomic="true">
                {t('details.featureDetailsTitle')
                  .replace('{count}', `${currentFeatureIndex + 1}`)
                  .replace('{total}', `${memoSelectedLayerDataFeatures?.length}`)}
              </Box>
            </Grid>
            {memoSelectedLayerData?.features && memoSelectedLayerData.features.length > 1 && (
              <Grid size={{ xs: 6 }} className="buttonGroup">
                {/* Navigation buttons use aria-disabled with manual styling to preserve keyboard focus when users reach first/last items */}
                <Box sx={{ textAlign: 'right' }}>
                  <IconButton
                    iconRef={prevButtonRef}
                    aria-label={t('details.previousFeatureBtn')}
                    tooltipPlacement="top"
                    onClick={handlePrevFeature}
                    aria-disabled={isPrevDisabled}
                    className="buttonOutline"
                  >
                    <ArrowBackIosOutlinedIcon />
                  </IconButton>
                  <IconButton
                    iconRef={nextButtonRef}
                    sx={{
                      marginLeft: '16px',
                    }}
                    aria-label={t('details.nextFeatureBtn')}
                    tooltipPlacement="top"
                    onClick={handleNextFeature}
                    aria-disabled={isNextDisabled}
                    className="buttonOutline"
                  >
                    <ArrowForwardIosOutlinedIcon />
                  </IconButton>
                </Box>
              </Grid>
            )}
          </Grid>

          <FeatureInfo
            key={`${memoCurrentFeature.uid}-${memoCurrentFeatureHasGeometry ? 'with-geo' : 'no-geo'}`}
            feature={memoCurrentFeature}
            containerType={containerType}
          />
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
      titleFullscreen={t('details.title')}
      layoutSwitch={
        <Box sx={memoSxClasses.layoutSwitch}>
          {!hideCoordinateInfoSwitch && <CoordinateInfoSwitch disabled={!mapClickCoordinates} />}
          <IconButton
            aria-label={t('details.clearAllfeatures')}
            tooltipPlacement="top"
            onClick={handleClearAllHighlights}
            className="buttonOutline"
            aria-disabled={checkedFeatures.length === 0}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', height: 24 }}>
              <ClearHighlightIcon sx={{ fontSize: 24 }} />
            </Box>
          </IconButton>
        </Box>
      }
      selectedLayerPath={selectedLayerPath}
      layerList={memoLayersList}
      onLayerListClicked={handleLayerChange}
      onRightPanelClosed={handleRightPanelClosed}
      onRightPanelVisibilityChanged={handleRightPanelVisibilityChanged}
      guideContentIds={[TABS.DETAILS]}
      hideEnlargeBtn={containerType === CONTAINER_TYPE.APP_BAR}
      toggleMode={containerType === CONTAINER_TYPE.APP_BAR}
    >
      {renderContent()}
    </Layout>
  );
}
