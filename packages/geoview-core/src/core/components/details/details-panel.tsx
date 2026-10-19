import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { IconButton } from '@/ui/icon-button/icon-button';
import { ArrowForwardIosOutlinedIcon, ArrowBackIosOutlinedIcon, ClearHighlightIcon } from '@/ui/icons';
import { Box } from '@/ui/layout';

import type { TypeContainerBox } from '@/core/types/global-types';
import {
  useStoreDetailsCheckedFeatures,
  useStoreDetailsCoordinateInfoEnabled,
  useStoreDetailsHideCoordinateInfoSwitch,
  useStoreDetailsLayerDataArray,
  useStoreDetailsLayerDataArrayBatch,
  useStoreDetailsSelectedLayerPath,
  useStoreDetailsCurrentFeatureIndex,
  LAYER_PATH_COORDINATE_INFO,
} from '@/core/stores/states/feature-info-state';
import { useStoreUIActiveAppBarTab, useStoreUIActiveFooterBarTab } from '@/core/stores/states/ui-state';
import {
  useStoreLayerNameSet,
  useStoreLayerStatusSet,
  useStoreLayerQueryableByPaths,
  useStoreLayerInVisibleRangeSet,
  useStoreLayerIsHiddenOnMapSet,
  useStoreLayerIsParentHiddenOnMapSet,
  useStoreLayerAllVisibleAndInRangeLayers,
  useStoreLayerOrderedLayerPaths,
} from '@/core/stores/states/layer-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useStoreMapClickCoordinates } from '@/core/stores/states/map-state';
import type { TypeFeatureInfoEntry, TypeMapMouseInfo, TypeQueryStatus } from '@/api/types/map-schema-types';

