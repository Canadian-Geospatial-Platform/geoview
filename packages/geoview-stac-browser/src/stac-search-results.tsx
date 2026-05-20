import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import type { StacCollection, StacItem, StacSearchResult } from './stac-browser-types';
import { getSxClasses } from './stac-browser-style';

/** Props for the StacSearchResults component. */
interface StacSearchResultsProps {
  /** The search result to display. */
  results: StacSearchResult;
  /** Available collections for resolving titles. */
  collections: StacCollection[];
  /** Callback when an item is clicked. */
  onItemClick: (item: StacItem) => void;
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

  const { results, collections, onItemClick, onBack, hasNext, hasPrev, onNextPage, onPrevPage, currentPage } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useMemo } = cgpv.reactUtilities.react;
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

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

  // #region Handlers

  /**
   * Handles click on an item card.
   */
  const handleItemClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      const { itemId } = event.currentTarget.dataset;
      const item = results.features.find((i) => i.id === itemId);
      if (item) onItemClick(item);
    },
    [results.features, onItemClick]
  );

  /**
   * Handles keyboard activation on an item card.
   */
  const handleItemKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const { itemId } = event.currentTarget.dataset;
        const item = results.features.find((i) => i.id === itemId);
        if (item) onItemClick(item);
      }
    },
    [results.features, onItemClick]
  );

  // #endregion

  /**
   * Gets the thumbnail URL from item assets.
   *
   * @param item - The STAC item
   * @returns The thumbnail URL, or undefined
   */
  const getThumbnailUrl = useCallback((item: StacItem): string | undefined => {
    if (!item.assets) return undefined;
    const thumbnail = Object.values(item.assets).find((asset) => asset.roles?.includes('thumbnail'));
    return thumbnail?.href;
  }, []);

  /**
   * Gets the asset type badge for an item.
   *
   * @param item - The STAC item
   * @returns The asset type label
   */
  const getAssetTypeBadge = useCallback((item: StacItem): string => {
    if (!item.assets) return '';
    const dataAsset = Object.values(item.assets).find((a) => a.roles?.includes('data'));
    if (dataAsset?.type?.includes('geotiff') || dataAsset?.type?.includes('tiff')) return 'COG';
    return '';
  }, []);

  return (
    <Box sx={sxClasses.panelContent}>
      {/* Back link */}
      <Box sx={sxClasses.backLink}>
        <Button type="text" size="small" onClick={onBack}>
          ← {t('stacBrowser.backToSearch')}
        </Button>
      </Box>

      <Box sx={sxClasses.resultsList}>
        {Array.from(memoGroupedItems.entries()).map(([collectionId, groupItems]) => (
          <Box key={collectionId} sx={sxClasses.collectionGroup}>
            {/* Collection header */}
            <Typography sx={sxClasses.collectionGroupTitle}>
              {getCollectionTitle(collectionId)} ({groupItems.length})
            </Typography>

            {/* Items within collection */}
            {groupItems.map((item) => {
              const thumbnailUrl = getThumbnailUrl(item);
              const badge = getAssetTypeBadge(item);
              const datetime = item.properties.datetime ?? item.properties.start_datetime;
              return (
                <Box
                  key={item.id}
                  data-item-id={item.id}
                  sx={sxClasses.itemRow}
                  onClick={handleItemClick}
                  onKeyDown={handleItemKeyDown}
                  role="button"
                  tabIndex={0}
                >
                  {thumbnailUrl && <Box component="img" src={thumbnailUrl} alt={item.id} sx={sxClasses.itemThumbnail} />}
                  <Box sx={sxClasses.itemRowText}>
                    <Typography sx={sxClasses.resultTitle}>{item.properties.title ?? item.id}</Typography>
                    <Typography sx={sxClasses.resultMeta}>
                      {badge && (
                        <Box component="span" sx={sxClasses.assetTypeBadge}>
                          {badge}
                        </Box>
                      )}
                      {datetime ? new Date(datetime).toLocaleDateString() : ''}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}

        {(hasPrev || hasNext) &&
          (() => {
            const pageSize = 20;
            const startItem = (currentPage - 1) * pageSize + 1;
            const endItem = startItem + results.features.length - 1;
            return (
              <Box sx={sxClasses.pagination}>
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
