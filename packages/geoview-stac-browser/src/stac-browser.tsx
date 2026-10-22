import type { SxProps, SxStyles } from 'geoview-core/ui/style/types';
import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { DateMgt } from 'geoview-core/core/utils/date-mgt';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import {
  useStoreAppDisplayDateMode,
  useStoreAppDisplayDateTimezone,
  useStoreAppDisplayLanguage,
} from 'geoview-core/core/stores/states/app-state';
import { useStacBrowserController } from 'geoview-core/core/controllers/use-controllers';
import type { TypeStacMapExtentSnapshot, TypeStacPreviewAsset } from 'geoview-core/core/controllers/stac-browser-controller';

import type {
  BrowseMode,
  PanelView,
  StacBrowserConfig,
  StacCapabilities,
  StacCollection,
  StacFilterValues,
  StacFilterPanelState,
  StacAsset,
  StacItem,
  StacItemDisplayOptions,
  StacItemInteractions,
  StacLink,
  StacSearchParams,
  StacSearchResult,
} from './stac-browser-types';
import { DEFAULT_PAGE_LIMIT, StacApiService } from './stac-api-service';
import { StacAssetUtils } from './stac-asset-utils';
import { StacConfigUtils } from './stac-config-utils';
import { StacFieldUtils } from './stac-field-utils';
import { StacFilterPanel } from './stac-filter-panel';
import { StacCollectionList } from './stac-collection-list';
import { StacCollectionDetail } from './stac-collection-detail';
import { StacSearchResults } from './stac-search-results';
import { StacItemDetail } from './stac-item-detail';
import { getSxClasses, SELECTED_FILL_OPACITY, SELECTION_COLORS } from './stac-browser-style';

/** Geometry group used for the selected item footprints. */
const SELECTED_FOOTPRINT_GROUP = 'stac-selected-footprints';

/** Z-index of the selected footprints, above the other footprints (9999) and below the previews (10002). */
const SELECTED_FOOTPRINT_ZINDEX = 10001;

/** Props for the StacBrowser component. */
interface StacBrowserProps {
  /** Plugin configuration. */
  config: StacBrowserConfig;
}

/**
 * Creates the STAC browser main component with browse and search modes.
 *
 * @param props - Properties defined in StacBrowserProps interface
 * @returns The STAC browser component
 */
