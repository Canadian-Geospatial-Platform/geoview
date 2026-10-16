import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { SxStyles } from 'geoview-core/ui/style/types';
import { Box, Button, CircularProgressBase, Typography } from 'geoview-core/ui';
import { ArrowBackIcon, ArrowForwardIcon } from 'geoview-core/ui/icons';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStacBrowserController } from 'geoview-core/core/controllers/use-controllers';

import type { StacCollection, StacItem, StacItemDisplayOptions, StacItemInteractions, StacSearchResult } from './stac-browser-types';
import { StacConfigUtils } from './stac-config-utils';
import { StacFieldUtils } from './stac-field-utils';
import { StacItemList } from './stac-item-list';
import { getSxClasses } from './stac-browser-style';

/** Geometry group used for the search result footprints. */
const FOOTPRINT_GROUP = 'stac-search-footprints';

/** Props for the StacSearchResults component. */
interface StacSearchResultsProps {
  /** The search result to display. */
  results: StacSearchResult;
  /** Available collections for resolving titles. */
  collections: StacCollection[];
  /** Display options of the item cards. */
  display: StacItemDisplayOptions;
  /** Selection/preview state and callbacks of the item cards. */
  interactions: StacItemInteractions;
  /** Number of items per page. */
  pageSize: number;
  /** Whether a result page request is pending. */
  isLoading: boolean;
  /** Callback to go back to the search panel. */
  onBack: () => void;
  /** Optional callback to restore the map extent captured at search submission. */
  onZoomToSearch?: () => void;
  /** Whether there is a next page of results. */
  hasNext: boolean;
  /** Whether there is a previous page of results. */
  hasPrev: boolean;
  /** Callback to navigate to the next page. */
  onNextPage: () => void;
  /** Callback to navigate to the previous page. */
  onPrevPage: () => void;
  /** Current page number (1-based). */
  currentPage: number;
}

/**
 * Creates the STAC search results component with items grouped by collection.
 *
 * @param props - Properties defined in StacSearchResultsProps interface
 * @returns The search results component
 */
export function StacSearchResults(props: StacSearchResultsProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-search-results');

  const {
    results,
    collections,
    display,
    interactions,
    pageSize,
    isLoading,
    onBack,
    onZoomToSearch,
    hasNext,
    hasPrev,
    onNextPage,
    onPrevPage,
    currentPage,
  } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useMemo } = cgpv.reactUtilities.react;
  const memoSxClasses = useMemo((): SxStyles => getSxClasses(theme), [theme]);

  const stacController = useStacBrowserController();

  /**
   * Shows the footprints of the result items.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-SEARCH-RESULTS - Show footprints', results.features.length);

    stacController.setFootprints(
      FOOTPRINT_GROUP,
      results.features.map((item) => ({
        geometry: item.geometry,
        bbox: item.bbox,
        ...StacConfigUtils.getFootprintStyle(display, item.collection, 'search'),
      }))
    );

    return (): void => {
      stacController.clearFootprints(FOOTPRINT_GROUP);
    };
  }, [stacController, results.features, display]);

  /**
   * Groups items by their collection ID.
   */
  const memoGroupedItems = useMemo((): Map<string, StacItem[]> => {
    logger.logTraceUseMemo('STAC-SEARCH-RESULTS - memoGroupedItems', results.features.length);
    const grouped = new Map<string, StacItem[]>();
    for (const item of results.features) {
      const collectionId = item.collection ?? 'unknown';
      const existing = grouped.get(collectionId);
      if (existing) {
        existing.push(item);
      } else {
        grouped.set(collectionId, [item]);
      }
    }
    return grouped;
  }, [results.features]);

  /**
   * Resolves a collection title from its ID.
   *
   * @param collectionId - The collection ID
   * @returns The collection title or the ID as fallback
   */
  const getCollectionTitle = useCallback(
    (collectionId: string): string => {
      const collection = collections.find((c) => c.id === collectionId);
      return collection ? StacFieldUtils.getCollectionTitle(collection) : collectionId;
    },
    [collections]
  );

  // #region Handlers

  /**
   * Handles navigating to the previous page, ignored while unavailable.
   */
  const handlePrevClick = useCallback((): void => {
    if (isLoading || !hasPrev) return;
    onPrevPage();
  }, [isLoading, hasPrev, onPrevPage]);

  /**
   * Handles navigating to the next page, ignored while unavailable.
   */
  const handleNextClick = useCallback((): void => {
    if (isLoading || !hasNext) return;
    onNextPage();
  }, [isLoading, hasNext, onNextPage]);

  // #endregion

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = startItem + results.features.length - 1;

  return (
    <Box sx={memoSxClasses.panelContent}>
      {/* Back link */}
      <Box sx={memoSxClasses.stickyNav}>
        <Button type="text" size="small" startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack}>
          {t('stacBrowser.backToSearch')}
        </Button>
        {onZoomToSearch && (
          <Button type="text" size="small" onClick={onZoomToSearch}>
            {t('stacBrowser.zoomToSearch')}
          </Button>
        )}
      </Box>

      <Typography component="h3" tabIndex={-1} data-stac-view-focus sx={memoSxClasses.visuallyHidden}>
        {t('stacBrowser.searchResults')}
      </Typography>

      <Box role="status" aria-live="polite">
        {isLoading && (
          <Box sx={memoSxClasses.loading}>
            <CircularProgressBase aria-label={t('stacBrowser.loading')} />
          </Box>
        )}
        {!isLoading && results.features.length === 0 && (
          <Box sx={memoSxClasses.noResults}>
            <Typography>{t('stacBrowser.noResults')}</Typography>
          </Box>
        )}
      </Box>

      <Box sx={memoSxClasses.resultsList}>
        {Array.from(memoGroupedItems.entries()).map(([collectionId, groupItems]) => (
          <Box key={collectionId} sx={memoSxClasses.collectionGroup}>
            {/* Collection header */}
            <Typography component="h4" sx={memoSxClasses.collectionGroupTitle}>
              {getCollectionTitle(collectionId)} ({groupItems.length})
            </Typography>

            {/* Items within collection */}
            <StacItemList items={groupItems} display={display} interactions={interactions} sxClasses={memoSxClasses} />
          </Box>
        ))}

        {/* Both buttons stay rendered so focus is kept when a page boundary is reached */}
        {(hasPrev || hasNext) && (
          <Box sx={memoSxClasses.pagination}>
            <Button
              type="text"
              variant="outlined"
              startIcon={<ArrowBackIcon fontSize="small" />}
              aria-disabled={isLoading || !hasPrev}
              onClick={handlePrevClick}
            >
              {t('stacBrowser.previous')}
            </Button>
            <Button
              type="text"
              variant="outlined"
              endIcon={<ArrowForwardIcon fontSize="small" />}
              aria-disabled={isLoading || !hasNext}
              onClick={handleNextClick}
            >
              {t('stacBrowser.next')}
            </Button>
            {results.features.length > 0 && (
              <Typography role="status" sx={memoSxClasses.pageRange}>
                {t('stacBrowser.itemRange', { start: startItem, end: endItem })}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
