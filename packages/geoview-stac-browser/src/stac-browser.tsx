import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import type { StacBrowserConfig, StacCollection, StacItem, StacSearchResult } from './stac-browser-types';
import { StacApiService } from './stac-api-service';
import { StacFilterPanel } from './stac-filter-panel';
import { StacResultsList } from './stac-results-list';
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

  // State
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

  /**
   * Handles search submission from the filter panel.
   */
  const handleSearch = useCallback(
    (params: { collections?: string[]; bbox?: [number, number, number, number]; datetime?: string }): void => {
      const doSearch = async (): Promise<void> => {
        setIsLoading(true);
        setSelectedItem(null);
        const result = await memoApiService.searchItems({
          ...params,
          limit: config.defaults?.limit ?? 20,
        });
        setSearchResult(result);
        setNextToken(memoApiService.getNextPageToken(result));
        setIsLoading(false);
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
  const handleItemClick = useCallback((item: StacItem): void => {
    setSelectedItem(item);
  }, []);

  /**
   * Handles going back from item detail to results list.
   */
  const handleBack = useCallback((): void => {
    setSelectedItem(null);
  }, []);

  // Render detail view
  if (selectedItem) {
    return <StacItemDetail item={selectedItem} mapId={mapId} onBack={handleBack} />;
  }

  // Render browse view
  return (
    <Box sx={sxClasses.mainContainer}>
      <StacFilterPanel collections={collections} config={config} onSearch={handleSearch} mapId={mapId} />
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
        <StacResultsList items={searchResult.features} onItemClick={handleItemClick} hasMore={!!nextToken} onLoadMore={handleLoadMore} />
      )}
    </Box>
  );
}