export function StacBrowser(props: StacBrowserProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-browser');

  const { config } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useId, useMemo, useRef, useState } = cgpv.reactUtilities.react;
  const memoSxClasses = useMemo((): SxStyles => getSxClasses(theme), [theme]);

  const stacController = useStacBrowserController();
  const displayLanguage = useStoreAppDisplayLanguage();
  const displayDateTimezone = useStoreAppDisplayDateTimezone();
  const displayDateMode = useStoreAppDisplayDateMode();

  const browseEnabled = config.browseEnabled !== false;
  const initialMode: BrowseMode = browseEnabled ? (config.defaultMode ?? 'browse') : 'search';

  // State
  const [mode, setMode] = useState<BrowseMode>(initialMode);
  const [view, setView] = useState<PanelView>(initialMode === 'search' ? 'search' : 'collections');
  const [capabilities, setCapabilities] = useState<StacCapabilities | undefined>(undefined);
  const [collections, setCollections] = useState<StacCollection[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [defaultCollection, setDefaultCollection] = useState<StacCollection | undefined>(undefined);
  const [selectedCollection, setSelectedCollection] = useState<StacCollection | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<StacItem | undefined>(undefined);
  const [searchResult, setSearchResult] = useState<StacSearchResult | undefined>(undefined);
  /** Search result pages cached to provide stable previous-page navigation after client-side filtering. */
  const [searchResultPages, setSearchResultPages] = useState<StacSearchResult[]>([]);
  const [searchParams, setSearchParams] = useState<StacSearchParams | undefined>(undefined);
  /** Extent used to enforce strict item containment in a search. */
  const [searchContainedExtent, setSearchContainedExtent] = useState<[number, number, number, number] | undefined>(undefined);
  /** Visible map extent captured at search submission, preserved while paging and inspecting items. */
  const [searchMapExtent, setSearchMapExtent] = useState<TypeStacMapExtentSnapshot | undefined>(undefined);
  /** Search form values are lifted here so navigation back from results preserves them. */
  const [filterPanelState, setFilterPanelState] = useState<StacFilterPanelState>(() => StacConfigUtils.getDefaultFilterPanelState(config));
  const [isLoading, setIsLoading] = useState(false);
  const [nextPageLink, setNextPageLink] = useState<StacLink | undefined>(undefined);
  const [prevPageLink, setPrevPageLink] = useState<StacLink | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  /** Tracks which view the item-detail was opened from. */
  const [itemDetailOrigin, setItemDetailOrigin] = useState<PanelView>('collections');
  /** Selected items with their footprint color, keyed by stable item identity. */
  const [selectedItems, setSelectedItems] = useState<Record<string, { item: StacItem; color: string }>>({});
  /** URL of the asset previewed on the map, keyed by stable item identity; shared by the item cards and the item detail. */
  const [previewedHrefs, setPreviewedHrefs] = useState<Record<string, string>>({});
  /** Identifies the latest item-detail request so stale responses cannot change the active view. */
  const itemDetailRequestIdRef = useRef(0);
  /** Container of the active view, used to find its focus target. */
  const contentRef = useRef<HTMLDivElement>(null);
  const modeTabsId = useId();
  /** Whether the next render should move focus to the active view heading, set by user navigation only. */
  const isViewFocusRequestedRef = useRef(false);
  /** Optional selector of the element to focus instead of the view heading. */
  const viewFocusSelectorRef = useRef<string | undefined>(undefined);

  const limit = config.defaults?.limit ?? DEFAULT_PAGE_LIMIT;
  const searchSortBy = capabilities?.searchSort ? config.defaults?.sortBy : undefined;
  const itemsSortBy = capabilities?.itemsSort ? config.defaults?.sortBy : undefined;
  const isPreviewEnabled = config.displayPreview !== false && config.preview?.mode !== 'none';

  /** The STAC API service instance. */
  const memoApiService = useMemo((): StacApiService => {
    logger.logTraceUseMemo('STAC-BROWSER - memoApiService', config.stacUrl);
    return new StacApiService(config.stacUrl);
  }, [config.stacUrl]);

  /**
   * Fetches the server capabilities and the allowed collections on mount, then opens the default collection if any.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-BROWSER - Fetch capabilities and collections on mount');

    // Fetch the collections data
    let cancelled = false;
    const fetchData = async (): Promise<void> => {
      try {
        const [serverCapabilities, allCollections] = await Promise.all([
          memoApiService.fetchCapabilities(),
          memoApiService.fetchCollections(),
        ]);
        if (cancelled) return;

        const allowedCollections = StacConfigUtils.filterCollections(allCollections, config.collections);
        const startCollection =
          allowedCollections.find((collection) => collection.id === config.collections?.default) ??
          (allowedCollections.length === 1 ? allowedCollections[0] : undefined);

        setCapabilities(serverCapabilities);
        setCollections(allowedCollections);
        if (startCollection) {
          setDefaultCollection(startCollection);
          if (initialMode === 'browse') {
            setSelectedCollection(startCollection);
            setView('collection-detail');
          }
        }
      } catch (error: unknown) {
        // UI boundary: report the failed request to the user
        if (cancelled) return;
        logger.logError('STAC-BROWSER - Failed to initialize the STAC browser', error);
        stacController.showError('stacBrowser.errorRequest');
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    };
    void fetchData();
    return (): void => {
      cancelled = true;
    };
  }, [memoApiService, config.collections, initialMode, stacController]);

  /**
   * Draws the selected item footprints in their selection color.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-BROWSER - Draw selected footprints', Object.keys(selectedItems).length);

    stacController.setFootprints(
      SELECTED_FOOTPRINT_GROUP,
      Object.values(selectedItems).map(({ item, color }) => ({
        geometry: item.geometry,
        bbox: item.bbox,
        color,
        fillOpacity: SELECTED_FILL_OPACITY,
      })),
      SELECTED_FOOTPRINT_ZINDEX
    );

    return (): void => {
      stacController.clearFootprints(SELECTED_FOOTPRINT_GROUP);
    };
  }, [stacController, selectedItems]);

  /**
   * Removes the item previews from the map when the browser unmounts.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-BROWSER - Register preview cleanup');

    return (): void => {
      itemDetailRequestIdRef.current += 1;
      stacController.removeAllOverlays();
    };
  }, [stacController]);

  /**
   * Moves the keyboard focus to the active view heading after a user navigation replaced the focused control.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-BROWSER - Focus the active view', view);

    if (!isViewFocusRequestedRef.current) return;
    const target =
      (viewFocusSelectorRef.current && contentRef.current?.querySelector<HTMLElement>(viewFocusSelectorRef.current)) ||
      contentRef.current?.querySelector<HTMLElement>('[data-stac-view-focus]');
    if (!target) return;
    isViewFocusRequestedRef.current = false;
    viewFocusSelectorRef.current = undefined;
    target.focus();
  }, [view, mode, selectedItem, selectedCollection, selectedItems, previewedHrefs]);

  /**
   * Stores a search result page and its pagination links.
   *
   * @param result - The search result
   * @param page - The 1-based page number of the result
   */
  const applySearchResult = useCallback((result: StacSearchResult, page: number): void => {
    setSearchResult(result);
    setNextPageLink(StacApiService.getPageLink(result, 'next'));
    setPrevPageLink(StacApiService.getPageLink(result, 'prev'));
    setCurrentPage(page);
  }, []);

  /**
   * Resolves the collections to search, applying the configured search restriction.
   *
   * @param selected - Optional collection IDs selected by the user
   * @returns The collection IDs to search, or undefined to search all collections
   */
  const resolveSearchCollections = useCallback(
    (selected?: string[]): string[] | undefined => {
      const isRestricted = !!(config.collections?.include?.length || config.collections?.exclude?.length);
      const allowedIds = collections.map((collection) => collection.id);

      if (selected?.length) return isRestricted ? selected.filter((id) => allowedIds.includes(id)) : selected;
      return isRestricted ? allowedIds : undefined;
    },
    [config.collections, collections]
  );

  /**
   * Builds the display options shared by the item cards and the item detail, including the map date settings.
   */
  const memoDisplay = useMemo((): StacItemDisplayOptions => {
    logger.logTraceUseMemo('STAC-BROWSER - memoDisplay', isPreviewEnabled, displayLanguage, displayDateTimezone, displayDateMode);
    const { dateFormat, datetimeFormat } = DateMgt.getDisplayDateDefaults(displayDateMode);
    return {
      itemView: config.itemView,
      actions: config.actions,
      preview: config.preview,
      footprintStyles: config.footprintStyles,
      collectionOverrides: config.collectionOverrides,
      isPreviewEnabled,
      dateDisplay: {
        language: displayLanguage,
        timezone: displayDateTimezone,
        dateFormat: dateFormat[displayLanguage],
        datetimeFormat: datetimeFormat[displayLanguage],
      },
    };
  }, [
    config.itemView,
    config.actions,
    config.preview,
    config.footprintStyles,
    config.collectionOverrides,
    isPreviewEnabled,
    displayLanguage,
    displayDateTimezone,
    displayDateMode,
  ]);

  /**
   * Removes the map preview of an item.
   *
   * @param itemKey - The stable item identity
   */
  const hidePreview = useCallback(
    (itemKey: string): void => {
      stacController.removeOverlay(StacConfigUtils.getPreviewOverlayId(itemKey));
      setPreviewedHrefs((prev) => {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      });
    },
    [stacController]
  );

  /**
   * Shows an asset of an item on the map, replacing the current preview of that item.
   *
   * @param item - The STAC item
   * @param previewAsset - The asset to show
   */
  const showPreview = useCallback(
    (item: StacItem, previewAsset: TypeStacPreviewAsset): void => {
      const itemKey = StacFieldUtils.getItemKey(item);
      hidePreview(itemKey);
      const { preview } = StacConfigUtils.resolveItemDisplayOptions(memoDisplay, item.collection);
      stacController
        .addPreviewOverlay(StacConfigUtils.getPreviewOverlayId(itemKey), previewAsset, preview?.opacity, item.bbox, item.geometry)
        .then((isAdded) => {
          if (isAdded) setPreviewedHrefs((prev) => ({ ...prev, [itemKey]: previewAsset.href }));
        })
        .catch((error: unknown) => {
          logger.logError(`STAC-BROWSER - Failed to preview item ${item.id}`, error);
        });
    },
    [stacController, memoDisplay, hidePreview]
  );

  // #region Handlers

  /**
   * Handles switching between browse and search modes.
   */
  const handleModeChange = useCallback(
    (newMode: BrowseMode): void => {
      if (newMode === 'browse' && !browseEnabled) return;
      itemDetailRequestIdRef.current += 1;
      setMode(newMode);
      if (newMode === 'browse') {
        setView(defaultCollection ? 'collection-detail' : 'collections');
      } else {
        setView('search');
      }
      // Clear selection when switching modes
      setSelectedItem(undefined);
      setSelectedCollection(newMode === 'browse' ? defaultCollection : undefined);
      setSearchResult(undefined);
      setSearchResultPages([]);
      setSearchContainedExtent(undefined);
      setSearchMapExtent(undefined);
    },
    [browseEnabled, defaultCollection]
  );

  /**
   * Handles clicking a browse/search mode tab, ignored while a request is pending.
   */
  const handleModeClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      if (isLoading) return;
      const newMode = event.currentTarget.dataset.mode;
      if (newMode === 'browse' || newMode === 'search') {
        handleModeChange(newMode);
      }
    },
    [isLoading, handleModeChange]
  );

  /**
   * Handles arrow, Home and End keys on the mode tabs; Enter and Space activate the focused tab.
   */
  const handleModeKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>): void => {
    const currentMode = event.currentTarget.dataset.mode;
    let nextMode: BrowseMode | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') nextMode = currentMode === 'browse' ? 'search' : 'browse';
    else if (event.key === 'Home') nextMode = 'browse';
    else if (event.key === 'End') nextMode = 'search';
    if (!nextMode) return;

    event.preventDefault();
    event.currentTarget.parentElement?.querySelector<HTMLElement>(`[data-mode="${nextMode}"]`)?.focus();
  }, []);

  /**
   * Handles clicking on a collection card to view its details.
   */
  const handleCollectionClick = useCallback((collection: StacCollection): void => {
    itemDetailRequestIdRef.current += 1;
    isViewFocusRequestedRef.current = true;
    setSelectedCollection(collection);
    setView('collection-detail');
  }, []);

  /**
   * Handles clicking on an item to view its details.
   */
  const handleItemClick = useCallback(
    (item: StacItem): void => {
      const requestId = ++itemDetailRequestIdRef.current;
      const openItem = (itemToOpen: StacItem): void => {
        if (requestId !== itemDetailRequestIdRef.current) return;
        isViewFocusRequestedRef.current = true;
        setSelectedItem(itemToOpen);
        setItemDetailOrigin(view);
        setView('item-detail');
      };

      const selfLink = item.links?.find((link) => link.rel === 'self');
      if (!selfLink?.href) {
        openItem(item);
        return;
      }

      StacApiService.fetchItem(selfLink.href)
        .then(openItem)
        .catch((error: unknown) => {
          if (requestId !== itemDetailRequestIdRef.current) return;
          // Best effort: the item from the list already holds the metadata, the full item only enriches it
          logger.logWarning(`STAC-BROWSER - Could not fetch the full item ${item.id}, using the listed item`, error);
          openItem(item);
        });
    },
    [view]
  );

  /**
   * Handles search submission from the filter panel.
   */
  const handleSearch = useCallback(
    (filters: StacFilterValues): void => {
      if (isLoading) return;
      const doSearch = async (): Promise<void> => {
        try {
          setIsLoading(true);
          itemDetailRequestIdRef.current += 1;
          setSelectedItem(undefined);
          setSearchResult(undefined);
          setSearchMapExtent(stacController.captureMapExtent());

          const collectionIds = resolveSearchCollections(filters.collections);
          const containedExtent = filters.containedInExtent ? filters.bbox : undefined;

          if (collectionIds && collectionIds.length === 0) {
            logger.logInfo('STAC-BROWSER - No collection to search');
            setSearchParams(undefined);
            setSearchContainedExtent(undefined);
            const emptyResult: StacSearchResult = { type: 'FeatureCollection', features: [] };
            setSearchResultPages([emptyResult]);
            applySearchResult(emptyResult, 1);
            setView('search');
          } else {
            const params: StacSearchParams = {
              collections: collectionIds,
              bbox: filters.bbox,
              datetime: filters.datetime,
              q: filters.q,
              limit,
              sortby: filters.sortBy ?? searchSortBy,
              ...(filters.filter && { filter: filters.filter, filterLang: 'cql2-json' as const }),
            };
            logger.logInfo('STAC-BROWSER - Searching with params:', params);

            const result = await memoApiService.searchItems(params, containedExtent);
            logger.logInfo(`STAC-BROWSER - Search returned ${result.features.length} features`);
            setSearchParams(params);
            setSearchContainedExtent(containedExtent);
            setSearchResultPages([result]);
            applySearchResult(result, 1);
            const hasResults = result.features.length > 0 || !!StacApiService.getPageLink(result, 'next');
            if (hasResults) isViewFocusRequestedRef.current = true;
            setView(hasResults ? 'search-results' : 'search');
          }
        })
        .catch((error: unknown): void => {
          // UI boundary: report the failed request to the user
          logger.logError('STAC-BROWSER - Search failed:', error);
          stacController.showError('stacBrowser.errorRequest');
        } finally {
          setIsLoading(false);
        });
    },
    [isLoading, resolveSearchCollections, limit, searchSortBy, memoApiService, applySearchResult, stacController]
  );

  /**
   * Loads a search result page from a pagination link.
   *
   * @param link - Optional pagination link
   * @param page - The 1-based page number of the page to load
   */
  const loadSearchPage = useCallback(
    (link: StacLink | undefined, page: number): void => {
      if (!link || !searchParams) return;
      setIsLoading(true);
      memoApiService
        .fetchSearchPage(link, searchParams, searchContainedExtent)
        .then((result) => {
          setSearchResultPages((previous) => [...previous.slice(0, page - 1), result]);
          applySearchResult(result, page);
        })
        .catch((error: unknown) => {
          // UI boundary: report the failed request to the user
          logger.logError('STAC-BROWSER - Failed to fetch the search page', error);
          stacController.showError('stacBrowser.errorRequest');
        })
        .finally(() => setIsLoading(false));
    },
    [memoApiService, searchParams, searchContainedExtent, applySearchResult, stacController]
  );

  /**
   * Handles navigating to the next page of search results.
   */
  const handleNextPage = useCallback((): void => {
    const nextPage = currentPage + 1;
    const cachedPage = searchResultPages[nextPage - 1];
    if (cachedPage) {
      applySearchResult(cachedPage, nextPage);
      return;
    }
    loadSearchPage(nextPageLink, nextPage);
  }, [loadSearchPage, nextPageLink, currentPage, searchResultPages, applySearchResult]);

  /**
   * Handles navigating to the previous page of search results.
   */
  const handlePrevPage = useCallback((): void => {
    const previousPage = Math.max(1, currentPage - 1);
    const cachedPage = searchResultPages[previousPage - 1];
    if (cachedPage) {
      applySearchResult(cachedPage, previousPage);
      return;
    }
    loadSearchPage(prevPageLink, previousPage);
  }, [loadSearchPage, prevPageLink, currentPage, searchResultPages, applySearchResult]);

  /**
   * Handles going back from item detail to its origin view.
   */
  const handleBackFromItemDetail = useCallback((): void => {
    itemDetailRequestIdRef.current += 1;
    isViewFocusRequestedRef.current = true;
    setSelectedItem(undefined);
    setView(itemDetailOrigin);
  }, [itemDetailOrigin]);

  /**
   * Handles going back to the collections list.
   */
  const handleBackToCollections = useCallback((): void => {
    itemDetailRequestIdRef.current += 1;
    isViewFocusRequestedRef.current = true;
    viewFocusSelectorRef.current = selectedCollection ? `[data-collection-id="${CSS.escape(selectedCollection.id)}"]` : undefined;
    setSelectedCollection(undefined);
    setView('collections');
  }, [selectedCollection]);

  /**
   * Handles going back to the search panel.
   */
  const handleBackToSearch = useCallback((): void => {
    itemDetailRequestIdRef.current += 1;
    isViewFocusRequestedRef.current = true;
    setView('search');
  }, []);

  /**
   * Handles resetting the search form to configured defaults.
   */
  const handleClearFilters = useCallback((): void => {
    setFilterPanelState(StacConfigUtils.getDefaultFilterPanelState(config));
    setSearchResult(undefined);
  }, [config]);

  /**
   * Handles navigating from item detail up to its parent collection.
   */
  const handleGoToCollection = useCallback(
    (collectionId: string): void => {
      if (!browseEnabled) return;
      const collection = collections.find((c) => c.id === collectionId);
      if (collection) {
        itemDetailRequestIdRef.current += 1;
        isViewFocusRequestedRef.current = true;
        setMode('browse');
        setSelectedItem(undefined);
        setSelectedCollection(collection);
        setView('collection-detail');
      }
    },
    [browseEnabled, collections]
  );

  /**
   * Handles toggling the selection (colored footprint) of an item.
   */
  const handleToggleSelected = useCallback((item: StacItem): void => {
    const itemKey = StacFieldUtils.getItemKey(item);
    setSelectedItems((prev) => {
      if (prev[itemKey]) {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      }
      const usedColors = new Set(Object.values(prev).map((entry) => entry.color));
      const color =
        SELECTION_COLORS.find((candidate) => !usedColors.has(candidate)) ??
        SELECTION_COLORS[Object.keys(prev).length % SELECTION_COLORS.length];
      return { ...prev, [itemKey]: { item, color } };
    });
  }, []);

  /**
   * Handles the item card map preview: hides any shown asset of the item, otherwise shows its configured preview asset.
   */
  const handleTogglePreview = useCallback(
    (item: StacItem): void => {
      const itemKey = StacFieldUtils.getItemKey(item);
      if (previewedHrefs[itemKey]) {
        hidePreview(itemKey);
        return;
      }

      const { preview } = StacConfigUtils.resolveItemDisplayOptions(memoDisplay, item.collection);
      const previewAsset = StacAssetUtils.getPreviewAsset(item, preview);
      if (previewAsset) showPreview(item, previewAsset);
    },
    [previewedHrefs, memoDisplay, hidePreview, showPreview]
  );

  /**
   * Handles an item detail asset toggle: hides the asset when it is shown, otherwise shows it instead of the current preview.
   */
  const handleToggleAssetPreview = useCallback(
    (item: StacItem, asset: StacAsset): void => {
      const itemKey = StacFieldUtils.getItemKey(item);
      if (previewedHrefs[itemKey] === asset.href) {
        hidePreview(itemKey);
        return;
      }
      showPreview(item, { kind: 'cog', href: asset.href });
    },
    [previewedHrefs, hidePreview, showPreview]
  );

  /**
   * Handles zooming to an item.
   */
  const handleZoomToItem = useCallback(
    (item: StacItem): void => {
      const bbox = StacFieldUtils.getBbox(item);
      if (!bbox) return;
      stacController.zoomToLonLatBbox(bbox).catch((error: unknown) => {
        logger.logError(`STAC-BROWSER - Failed to zoom to item ${item.id}`, error);
      });
    },
    [stacController]
  );

  /**
   * Restores the map extent captured when the current search was submitted.
   */
  const handleZoomToSearch = useCallback((): void => {
    if (!searchMapExtent) return;
    stacController.zoomToMapExtent(searchMapExtent).catch((error: unknown) => {
      logger.logError('STAC-BROWSER - Failed to restore the search extent', error);
    });
  }, [stacController, searchMapExtent]);

  /**
   * Handles clearing every item selection and map preview.
   */
  const handleClearSelection = useCallback((): void => {
    Object.keys(previewedHrefs).forEach((itemKey) => stacController.removeOverlay(StacConfigUtils.getPreviewOverlayId(itemKey)));
    // The Clear button disappears with the selection bar
    isViewFocusRequestedRef.current = true;
    setPreviewedHrefs({});
    setSelectedItems({});
  }, [stacController, previewedHrefs]);

  // #endregion

  /**
   * Builds the selection/preview state and callbacks of the item cards.
   */
  const memoInteractions = useMemo((): StacItemInteractions => {
    logger.logTraceUseMemo('STAC-BROWSER - memoInteractions', selectedItems, previewedHrefs);
    const selectedColors: Record<string, string> = {};
    Object.entries(selectedItems).forEach(([itemId, entry]) => {
      selectedColors[itemId] = entry.color;
    });
    return {
      selectedColors,
      previewedHrefs,
      onToggleSelected: handleToggleSelected,
      onTogglePreview: handleTogglePreview,
      onZoom: handleZoomToItem,
      onOpenDetail: handleItemClick,
    };
  }, [selectedItems, previewedHrefs, handleToggleSelected, handleTogglePreview, handleZoomToItem, handleItemClick]);

  const selectedCount = Object.keys(selectedItems).length;
  const previewedCount = Object.keys(previewedHrefs).length;
  const hasSelection = selectedCount > 0 || previewedCount > 0;

  /**
   * Renders the active view based on the current panel state.
   */
  const renderContent = (): JSX.Element => {
    // Item detail — shared by both modes
    if (view === 'item-detail' && selectedItem) {
      return (
        <StacItemDetail
          item={selectedItem}
          display={memoDisplay}
          previewedHref={previewedHrefs[StacFieldUtils.getItemKey(selectedItem)]}
          onToggleAssetPreview={handleToggleAssetPreview}
          onBack={handleBackFromItemDetail}
          onGoToCollection={browseEnabled ? handleGoToCollection : undefined}
        />
      );
    }

    // Collection detail — browse mode
    if (view === 'collection-detail' && selectedCollection) {
      return (
        <StacCollectionDetail
          collection={selectedCollection}
          apiService={memoApiService}
          limit={limit}
          sortby={itemsSortBy}
          display={memoDisplay}
          interactions={memoInteractions}
          onBack={collections.length > 1 ? handleBackToCollections : undefined}
        />
      );
    }

    // Search results — search mode
    if (view === 'search-results' && searchResult) {
      return (
        <StacSearchResults
          results={searchResult}
          collections={collections}
          display={memoDisplay}
          interactions={memoInteractions}
          pageSize={limit}
          isLoading={isLoading}
          onBack={handleBackToSearch}
          onZoomToSearch={searchMapExtent ? handleZoomToSearch : undefined}
          hasNext={!!nextPageLink}
          hasPrev={currentPage > 1}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          currentPage={currentPage}
        />
      );
    }

    // Search panel — search mode
    if (mode === 'search') {
      return (
        <Box sx={memoSxClasses.panelContent}>
          <StacFilterPanel
            config={config}
            collections={collections}
            apiService={memoApiService}
            isFreeTextSupported={!!capabilities?.freeText}
            isPropertyFilterSupported={!!capabilities?.cql2Json}
            isSortSupported={!!capabilities?.searchSort}
            isSearching={isLoading}
            hasNoResults={searchResult?.features.length === 0 && !nextPageLink}
            filterState={filterPanelState}
            setFilterState={setFilterPanelState}
            onClearFilters={handleClearFilters}
            onSearch={handleSearch}
          />
        </Box>
      );
    }

    // Default: collections list — browse mode
    if (!isInitialized) {
      return (
        <Box sx={memoSxClasses.loading} role="status">
          <Typography>{t('stacBrowser.loading')}</Typography>
        </Box>
      );
    }

    if (collections.length === 0) {
      return (
        <Box sx={memoSxClasses.noResults} role="status">
          <Typography>{t('stacBrowser.noResults')}</Typography>
        </Box>
      );
    }

    return (
      <Box sx={memoSxClasses.panelContent}>
        <StacCollectionList collections={collections} dateDisplay={memoDisplay.dateDisplay} onCollectionClick={handleCollectionClick} />
      </Box>
    );
  };

  return (
    <Box sx={memoSxClasses.mainContainer}>
      {/* Mode toggle — Browse / Search (hide when in item-detail) */}
      {browseEnabled && view !== 'item-detail' && (
        <Box sx={memoSxClasses.modeToggle} role="tablist" aria-label={t('stacBrowser.modeSelector')}>
          <Button
            type="text"
            sx={[memoSxClasses.modeButton, mode === 'browse' && memoSxClasses.modeButtonActive] as SxProps}
            id={`${modeTabsId}-browse`}
            data-mode="browse"
            role="tab"
            aria-selected={mode === 'browse'}
            aria-controls={`${modeTabsId}-panel`}
            tabIndex={mode === 'browse' ? 0 : -1}
            aria-disabled={isLoading}
            onClick={handleModeClick}
            onKeyDown={handleModeKeyDown}
          >
            {t('stacBrowser.browse')}
          </Button>
          <Button
            type="text"
            sx={[memoSxClasses.modeButton, mode === 'search' && memoSxClasses.modeButtonActive] as SxProps}
            id={`${modeTabsId}-search`}
            data-mode="search"
            role="tab"
            aria-selected={mode === 'search'}
            aria-controls={`${modeTabsId}-panel`}
            tabIndex={mode === 'search' ? 0 : -1}
            aria-disabled={isLoading}
            onClick={handleModeClick}
            onKeyDown={handleModeKeyDown}
          >
            {t('stacBrowser.search')}
          </Button>
        </Box>
      )}

      {/* Selection summary, kept across views so the user can clear the map at any time; the status stays mounted to be announced */}
      <Box sx={hasSelection ? memoSxClasses.selectionBar : undefined}>
        <Typography role="status" sx={memoSxClasses.resultMeta}>
          {hasSelection ? t('stacBrowser.selectionSummary', { selected: selectedCount, previewed: previewedCount }) : ''}
        </Typography>
        {hasSelection && (
          <Button type="text" size="small" onClick={handleClearSelection}>
            {t('stacBrowser.clear')}
          </Button>
        )}
      </Box>

      <Box
        ref={contentRef}
        sx={memoSxClasses.viewContainer}
        {...(browseEnabled &&
          view !== 'item-detail' && {
            id: `${modeTabsId}-panel`,
            role: 'tabpanel',
            'aria-labelledby': `${modeTabsId}-${mode}`,
          })}
      >
        {renderContent()}
      </Box>
    </Box>
  );
}
