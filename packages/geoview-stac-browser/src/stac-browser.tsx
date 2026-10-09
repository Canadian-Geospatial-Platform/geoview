import type { SxProps, SxStyles } from 'geoview-core/ui/style/types';
import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStacBrowserController } from 'geoview-core/core/controllers/use-controllers';

import type {
  BrowseMode,
  PanelView,
  StacBrowserConfig,
  StacCapabilities,
  StacCollection,
  StacFilterValues,
  StacFilterPanelState,
  StacItem,
  StacItemDisplayOptions,
  StacItemInteractions,
  StacLink,
  StacSearchParams,
  StacSearchResult,
} from './stac-browser-types';
import { DEFAULT_PAGE_LIMIT, SELECTION_COLORS, StacApiService } from './stac-api-service';
import { StacAssetUtils } from './stac-asset-utils';
import { StacFieldUtils } from './stac-field-utils';
import { StacFilterPanel } from './stac-filter-panel';
import { StacCollectionList } from './stac-collection-list';
import { StacCollectionDetail } from './stac-collection-detail';
import { StacSearchResults } from './stac-search-results';
import { StacItemDetail } from './stac-item-detail';
import { getSxClasses } from './stac-browser-style';

/** Geometry group used for the selected item footprints. */
const SELECTED_FOOTPRINT_GROUP = 'stac-selected-footprints';

/** Z-index of the selected footprints, above the other footprints (9999) and the previews (10000). */
const SELECTED_FOOTPRINT_ZINDEX = 10001;

/**
 * Gets the overlay id of an item map preview.
 *
 * @param itemId - The item id
 * @returns The overlay id
 */
function getPreviewOverlayId(itemId: string): string {
  return `stac-preview-${itemId}`;
}

/**
 * Gets the default values shown in the search form.
 *
 * @param config - The plugin configuration
 * @returns The initial search-form state
 */
