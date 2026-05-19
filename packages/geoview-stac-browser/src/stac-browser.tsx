import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import type { BrowseMode, PanelView, StacBrowserConfig, StacCollection, StacItem, StacSearchResult } from './stac-browser-types';
import { StacApiService } from './stac-api-service';
import { StacFilterPanel } from './stac-filter-panel';
import { StacCollectionList } from './stac-collection-list';
import { StacCollectionDetail } from './stac-collection-detail';
import { StacSearchResults } from './stac-search-results';
import { StacItemDetail } from './stac-item-detail';
import { getSxClasses } from './stac-browser-style';

/** Props for the StacBrowser component. */
interface StacBrowserProps {
  /** Plugin configuration. */
  config: StacBrowserConfig;
  /** The map ID. */
  mapId: string;
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

  const { config, mapId } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useMemo, useState } = cgpv.reactUtilities.react;
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [mode, setMode] = useState<BrowseMode>('browse');
  const [view, setView] = useState<PanelView>('collections');
  const [collections, setCollections] = useState<StacCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<StacCollection | null>(null);
  const [selectedItem, setSelectedItem] = useState<StacItem | null>(null);
  const [searchResult, setSearchResult] = useState<StacSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  /** Tracks which view the item-detail was opened from. */
  const [itemDetailOrigin, setItemDetailOrigin] = useState<PanelView>('collections');

  /** The STAC API service instance. */
  const memoApiService = useMemo((): StacApiService => {
    logger.logTraceUseMemo('STAC-BROWSER - memoApiService', config.stacUrl);
    return new StacApiService(config.stacUrl);
  }, [config.stacUrl]);

  /**
   * Fetches collections on mount.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-BROWSER - Fetch collections on mount');

    let cancelled = false;
    const fetchData = async (): Promise<void> => {
      const result = await memoApiService.fetchCollections();
      if (!cancelled) setCollections(result);
    };
    void fetchData();
    return (): void => {
      cancelled = true;
    };
  }, [memoApiService]);

  // #region Handlers

  /**
   * Handles switching between browse and search modes.
   */
  const handleModeChange = useCallback((newMode: BrowseMode): void => {
    setMode(newMode);
    if (newMode === 'browse') {
      setView('collections');
    } else {
      setView('search');
    }
    // Clear selection when switching modes
    setSelectedItem(null);
    setSelectedCollection(null);
    setSearchResult(null);
  }, []);

  /**
   * Handles clicking on a collection card to view its details.
   */
  const handleCollectionClick = useCallback((collection: StacCollection): void => {
    setSelectedCollection(collection);
    setView('collection-detail');
  }, []);

  /**
   * Handles clicking on an item to view its details.
   */
  const handleItemClick = useCallback(
    (item: StacItem): void => {
      const selfLink = item.links?.find((link) => link.rel === 'self');
      if (selfLink?.href) {
        const doFetch = async (): Promise<void> => {
          const fullItem = await StacApiService.fetchItem(selfLink.href);
          setSelectedItem(fullItem ?? item);
          setItemDetailOrigin(view);
          setView('item-detail');
        };
        void doFetch();
      } else {
        setSelectedItem(item);
        setItemDetailOrigin(view);
        setView('item-detail');
      }
    },
    [view]
  );

  /**
   * Handles search submission from the filter panel.
   */
  const handleSearch = useCallback(
    (params: { collections?: string[]; bbox?: [number, number, number, number]; datetime?: string; q?: string }): void => {
      const doSearch = async (): Promise<void> => {
        try {
          setIsLoading(true);
          setSelectedItem(null);
          logger.logInfo('STAC-BROWSER - Searching with params:', params);

          const result = await memoApiService.searchItems({
            ...params,
            limit: config.defaults?.limit ?? 20,
          });

          logger.logInfo(`STAC-BROWSER - Search returned ${result.features.length} features`);
          setSearchResult(result);
          setNextToken(memoApiService.getNextPageToken(result));
          setView('search-results');
        } catch (error) {
          logger.logError('STAC-BROWSER - Search failed:', error);
        } finally {
          setIsLoading(false);
        }
      };
      void doSearch();
    },
    [memoApiService, config.defaults?.limit]
  );

  /**
   * Handles loading more search results.
   */
  const handleLoadMore = useCallback((): void => {
    if (!nextToken) return;
    const doLoadMore = async (): Promise<void> => {
      setIsLoading(true);
      const result = await memoApiService.searchItems({ token: nextToken, limit: config.defaults?.limit ?? 20 });
      setSearchResult((prev) => {
        if (!prev) return result;
        return { ...result, features: [...prev.features, ...result.features] };
      });
      setNextToken(memoApiService.getNextPageToken(result));
      setIsLoading(false);
    };
    void doLoadMore();
  }, [nextToken, memoApiService, config.defaults?.limit]);

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

  // #endregion

  /**
   * Renders the active view based on the current panel state.
   */
  const renderContent = (): JSX.Element => {
    // Item detail — shared by both modes
    if (view === 'item-detail' && selectedItem) {
      return <StacItemDetail item={selectedItem} mapId={mapId} onBack={handleBackFromItemDetail} onGoToCollection={handleGoToCollection} />;
    }

    // Collection detail — browse mode
    if (view === 'collection-detail' && selectedCollection) {
      return (
        <StacCollectionDetail
          collection={selectedCollection}
          apiService={memoApiService}
          mapId={mapId}
          onItemClick={handleItemClick}
          onBack={handleBackToCollections}
        />
      );
    }

    // Search results — search mode
    if (view === 'search-results' && searchResult) {
      return (
        <>
          {isLoading && (
            <Box sx={sxClasses.loading}>
              <Typography>{t('stacBrowser.loading')}</Typography>
            </Box>
          )}
          {!isLoading && searchResult.features.length === 0 && (
            <Box sx={sxClasses.noResults}>
              <Typography>{t('stacBrowser.noResults')}</Typography>
            </Box>
          )}
          {!isLoading && searchResult.features.length > 0 && (
            <StacSearchResults
              results={searchResult}
              collections={collections}
              onItemClick={handleItemClick}
              onBack={handleBackToSearch}
              hasMore={!!nextToken}
              onLoadMore={handleLoadMore}
            />
          )}
        </>
      );
    }

    // Search panel — search mode
    if (mode === 'search') {
      return (
        <Box sx={sxClasses.panelContent}>
          <StacFilterPanel config={config} onSearch={handleSearch} mapId={mapId} />
        </Box>
      );
    }

    // Default: collections list — browse mode
    if (collections.length === 0) {
      return (
        <Box sx={sxClasses.loading}>
          <Typography>{t('stacBrowser.loading')}</Typography>
        </Box>
      );
    }

    return (
      <Box sx={sxClasses.panelContent}>
        <StacCollectionList collections={collections} onCollectionClick={handleCollectionClick} />
      </Box>
    );
  };

  return (
    <Box sx={sxClasses.mainContainer}>
      {/* Mode toggle — Browse / Search (hide when in item-detail) */}
      {view !== 'item-detail' && (
        <Box sx={sxClasses.modeToggle}>
          <Box
            sx={[sxClasses.modeButton, mode === 'browse' && sxClasses.modeButtonActive]}
            onClick={(): void => handleModeChange('browse')}
            role="tab"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent): void => {
              if (e.key === 'Enter' || e.key === ' ') handleModeChange('browse');
            }}
          >
            {t('stacBrowser.browse')}
          </Box>
          <Box
            sx={[sxClasses.modeButton, mode === 'search' && sxClasses.modeButtonActive]}
            onClick={(): void => handleModeChange('search')}
            role="tab"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent): void => {
              if (e.key === 'Enter' || e.key === ' ') handleModeChange('search');
            }}
          >
            {t('stacBrowser.search')}
          </Box>
        </Box>
      )}

      {renderContent()}
    </Box>
  );
}
