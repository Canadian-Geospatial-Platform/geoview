import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, Select, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { GeoUtilities } from 'geoview-core/geo/utils/utilities';
import { useStacBrowserController } from 'geoview-core/core/controllers/use-controllers';

import type {
  StacCollection,
  StacFootprintStyleConfig,
  StacItem,
  StacItemDisplayOptions,
  StacItemInteractions,
  StacSortBy,
} from './stac-browser-types';
import { COLLECTION_COLOR, COLLECTION_FILL_OPACITY, ITEM_COLOR, StacApiService } from './stac-api-service';
import { StacItemList } from './stac-item-list';
import { getSxClasses } from './stac-browser-style';

/** Geometry group used for the collection and its items footprints. */
const FOOTPRINT_GROUP = 'stac-collection-footprints';

/** Props for the StacCollectionDetail component. */
interface StacCollectionDetailProps {
  /** The collection to display. */
  collection: StacCollection;
  /** The STAC API service instance. */
  apiService: StacApiService;
  /** Collections that can be selected without leaving the items view. */
  collections: StacCollection[];
  /** Number of items per page. */
  limit: number;
  /** Optional sort criteria, only set when the server supports sorting. */
  sortby?: StacSortBy[];
  /** Display options of the item cards. */
  display: StacItemDisplayOptions;
  /** Selection/preview state and callbacks of the item cards. */
  interactions: StacItemInteractions;
  /** Callback to switch to another collection. */
  onCollectionChange: (collectionId: string) => void;
  /** Optional callback to go back to the collections list, hidden when undefined. */
  onBack?: () => void;
}

/**
 * Creates the STAC collection detail component with metadata, footprints, and paginated items.
 *
 * @param props - Properties defined in StacCollectionDetailProps interface
 * @returns The collection detail component
 */