import type { LayerListEntry } from '@/core/components/common/layer-list';
import type { LayoutExposedMethods } from '@/core/components/common/layout';
import { Layout } from '@/core/components/common/layout';
import { checkSelectedLayerPathList } from '@/core/components/common/comp-common';
import { getSxClasses } from './details-style';
import { FeatureInfo } from './feature-info';
import { CONTAINER_TYPE, FEATURE_INFO_STATUS, TABS } from '@/core/utils/constant';
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
  const inVisibleRangeSet = useStoreLayerInVisibleRangeSet();
  const uiController = useUIController();
  const mapController = useMapController();
  const detailsController = useDetailsController();

  // States
  const currentFeatureIndex = useStoreDetailsCurrentFeatureIndex();
  const [isRightPanelVisible, setIsRightPanelVisible] = useState<boolean>(false);
  const prevMapClickCoordinates = useRef<TypeMapMouseInfo | undefined>(mapClickCoordinates);
  const previousHighlightedFeaturesRef = useRef<TypeFeatureInfoEntry[]>([]);
  const previousLayerFeaturesRef = useRef<TypeFeatureInfoEntry[] | undefined>(undefined);
  const layoutRef = useRef<LayoutExposedMethods>(null);
  // Tracks that the user explicitly closed the panel so the no-features guide isn't force-reopened underneath them
  const userDismissedGuideRef = useRef<boolean>(false);
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

    // In the app bar, the left panel collapses to an icon-only column when the right feature panel is open;
    // the "Hidden layers" section would overlap those icons, so hidden layers are dropped in that view.
    const suppressHiddenLayers = containerType === CONTAINER_TYPE.APP_BAR && isRightPanelVisible;

    // Set the layers list (filter: visible - visible in range and isQueryable)
    const layerListEntries = visibleInRangeLayers
      .map((layerPath) => arrayOfLayerData.find((layerData) => layerData.layerPath === layerPath))
      .filter((layer) => layer && inVisibleRangeSet[layer.layerPath] !== false)
      .filter((layer) => layer && queryableByLayerPath[layer.layerPath])
      .filter((layer) => layer && !(suppressHiddenLayers && layerHiddenSet[layer.layerPath]))
      .map((layer): LayerListEntry => ({
        layerPath: layer!.layerPath,
        layerName: layerNames[layer!.layerPath] ?? '',
        layerStatus: layerStatuses[layer!.layerPath],
        queryStatus: layer!.queryStatus,
        numOffeatures: layer!.features?.length ?? 0,
        layerFeatures: getNumFeaturesLabel(layer!.features?.length ?? 0),
        tooltip: t('layers.selectLayer', { layerName: layerNames[layer!.layerPath] }) ?? '',
        layerUniqueId: `${mapId}-${TABS.DETAILS}-${layer!.layerPath ?? ''}`,
        isHidden: layerHiddenSet[layer!.layerPath],
      }));

    // Merge in-range and out-of-range layers while preserving order from arrayOfLayerData
    const existingLayerPaths = new Set(layerListEntries.map((entry) => entry.layerPath));

    // Add layers with features that aren't already in the list (out-of-range layers with features)
    arrayOfLayerData.forEach((layer) => {
      if (
        (layer.features?.length ?? 0) > 0 &&
        !existingLayerPaths.has(layer.layerPath) &&
        layer.layerPath !== LAYER_PATH_COORDINATE_INFO &&
        !layerParentHiddenSet[layer.layerPath] &&
        // Don't re-add a visibility-hidden layer that the app-bar icon view intentionally suppressed
        !(suppressHiddenLayers && layerHiddenSet[layer.layerPath])
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
    inVisibleRangeSet,
    getNumFeaturesLabel,
    mapId,
    orderedLayers,
    containerType,
    isRightPanelVisible,
    t,
  ]);

  /**
   * Memoizes a minimal structural snapshot derived exclusively from the batched layer data array.
   *
   * Contains only layerPath, numOffeatures, and queryStatus — the minimum needed to detect when a
   * batched update has changed feature counts or added/removed layers. This drives the batch-gated
   * selection effects and feature-index reset logic without re-triggering on live display changes.
   */
  const memoLayersListBatched = useMemo((): LayerListStructureEntry[] => {
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

  /** Memoizes the checked features and active current feature that should be highlighted. */
  const memoFeaturesToHighlight = useMemo((): TypeFeatureInfoEntry[] => {
    const featuresToHighlight = checkedFeatures.filter(hasValidGeometry);
    // The current feature is an additional highlight only while its detail pane is visible.
    if (memoIsPanelOpen && memoCurrentFeature && memoCurrentFeatureHasGeometry && !isFeatureInCheckedFeatures(memoCurrentFeature)) {
      featuresToHighlight.push(memoCurrentFeature);
    }
    return featuresToHighlight;
  }, [checkedFeatures, hasValidGeometry, isFeatureInCheckedFeatures, memoCurrentFeature, memoCurrentFeatureHasGeometry, memoIsPanelOpen]);

  /** Tracks the layer and feature count used by the current-feature index. */
  const previousFeatureSelectionRef = useRef({
    layerPath: selectedLayerPath,
    featureCount: memoSelectedLayerDataFeatures?.length ?? 0,
  });

  /** Resets navigation when the selected layer or its feature count changes. */
  useEffect(() => {
    logger.logTraceUseEffect('DETAILS-PANEL - reset feature index', selectedLayerPath, memoSelectedLayerDataFeatures?.length);

    const featureCount = memoSelectedLayerDataFeatures?.length ?? 0;
    if (
      previousFeatureSelectionRef.current.layerPath !== selectedLayerPath ||
      previousFeatureSelectionRef.current.featureCount !== featureCount
    ) {
      // Restart navigation when the selected layer or its result set changes.
      detailsController.setCurrentFeatureIndex(0);
    }

    previousFeatureSelectionRef.current = { layerPath: selectedLayerPath, featureCount };
  }, [detailsController, selectedLayerPath, memoSelectedLayerDataFeatures?.length]);

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

  /** Keeps map highlights synchronized with checked and current feature selection. */
  useEffect(() => {
    logger.logTraceUseEffect('DETAILS-PANEL - synchronize feature highlights', memoFeaturesToHighlight, memoSelectedLayerDataFeatures);

    const previousFeatures = previousHighlightedFeaturesRef.current;
    const layerFeaturesChanged = previousLayerFeaturesRef.current !== memoSelectedLayerDataFeatures;
    // Remove features that are no longer checked or selected.
    previousFeatures
      .filter((feature) => !memoFeaturesToHighlight.includes(feature))
      .forEach((feature) => mapController.removeHighlightedFeature(feature));
    // Add newly checked or selected features.
    memoFeaturesToHighlight
      .filter((feature) => !previousFeatures.includes(feature))
      .forEach((feature) => mapController.addHighlightedFeature(feature));

    if (layerFeaturesChanged) {
      // Reapply checked features that were already tracked when query results refresh.
      checkedFeatures
        .filter(hasValidGeometry)
        .filter((feature) => previousFeatures.includes(feature))
        .forEach((feature) => mapController.addHighlightedFeature(feature));
    }

    previousHighlightedFeaturesRef.current = memoFeaturesToHighlight;
    previousLayerFeaturesRef.current = memoSelectedLayerDataFeatures;
  }, [checkedFeatures, hasValidGeometry, mapController, memoFeaturesToHighlight, memoSelectedLayerDataFeatures]);

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

  /**
   * Clears the selection when the active layer becomes hidden on the map so the right panel stops showing its features.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL - clear selection when hidden', selectedLayerPath, layerHiddenSet);

    // Only react to visibility-driven hiding (not out-of-scale-range), and ignore the coordinate-info entry
    if (
      selectedLayerPath &&
      selectedLayerPath !== LAYER_PATH_COORDINATE_INFO &&
      layerHiddenSet[selectedLayerPath] &&
      inVisibleRangeSet[selectedLayerPath] !== false
    ) {
      detailsController.setSelectedLayerPath('');
    }
  }, [detailsController, selectedLayerPath, layerHiddenSet, inVisibleRangeSet]);

  // #endregion

  // #region EVENT HANDLERS SECTION

  /**
   * Handles click to remove all features in right panel.
   */
  const handleClearAllHighlights = useCallback((): void => {
    if (checkedFeatures.length === 0) return;
    detailsController.removeCheckedFeature('all');
  }, [checkedFeatures.length, detailsController]);

  /**
   * Handles when the right panel is closed in responsive layout.
   * Removes the currently selected feature highlight (but keeps checked features).
   */
  const handleRightPanelClosed = useCallback((): void => {
    // Remember the explicit close so the no-features guide effect doesn't immediately force the panel back open
    userDismissedGuideRef.current = true;

    // Return focus to the layer list item that opened this panel
    if (selectedLayerPath) {
      // Construct the layer list item ID
      const layerListItemId = `${mapId}-${TABS.DETAILS}-${selectedLayerPath}`;
      uiController.disableFocusTrap(layerListItemId);
    } else {
      // No layer selected, don't move focus
      uiController.disableFocusTrap('no-focus');
    }
  }, [selectedLayerPath, mapId, uiController]);

  /**
   * Handles when the right panel visibility changes.
   */
  const handleRightPanelVisibilityChanged = useCallback((isVisible: boolean): void => {
    setIsRightPanelVisible(isVisible);
  }, []);

  /**
   * Handles clicks to forward and back arrows in right panel.
   * Updates the selected feature index and restores focus to the navigation button.
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

      // Let the highlight effect react to the new current feature.
      detailsController.setCurrentFeatureIndex(newIndex);

      // Restore focus to the navigation button after React completes the state update and re-render
      requestAnimationFrame(() => {
        if (change === -1) {
          // Explicitly request focus indicator for keyboard users
          prevButtonRef.current?.focus({ preventScroll: true, focusVisible: true });
        } else {
          // Explicitly request focus indicator for keyboard users
          nextButtonRef.current?.focus({ preventScroll: true, focusVisible: true });
        }
      });
    },
    [currentFeatureIndex, detailsController, memoSelectedLayerData]
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
      // Start on the first result in the newly selected layer.
      detailsController.setCurrentFeatureIndex(0);
      detailsController.setSelectedLayerPath(layerEntry.layerPath);
    },
    [detailsController]
  );
  // #endregion

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
      // Keep the cleared targets from being restored by the synchronization effect.
      previousHighlightedFeaturesRef.current = memoFeaturesToHighlight;

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

    // Reset the dismissed flag when the panel is closed so re-opening details can auto-show the guide again
    if (!isDetailsActive) {
      userDismissedGuideRef.current = false;
      return;
    }

    // Only run when details is active
    if (isDetailsActive && arrayOfLayerDataBatch && arrayOfLayerDataBatch.length > 0) {
      // Check if all layers have no features (excluding coordinate-info)
      const allLayersHaveNoFeatures = arrayOfLayerDataBatch.every(
        (layer) => layer.layerPath === LAYER_PATH_COORDINATE_INFO || !layer.features || layer.features.length === 0
      );

      // Features are available again: allow the guide to auto-show on the next no-features state
      if (!allLayersHaveNoFeatures) {
        userDismissedGuideRef.current = false;
      }

      // Check if we should clear the selected layer
      const shouldClearSelectedLayer = allLayersHaveNoFeatures && !coordinateInfoEnabled;

      // If should clear the selected layer and queries are processed (skip when the user already closed the panel)
      if (shouldClearSelectedLayer && memoIsAllLayersQueryStatusProcessed && !userDismissedGuideRef.current) {
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
          <Box sx={memoSxClasses.rightPanelStatus}>
            <Box role="status">
              {t('details.featureDetailsTitle')
                .replace('{count}', `${currentFeatureIndex + 1}`)
                .replace('{total}', `${memoSelectedLayerDataFeatures?.length}`)}
            </Box>
            {memoSelectedLayerData?.features && memoSelectedLayerData.features.length > 1 && (
              <Box role="group" aria-label={t('details.featureNavigation')} sx={memoSxClasses.rightPanelButtons}>
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
                  aria-label={t('details.nextFeatureBtn')}
                  tooltipPlacement="top"
                  onClick={handleNextFeature}
                  aria-disabled={isNextDisabled}
                  className="buttonOutline"
                >
                  <ArrowForwardIosOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </Box>

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
      compact={containerType === CONTAINER_TYPE.APP_BAR && isRightPanelVisible}
    >
      {renderContent()}
    </Layout>
  );
}
