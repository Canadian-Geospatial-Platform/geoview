import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, Divider, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { StacLayerHelper } from 'geoview-core/geo/utils/stac-layer-helper';

import type { StacBrowserConfig, StacCollection, StacItem, StacSearchResult } from './stac-browser-types';
import { StacApiService } from './stac-api-service';
import { StacFilterPanel } from './stac-filter-panel';
import { StacResultsList } from './stac-results-list';
import { StacItemDetail } from './stac-item-detail';
import { getSxClasses } from './stac-browser-style';

/** The three possible panel views. */
type PanelView = 'search' | 'results' | 'detail';

/** Props for the StacBrowser component. */
interface StacBrowserProps {
  /** Plugin configuration. */
  config: StacBrowserConfig;
  /** The map ID. */
  mapId: string;
}

/**
 * Creates the STAC browser main component.
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
  const sxClasses = getSxClasses(theme);

  // Get the OL map reference once at component level
  const olMap = cgpv.api.getMapViewer(mapId).map;

  // State
  const [view, setView] = useState<PanelView>('search');
  const [collections, setCollections] = useState<StacCollection[]>([]);
  const [searchResult, setSearchResult] = useState<StacSearchResult | null>(null);
  const [selectedItem, setSelectedItem] = useState<StacItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);

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
          setView('results');
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
   * Handles loading the next page of results.
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
   * Handles clicking on a result item to show its details.
   */
  const handleItemClick = useCallback(
    (item: StacItem): void => {
      // Fetch the full item (search results often omit assets)
      const selfLink = item.links?.find((link) => link.rel === 'self');
      if (selfLink?.href) {
        const doFetch = async (): Promise<void> => {
          const fullItem = await memoApiService.fetchItem(selfLink.href);
          setSelectedItem(fullItem ?? item);
          setView('detail');
        };
        void doFetch();
      } else {
        setSelectedItem(item);
        setView('detail');
      }
    },
    [memoApiService]
  );

  /**
   * Handles going back to the search panel.
   */
  const handleBackToSearch = useCallback((): void => {
    setView('search');
  }, []);

  /**
   * Handles going back to the results list.
   */
  const handleBackToResults = useCallback((): void => {
    setSelectedItem(null);
    setView('results');
  }, []);

  /**
   * Handles clearing all STAC layers from the map and resetting toggle states.
   */
  const handleClearMap = useCallback((): void => {
    StacLayerHelper.removeAllStacBrowserLayers(olMap);
    setSelectedItem(null);
    setView('search');
  }, [olMap]);

  // #endregion

  /**
   * Renders the active view based on the current panel state.
   */
  const renderContent = (): JSX.Element => {
    if (view === 'detail' && selectedItem) {
      return <StacItemDetail item={selectedItem} mapId={mapId} onBackToResults={handleBackToResults} onBackToSearch={handleBackToSearch} />;
    }

    if (view === 'results') {
      return (
        <Box sx={sxClasses.panelContent}>
          {/* Back link */}
          <Box sx={sxClasses.backLink}>
            <Button type="text" size="small" onClick={handleBackToSearch}>
              ← {t('stacBrowser.backToSearch')}
            </Button>
          </Box>

          {isLoading && (
            <Box sx={sxClasses.loading}>
              <Typography>{t('stacBrowser.loading')}</Typography>
            </Box>
          )}
          {!isLoading && searchResult && searchResult.features.length === 0 && (
            <Box sx={sxClasses.noResults}>
              <Typography>{t('stacBrowser.noResults')}</Typography>
            </Box>
          )}
          {!isLoading && searchResult && searchResult.features.length > 0 && (
            <StacResultsList
              items={searchResult.features}
              onItemClick={handleItemClick}
              hasMore={!!nextToken}
              onLoadMore={handleLoadMore}
            />
          )}
        </Box>
      );
    }

    // Default: search view
    return (
      <Box sx={sxClasses.panelContent}>
        <StacFilterPanel collections={collections} config={config} onSearch={handleSearch} mapId={mapId} />
      </Box>
    );
  };

  return (
    <Box sx={sxClasses.mainContainer}>
      {renderContent()}

      {/* Clear Map button — always visible at the bottom */}
      <Box sx={sxClasses.clearMapFooter}>
        <Divider />
        <Button type="text" variant="outlined" color="error" size="small" onClick={handleClearMap} sx={{ margin: '12px' }}>
          {t('stacBrowser.clearMap')}
        </Button>
      </Box>
    </Box>
  );
}
