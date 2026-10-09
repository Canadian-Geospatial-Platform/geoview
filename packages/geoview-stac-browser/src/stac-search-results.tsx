import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStacBrowserController } from 'geoview-core/core/controllers/use-controllers';

import type { StacCollection, StacItem, StacItemDisplayOptions, StacItemInteractions, StacSearchResult } from './stac-browser-types';
import { ITEM_COLOR, SEARCH_FILL_OPACITY } from './stac-api-service';
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
  /** Callback to go back to the search panel. */
  onBack: () => void;
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

  const { results, collections, display, interactions, pageSize, onBack, hasNext, hasPrev, onNextPage, onPrevPage, currentPage } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useMemo } = cgpv.reactUtilities.react;
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const stacController = useStacBrowserController();

  /**
   * Shows the footprints of the result items.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-SEARCH-RESULTS - Show footprints', results.features.length);

    stacController.clearFootprints(FOOTPRINT_GROUP);
    results.features.forEach((item) => {
      const overrideFootprintStyles = display.collectionOverrides?.[item.collection ?? '']?.footprintStyles;
      const searchFootprintStyle = {
        ...display.footprintStyles?.search,
        ...(overrideFootprintStyles?.search ?? overrideFootprintStyles?.collection),
      };
      stacController.addFootprints(
        FOOTPRINT_GROUP,
        [item],
        searchFootprintStyle?.color ?? ITEM_COLOR,
        searchFootprintStyle?.fillOpacity ?? SEARCH_FILL_OPACITY
      );
    });

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
      return collection?.title ?? collectionId;
    },
    [collections]
  );

  return (
    <Box sx={memoSxClasses.panelContent}>
      {/* Back link */}
      <Box sx={memoSxClasses.backLink}>
        <Button type="text" size="small" onClick={onBack}>
          ← {t('stacBrowser.backToSearch')}
        </Button>
      </Box>

      <Box sx={memoSxClasses.resultsList}>
        {Array.from(memoGroupedItems.entries()).map(([collectionId, groupItems]) => (
          <Box key={collectionId} sx={memoSxClasses.collectionGroup}>
            {/* Collection header */}
            <Typography sx={memoSxClasses.collectionGroupTitle}>
              {getCollectionTitle(collectionId)} ({groupItems.length})
            </Typography>

            {/* Items within collection */}
            <StacItemList items={groupItems} display={display} interactions={interactions} sxClasses={memoSxClasses} />
          </Box>
        ))}

        {(hasPrev || hasNext) &&
          (() => {
            const startItem = (currentPage - 1) * pageSize + 1;
            const endItem = startItem + results.features.length - 1;
            return (
              <Box sx={memoSxClasses.pagination}>
                {hasPrev && (
                  <Button type="text" variant="outlined" onClick={onPrevPage}>
                    ← {t('stacBrowser.previous')}
                  </Button>
                )}
                {hasNext && (
                  <Button type="text" variant="outlined" onClick={onNextPage}>
                    {t('stacBrowser.next')} →
                  </Button>
                )}
                <Typography sx={{ marginLeft: 'auto', alignSelf: 'center', fontSize: '0.85rem' }}>
                  {startItem}–{endItem}
                </Typography>
              </Box>
            );
          })()}
      </Box>
    </Box>
  );
}