export function StacCollectionDetail(props: StacCollectionDetailProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-collection-detail');

  const { collection, apiService, collections, limit, sortby, display, interactions, onCollectionChange, onBack } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useMemo, useState } = cgpv.reactUtilities.react;
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const stacController = useStacBrowserController();
  /**
   * Resolves the collection-specific footprint style over package defaults.
   */
  const memoCollectionFootprintStyle = useMemo((): StacFootprintStyleConfig => {
    logger.logTraceUseMemo('STAC-COLLECTION-DETAIL - memoCollectionFootprintStyle', display.footprintStyles, collection.id);
    return {
      ...display.footprintStyles?.collection,
      ...display.collectionOverrides?.[collection.id]?.footprintStyles?.collection,
    };
  }, [display.footprintStyles, display.collectionOverrides, collection.id]);
  const collectionItemFootprintStyle = display.collectionOverrides?.[collection.id]?.footprintStyles?.collection;

  /** Items for the current page. */
  const [items, setItems] = useState<StacItem[]>([]);
  /** Whether items are loading. */
  const [isLoading, setIsLoading] = useState(false);
  /** Next page URL for pagination. */
  const [nextUrl, setNextUrl] = useState<string | undefined>(undefined);
  /** Previous page URL for pagination. */
  const [prevUrl, setPrevUrl] = useState<string | undefined>(undefined);
  /** Total number of items matched by the server, when reported. */
  const [numberMatched, setNumberMatched] = useState<number | undefined>(undefined);
  /** Whether the description is expanded. */
  const [descExpanded, setDescExpanded] = useState(false);

  /**
   * Computes the union bounding box of the collection extent and all loaded items.
   */
  const memoUnionExtent = useMemo((): [number, number, number, number] | null => {
    logger.logTraceUseMemo('STAC-COLLECTION-DETAIL - memoUnionExtent', items.length);

    const collBbox = collection.extent?.spatial?.bbox?.[0];
    let union = collBbox ? ([collBbox[0], collBbox[1], collBbox[2], collBbox[3]] as [number, number, number, number]) : undefined;

    for (const item of items) {
      const iBbox = item.bbox;
      if (iBbox && iBbox.length >= 4) {
        union = GeoUtilities.getExtentUnion(union, [iBbox[0], iBbox[1], iBbox[2], iBbox[3]]) as
          [number, number, number, number] | undefined;
      }
    }

    return union ?? null;
  }, [collection.extent, items]);

  /**
   * Shows the collection footprint (union of collection bbox + items) and individual item footprints.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-COLLECTION-DETAIL - Show footprints', items.length);

    // Clean previous footprints
    stacController.clearFootprints(FOOTPRINT_GROUP);

    // Draw collection footprint with union extent (blue)
    if (memoUnionExtent) {
      stacController.addFootprints(
        FOOTPRINT_GROUP,
        [{ bbox: memoUnionExtent }],
        memoCollectionFootprintStyle.color ?? COLLECTION_COLOR,
        memoCollectionFootprintStyle.fillOpacity ?? COLLECTION_FILL_OPACITY
      );
    }

    // Use a collection-specific style for its item footprints, falling back to orange item styling.
    stacController.addFootprints(
      FOOTPRINT_GROUP,
      items,
      collectionItemFootprintStyle?.color ?? ITEM_COLOR,
      collectionItemFootprintStyle?.fillOpacity ?? 0.15
    );

    return (): void => {
      stacController.clearFootprints(FOOTPRINT_GROUP);
    };
  }, [stacController, items, memoUnionExtent, memoCollectionFootprintStyle, collectionItemFootprintStyle]);

  /**
   * Loads a page of items, from the first page or from a pagination link.
   *
   * @param pageUrl - Optional pagination link URL
   * @returns A promise that resolves when the page is loaded or the error is reported
   */
  const loadItems = useCallback(
    async (pageUrl?: string): Promise<void> => {
      try {
        setIsLoading(true);
        if (!pageUrl) {
          setItems([]);
          setNextUrl(undefined);
          setPrevUrl(undefined);
          setNumberMatched(undefined);
        }
        const response = await apiService.fetchCollectionItems(collection.id, limit, sortby, pageUrl);
        setItems(response.features);
        setNextUrl(StacApiService.getPageLink(response, 'next')?.href);
        setPrevUrl(StacApiService.getPageLink(response, 'prev')?.href);
        setNumberMatched(response.numberMatched);
      } catch (error: unknown) {
        // UI boundary: report the failed request to the user
        logger.logError(`STAC-COLLECTION-DETAIL - Failed to fetch items for collection ${collection.id}`, error);
        stacController.showError('stacBrowser.errorRequest');
      } finally {
        setIsLoading(false);
      }
    },
    [apiService, collection.id, limit, sortby, stacController]
  );

  /**
   * Fetches the first page of items when the collection changes.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-COLLECTION-DETAIL - Fetch items on mount', collection.id);
    void loadItems();
  }, [collection.id, loadItems]);

  // #region Handlers

  /**
   * Handles navigating to the next page of items.
   */
  const handleNextPage = useCallback((): void => {
    if (nextUrl) void loadItems(nextUrl);
  }, [nextUrl, loadItems]);

  /**
   * Handles navigating to the previous page of items.
   */
  const handlePrevPage = useCallback((): void => {
    if (prevUrl) void loadItems(prevUrl);
  }, [prevUrl, loadItems]);

  /**
   * Handles toggling the description expanded state.
   */
  const handleToggleDescription = useCallback((): void => {
    setDescExpanded((prev) => !prev);
  }, []);

  /**
   * Handles zoom to the collection spatial extent (union of collection bbox + loaded items).
   */
  const handleZoomToExtent = useCallback((): void => {
    if (!memoUnionExtent) return;
    stacController.zoomToLonLatBbox(memoUnionExtent).catch((error: unknown) => {
      logger.logError('STAC-COLLECTION-DETAIL - Failed to zoom to collection extent', error);
    });
  }, [stacController, memoUnionExtent]);

  /**
   * Handles switching the active collection from the item browser.
   */
  const handleCollectionChange = useCallback(
    (event: { target: { value: unknown } }): void => {
      if (typeof event.target.value === 'string') onCollectionChange(event.target.value);
    },
    [onCollectionChange]
  );

  // #endregion

  /**
   * Formats the temporal extent for display.
   */
  const memoTemporalDisplay = useMemo((): string => {
    logger.logTraceUseMemo('STAC-COLLECTION-DETAIL - memoTemporalDisplay', collection.extent);
    return StacApiService.formatTemporalExtent(collection);
  }, [collection]);

  const description = collection.description ?? '';
  const isDescLong = description.length > 200;
  const displayDesc = descExpanded || !isDescLong ? description : `${description.substring(0, 200)}...`;

  return (
    <Box sx={memoSxClasses.panelContent}>
      {/* Back link */}
      {onBack && (
        <Box sx={memoSxClasses.backLink}>
          <Button type="text" size="small" onClick={onBack}>
            ← {t('stacBrowser.backToCollections')}
          </Button>
        </Box>
      )}

      {/* Collection Header */}
      <Box sx={memoSxClasses.detailSection}>
        {collections.length > 1 ? (
          <Select
            aria-label={t('stacBrowser.collection')}
            value={collection.id}
            onChange={handleCollectionChange}
            fullWidth
            menuItems={collections.map((entry) => ({ item: { value: entry.id, children: entry.title ?? entry.id } }))}
          />
        ) : (
          <Typography sx={memoSxClasses.detailTitle}>{collection.title ?? collection.id}</Typography>
        )}

        {/* Description with Read more */}
        {description && (
          <Box>
            <Typography sx={memoSxClasses.detailDescription}>{displayDesc}</Typography>
            {isDescLong && (
              <Button type="text" size="small" onClick={handleToggleDescription}>
                {descExpanded ? t('stacBrowser.readLess') : t('stacBrowser.readMore')}
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Metadata Section */}
      <Box sx={memoSxClasses.metadataSection}>
        {/* Keywords */}
        {collection.keywords && collection.keywords.length > 0 && (
          <Box sx={memoSxClasses.metadataRow}>
            <Typography sx={memoSxClasses.metadataLabel}>{t('stacBrowser.keywords')}</Typography>
            <Box sx={memoSxClasses.keywordChipsRow}>
              {collection.keywords.map((keyword) => (
                <Box key={keyword} component="span" sx={memoSxClasses.keywordChip}>
                  {keyword}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* License */}
        {collection.license && (
          <Box sx={memoSxClasses.metadataRow}>
            <Typography sx={memoSxClasses.metadataLabel}>{t('stacBrowser.license')}</Typography>
            <Typography sx={memoSxClasses.resultMeta}>{collection.license}</Typography>
          </Box>
        )}

        {/* Temporal extent */}
        {memoTemporalDisplay && (
          <Box sx={memoSxClasses.metadataRow}>
            <Typography sx={memoSxClasses.metadataLabel}>{t('stacBrowser.temporal')}</Typography>
            <Typography sx={memoSxClasses.resultMeta}>{memoTemporalDisplay}</Typography>
          </Box>
        )}

        {/* Zoom to collection extent */}
        {memoUnionExtent && (
          <Button type="text" variant="outlined" size="small" onClick={handleZoomToExtent} sx={memoSxClasses.zoomButton}>
            {t('stacBrowser.zoomToExtent')}
          </Button>
        )}
      </Box>

      {/* Items Section */}
      <Box sx={memoSxClasses.detailSection}>
        <Typography sx={memoSxClasses.itemsSectionTitle}>
          {t('stacBrowser.items')}
          {numberMatched !== undefined ? ` (${numberMatched.toLocaleString()})` : ''}
        </Typography>

        {isLoading && (
          <Box sx={memoSxClasses.loading}>
            <Typography>{t('stacBrowser.loading')}</Typography>
          </Box>
        )}

        {!isLoading && items.length === 0 && (
          <Box sx={memoSxClasses.noResults}>
            <Typography>{t('stacBrowser.noResults')}</Typography>
          </Box>
        )}

        {!isLoading && items.length > 0 && (
          <StacItemList items={items} display={display} interactions={interactions} sxClasses={memoSxClasses} />
        )}

        {/* Pagination */}
        {!isLoading && (prevUrl || nextUrl) && (
          <Box sx={memoSxClasses.paginationBar}>
            <Button type="text" size="small" disabled={!prevUrl} onClick={handlePrevPage}>
              ← {t('stacBrowser.previous')}
            </Button>
            <Button type="text" size="small" disabled={!nextUrl} onClick={handleNextPage}>
              {t('stacBrowser.next')} →
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