function getDefaultFilterPanelState(config: StacBrowserConfig): StacFilterPanelState {
  const datetime = config.defaults?.datetime?.split('/') ?? [];
  const getDate = (value: string | undefined): string => (value && value !== '..' ? value.substring(0, 10) : '');

  return {
    selectedCollections: config.defaults?.collections ?? [],
    useMapExtent: false,
    containedInExtent: false,
    startDate: getDate(datetime[0]),
    endDate: getDate(datetime[1]),
    keyword: '',
    propertyFilters: {},
    sortField: config.defaults?.sortBy?.[0]?.field ?? 'datetime',
    sortDirection: config.defaults?.sortBy?.[0]?.direction ?? 'desc',
  };
}

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
  const { useCallback, useEffect, useMemo, useState } = cgpv.reactUtilities.react;
  const memoSxClasses = useMemo((): SxStyles => getSxClasses(theme), [theme]);

  const stacController = useStacBrowserController();

  // State
  const [mode, setMode] = useState<BrowseMode | string>('browse');
  const [view, setView] = useState<PanelView>('collections');
  const [capabilities, setCapabilities] = useState<StacCapabilities | undefined>(undefined);
  const [collections, setCollections] = useState<StacCollection[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [defaultCollection, setDefaultCollection] = useState<StacCollection | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<StacCollection | null>(null);
  const [selectedItem, setSelectedItem] = useState<StacItem | null>(null);
  const [searchResult, setSearchResult] = useState<StacSearchResult | null>(null);
  /** Search result pages cached to provide stable previous-page navigation after client-side filtering. */
  const [searchResultPages, setSearchResultPages] = useState<StacSearchResult[]>([]);
  const [searchParams, setSearchParams] = useState<StacSearchParams | undefined>(undefined);
  /** Extent used to enforce strict item containment in a search. */
  const [searchContainedExtent, setSearchContainedExtent] = useState<[number, number, number, number] | undefined>(undefined);
  /** Search form values are lifted here so navigation back from results preserves them. */
  const [filterPanelState, setFilterPanelState] = useState<StacFilterPanelState>(() => getDefaultFilterPanelState(config));
  const [isLoading, setIsLoading] = useState(false);
  const [nextPageLink, setNextPageLink] = useState<StacLink | undefined>(undefined);
  const [prevPageLink, setPrevPageLink] = useState<StacLink | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  /** Tracks which view the item-detail was opened from. */
  const [itemDetailOrigin, setItemDetailOrigin] = useState<PanelView>('collections');
  /** Selected items with their footprint color, keyed by item id. */
  const [selectedItems, setSelectedItems] = useState<Record<string, { item: StacItem; color: string }>>({});
  /** Items previewed on the map, keyed by item id. */
  const [previewedIds, setPreviewedIds] = useState<Record<string, boolean>>({});

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

    let cancelled = false;
    const fetchData = async (): Promise<void> => {
      try {
        const [serverCapabilities, allCollections] = await Promise.all([
          memoApiService.fetchCapabilities(),
          memoApiService.fetchCollections(),
        ]);
        if (cancelled) return;

        const allowedCollections = StacApiService.filterCollections(allCollections, config.collections);
        const startCollection =
          allowedCollections.find((collection) => collection.id === config.collections?.default) ??
          (allowedCollections.length === 1 ? allowedCollections[0] : undefined);

        setCapabilities(serverCapabilities);
        setCollections(allowedCollections);
        if (startCollection) {
          setDefaultCollection(startCollection);
          setSelectedCollection(startCollection);
          setView('collection-detail');
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
  }, [memoApiService, config.collections, stacController]);

  /**
   * Draws the selected item footprints in their selection color.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-BROWSER - Draw selected footprints', Object.keys(selectedItems).length);

    stacController.clearFootprints(SELECTED_FOOTPRINT_GROUP);
    Object.values(selectedItems).forEach(({ item, color }) => {
      stacController.addFootprints(SELECTED_FOOTPRINT_GROUP, [item], color, 0.25, SELECTED_FOOTPRINT_ZINDEX);
    });

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
      stacController.removeAllOverlays();
    };
  }, [stacController]);

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
      const isRestricted =
        config.collections?.restrictSearch !== false && !!(config.collections?.include?.length || config.collections?.exclude?.length);
      const allowedIds = collections.map((collection) => collection.id);

      if (selected?.length) return isRestricted ? selected.filter((id) => allowedIds.includes(id)) : selected;
      return isRestricted ? allowedIds : undefined;
    },
    [config.collections, collections]
  );

  // #region Handlers

  /**
   * Handles switching between browse and search modes.
   */
  const handleModeChange = useCallback(
    (newMode: BrowseMode | string): void => {
      setMode(newMode);
      if (newMode === 'browse') {
        setView(defaultCollection ? 'collection-detail' : 'collections');
      } else {
        setView('search');
      }
      // Clear selection when switching modes
      setSelectedItem(null);
      setSelectedCollection(newMode === 'browse' ? defaultCollection : null);
      setSearchResult(null);
      setSearchResultPages([]);
      setSearchContainedExtent(undefined);
    },
    [defaultCollection]
  );

  /**
   * Handles clicking a browse/search mode tab.
   */
  const handleModeClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      if (event.currentTarget.dataset.mode) {
        handleModeChange(event.currentTarget.dataset.mode);
      }
    },
    [handleModeChange]
  );

  /**
   * Handles clicking on a collection card to view its details.
   */
  const handleCollectionClick = useCallback((collection: StacCollection): void => {
    setSelectedCollection(collection);
    setView('collection-detail');
  }, []);

  /**
   * Handles switching collections without leaving the item view.
   */
  const handleCollectionChange = useCallback(
    (collectionId: string): void => {
      const collection = collections.find((entry) => entry.id === collectionId);
      if (collection) handleCollectionClick(collection);
    },
    [collections, handleCollectionClick]
  );

  /**
   * Handles clicking on an item to view its details.
   */
  const handleItemClick = useCallback(
    (item: StacItem): void => {
      const openItem = (itemToOpen: StacItem): void => {
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
      const doSearch = async (): Promise<void> => {
        try {
          setIsLoading(true);
          setSelectedItem(null);

          const collectionIds = resolveSearchCollections(filters.collections);
          const containedExtent = filters.containedInExtent ? filters.bbox : undefined;

          if (collectionIds && collectionIds.length === 0) {
            logger.logInfo('STAC-BROWSER - No collection to search');
            setSearchParams(undefined);
            setSearchContainedExtent(undefined);
            const emptyResult: StacSearchResult = { type: 'FeatureCollection', features: [] };
            setSearchResultPages([emptyResult]);
            applySearchResult(emptyResult, 1);
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
          }

          setView('search-results');
        } catch (error: unknown) {
          // UI boundary: report the failed request to the user
          logger.logError('STAC-BROWSER - Search failed:', error);
          stacController.showError('stacBrowser.errorRequest');
        } finally {
          setIsLoading(false);
        }
      };
      void doSearch();
    },
    [resolveSearchCollections, limit, searchSortBy, memoApiService, applySearchResult, stacController]
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
    setSelectedItem(null);
    setView(itemDetailOrigin);
  }, [itemDetailOrigin]);

  /**
   * Handles going back to the collections list.
   */
  const handleBackToCollections = useCallback((): void => {
    setSelectedCollection(null);
    setView('collections');
  }, []);

  /**
   * Handles going back to the search panel.
   */
  const handleBackToSearch = useCallback((): void => {
    setView('search');
  }, []);

  /**
   * Handles resetting the search form to configured defaults.
   */
  const handleClearFilters = useCallback((): void => {
    setFilterPanelState(getDefaultFilterPanelState(config));
  }, [config]);

  /**
   * Handles navigating from item detail up to its parent collection.
   */
  const handleGoToCollection = useCallback(
    (collectionId: string): void => {
      const collection = collections.find((c) => c.id === collectionId);
      if (collection) {
        setSelectedItem(null);
        setSelectedCollection(collection);
        setView('collection-detail');
      }
    },
    [collections]
  );

  /**
   * Handles toggling the selection (colored footprint) of an item.
   */
  const handleToggleSelected = useCallback((item: StacItem): void => {
    setSelectedItems((prev) => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      const usedColors = new Set(Object.values(prev).map((entry) => entry.color));
      const color =
        SELECTION_COLORS.find((candidate) => !usedColors.has(candidate)) ??
        SELECTION_COLORS[Object.keys(prev).length % SELECTION_COLORS.length];
      return { ...prev, [item.id]: { item, color } };
    });
  }, []);

  /**
   * Handles toggling the map preview (COG or image overlay) of an item.
   */
  const handleTogglePreview = useCallback(
    (item: StacItem): void => {
      const overlayId = getPreviewOverlayId(item.id);
      if (stacController.hasOverlay(overlayId)) {
        stacController.removeOverlay(overlayId);
        setPreviewedIds((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
        return;
      }

      const preview = { ...config.preview, ...config.collectionOverrides?.[item.collection ?? '']?.preview };
      const previewAsset = StacAssetUtils.getPreviewAsset(item, preview);
      const bbox = StacFieldUtils.getBbox(item);
      if (!previewAsset) return;

      if (previewAsset.kind === 'image') {
        if (!bbox) return;
        stacController.addImageOverlay(overlayId, previewAsset.href, bbox, preview.opacity, item.geometry);
        setPreviewedIds((prev) => ({ ...prev, [item.id]: true }));
        return;
      }

      stacController
        .addGeoTiffOverlay(overlayId, previewAsset.href, preview.opacity)
        .then((isAdded) => {
          if (isAdded) setPreviewedIds((prev) => ({ ...prev, [item.id]: true }));
          else stacController.showError('stacBrowser.errorPreview');
        })
        .catch((error: unknown) => {
          logger.logError(`STAC-BROWSER - Failed to preview item ${item.id}`, error);
        });
    },
    [stacController, config.preview, config.collectionOverrides]
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
   * Handles clearing every item selection and map preview.
   */
  const handleClearSelection = useCallback((): void => {
    Object.keys(previewedIds).forEach((itemId) => stacController.removeOverlay(getPreviewOverlayId(itemId)));
    setPreviewedIds({});
    setSelectedItems({});
  }, [stacController, previewedIds]);

  // #endregion

  /**
   * Builds the display options shared by the item cards and the item detail.
   */
  const memoDisplay = useMemo((): StacItemDisplayOptions => {
    logger.logTraceUseMemo('STAC-BROWSER - memoDisplay', isPreviewEnabled);
    return {
      itemView: config.itemView,
      actions: config.actions,
      preview: config.preview,
      footprintStyles: config.footprintStyles,
      collectionOverrides: config.collectionOverrides,
      isPreviewEnabled,
    };
  }, [config.itemView, config.actions, config.preview, config.footprintStyles, config.collectionOverrides, isPreviewEnabled]);

  /**
   * Builds the selection/preview state and callbacks of the item cards.
   */
  const memoInteractions = useMemo((): StacItemInteractions => {
    logger.logTraceUseMemo('STAC-BROWSER - memoInteractions', selectedItems, previewedIds);
    const selectedColors: Record<string, string> = {};
    Object.entries(selectedItems).forEach(([itemId, entry]) => {
      selectedColors[itemId] = entry.color;
    });
    return {
      selectedColors,
      previewedIds,
      onToggleSelected: handleToggleSelected,
      onTogglePreview: handleTogglePreview,
      onZoom: handleZoomToItem,
      onOpenDetail: handleItemClick,
    };
  }, [selectedItems, previewedIds, handleToggleSelected, handleTogglePreview, handleZoomToItem, handleItemClick]);

  const selectedCount = Object.keys(selectedItems).length;
  const previewedCount = Object.keys(previewedIds).length;

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
          onBack={handleBackFromItemDetail}
          onGoToCollection={handleGoToCollection}
        />
      );
    }

    // Collection detail — browse mode
    if (view === 'collection-detail' && selectedCollection) {
      return (
        <StacCollectionDetail
          collection={selectedCollection}
          apiService={memoApiService}
          collections={collections}
          limit={limit}
          sortby={itemsSortBy}
          display={memoDisplay}
          interactions={memoInteractions}
          onCollectionChange={handleCollectionChange}
          onBack={collections.length > 1 ? handleBackToCollections : undefined}
        />
      );
    }

    // Search results — search mode
    if (view === 'search-results' && searchResult) {
      return (
        <>
          {isLoading && (
            <Box sx={memoSxClasses.loading}>
              <Typography>{t('stacBrowser.loading')}</Typography>
            </Box>
          )}
          {!isLoading && searchResult.features.length === 0 && (
            <Box sx={memoSxClasses.noResults}>
              <Typography>{t('stacBrowser.noResults')}</Typography>
            </Box>
          )}
          {!isLoading && searchResult.features.length > 0 && (
            <StacSearchResults
              results={searchResult}
              collections={collections}
              display={memoDisplay}
              interactions={memoInteractions}
              pageSize={limit}
              onBack={handleBackToSearch}
              hasNext={!!nextPageLink}
              hasPrev={currentPage > 1}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
              currentPage={currentPage}
            />
          )}
        </>
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
        <Box sx={memoSxClasses.loading}>
          <Typography>{t('stacBrowser.loading')}</Typography>
        </Box>
      );
    }

    if (collections.length === 0) {
      return (
        <Box sx={memoSxClasses.noResults}>
          <Typography>{t('stacBrowser.noResults')}</Typography>
        </Box>
      );
    }

    return (
      <Box sx={memoSxClasses.panelContent}>
        <StacCollectionList collections={collections} onCollectionClick={handleCollectionClick} />
      </Box>
    );
  };

  return (
    <Box sx={memoSxClasses.mainContainer}>
      {/* Mode toggle — Browse / Search (hide when in item-detail) */}
      {view !== 'item-detail' && (
        <Box sx={memoSxClasses.modeToggle} role="group" aria-label={t('stacBrowser.modeSelector')}>
          <Button
            type="text"
            sx={[memoSxClasses.modeButton, mode === 'browse' && memoSxClasses.modeButtonActive] as SxProps}
            data-mode="browse"
            onClick={handleModeClick}
            aria-pressed={mode === 'browse'}
          >
            {t('stacBrowser.browse')}
          </Button>
          <Button
            type="text"
            sx={[memoSxClasses.modeButton, mode === 'search' && memoSxClasses.modeButtonActive] as SxProps}
            data-mode="search"
            onClick={handleModeClick}
            aria-pressed={mode === 'search'}
          >
            {t('stacBrowser.search')}
          </Button>
        </Box>
      )}

      {/* Selection summary, kept across views so the user can clear the map at any time */}
      <Box role="status" aria-live="polite">
        {(selectedCount > 0 || previewedCount > 0) && (
          <Box sx={memoSxClasses.selectionBar}>
            <Typography sx={memoSxClasses.resultMeta}>
              {t('stacBrowser.selectionSummary', { selected: selectedCount, previewed: previewedCount })}
            </Typography>
            <Button type="text" size="small" onClick={handleClearSelection}>
              {t('stacBrowser.clear')}
            </Button>
          </Box>
        )}
      </Box>

      {renderContent()}
    </Box>
  );
}
