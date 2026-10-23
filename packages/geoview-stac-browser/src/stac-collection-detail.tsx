import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { SxStyles } from 'geoview-core/ui/style/types';
import { Box, Button, Typography } from 'geoview-core/ui';
import { ArrowBackIcon, ArrowForwardIcon } from 'geoview-core/ui/icons';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { GeoUtilities } from 'geoview-core/geo/utils/utilities';
import { useStacBrowserController } from 'geoview-core/core/controllers/use-controllers';
import type { TypeStacStyledFootprint } from 'geoview-core/core/controllers/stac-browser-controller';

import type {
  StacCollection,
  StacFootprintStyleConfig,
  StacItem,
  StacItemDisplayOptions,
  StacItemInteractions,
  StacSortBy,
} from './stac-browser-types';
import { StacApiService } from './stac-api-service';
import { StacConfigUtils } from './stac-config-utils';
import { StacItemList } from './stac-item-list';
import { StacFieldUtils } from './stac-field-utils';
import { getSxClasses } from './stac-browser-style';

/** Geometry group used for the collection and its items footprints. */
const FOOTPRINT_GROUP = 'stac-collection-footprints';

/** Props for the StacCollectionDetail component. */
interface StacCollectionDetailProps {
  /** The collection to display. */
  collection: StacCollection;
  /** The STAC API service instance. */
  apiService: StacApiService;
  /** Number of items per page. */
  limit: number;
  /** Optional sort criteria, only set when the server supports sorting. */
  sortby?: StacSortBy[];
  /** Display options of the item cards. */
  display: StacItemDisplayOptions;
  /** Selection/preview state and callbacks of the item cards. */
  interactions: StacItemInteractions;
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

  const { collection, apiService, limit, sortby, display, interactions, onBack } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useId, useMemo, useRef, useState } = cgpv.reactUtilities.react;
  const memoSxClasses = useMemo((): SxStyles => getSxClasses(theme), [theme]);
  const descriptionId = useId();

  const stacController = useStacBrowserController();
  /**
   * Resolves the collection extent and item footprint styles over package defaults.
   */
  const memoFootprintStyles = useMemo((): Record<'collection' | 'item', Required<StacFootprintStyleConfig>> => {
    logger.logTraceUseMemo('STAC-COLLECTION-DETAIL - memoFootprintStyles', display.footprintStyles, collection.id);
    return {
      collection: StacConfigUtils.getFootprintStyle(display, collection.id, 'collection'),
      item: StacConfigUtils.getFootprintStyle(display, collection.id, 'item'),
    };
  }, [display, collection.id]);

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
  /** Identifies the latest item request so stale responses cannot replace current collection data. */
  const itemsRequestIdRef = useRef(0);

  /**
   * Computes the union bounding box of the collection extent and all loaded items.
   */
  const memoUnionExtent = useMemo((): [number, number, number, number] | undefined => {
    logger.logTraceUseMemo('STAC-COLLECTION-DETAIL - memoUnionExtent', items.length);

    const collBbox = collection.extent?.spatial?.bbox?.[0];
    let union = GeoUtilities.bboxToExtent2D(collBbox);

    for (const item of items) {
      const itemBbox = StacFieldUtils.getBbox(item);
      if (itemBbox) union = GeoUtilities.getExtentUnion(union, itemBbox) as [number, number, number, number] | undefined;
    }

    return union;
  }, [collection.extent, items]);

  /**
   * Shows the collection footprint (union of collection bbox + items) and individual item footprints.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-COLLECTION-DETAIL - Show footprints', items.length);

    const footprints: TypeStacStyledFootprint[] = [];
    if (memoUnionExtent) footprints.push({ bbox: memoUnionExtent, ...memoFootprintStyles.collection });
    items.forEach((item) => footprints.push({ geometry: item.geometry, bbox: item.bbox, ...memoFootprintStyles.item }));
    stacController.setFootprints(FOOTPRINT_GROUP, footprints);

    return (): void => {
      stacController.clearFootprints(FOOTPRINT_GROUP);
    };
  }, [stacController, items, memoUnionExtent, memoFootprintStyles]);

  /**
   * Loads a page of items, from the first page or from a pagination link.
   *
   * @param pageUrl - Optional pagination link URL
   * @returns A promise that resolves when the page is loaded or the error is reported
   */
  const tryLoadItems = useCallback(
    async (pageUrl?: string): Promise<void> => {
      const requestId = ++itemsRequestIdRef.current;
      try {
        setIsLoading(true);
        if (!pageUrl) {
          setItems([]);
          setNextUrl(undefined);
          setPrevUrl(undefined);
          setNumberMatched(undefined);
        }
        const response = await apiService.fetchCollectionItems(collection.id, limit, sortby, pageUrl);
        if (requestId !== itemsRequestIdRef.current) return;
        setItems(response.features);
        setNextUrl(StacApiService.getPageLink(response, 'next')?.href);
        setPrevUrl(StacApiService.getPageLink(response, 'prev')?.href);
        setNumberMatched(response.numberMatched);
      } catch (error: unknown) {
        if (requestId !== itemsRequestIdRef.current) return;
        // UI boundary: report the failed request to the user
        logger.logError(`STAC-COLLECTION-DETAIL - Failed to fetch items for collection ${collection.id}`, error);
        stacController.showError('stacBrowser.errorRequest');
      } finally {
        if (requestId === itemsRequestIdRef.current) setIsLoading(false);
      }
    },
    [apiService, collection.id, limit, sortby, stacController]
  );

  /**
   * Fetches the first page of items when the collection changes.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-COLLECTION-DETAIL - Fetch items on mount', collection.id);
    tryLoadItems().catch((error: unknown) => {
      logger.logPromiseFailed(`STAC-COLLECTION-DETAIL - useEffect - Failed to fetch items for collection ${collection.id}`, error);
    });
    return (): void => {
      itemsRequestIdRef.current += 1;
    };
  }, [collection.id, tryLoadItems]);

  // #region Handlers

  /**
   * Handles navigating to the next page of items.
   */
  const handleNextPage = useCallback((): void => {
    if (isLoading || !nextUrl) return;
    tryLoadItems(nextUrl).catch((error: unknown) => {
      logger.logPromiseFailed(`STAC-COLLECTION-DETAIL - handleNextPage - Failed to fetch items at url ${nextUrl}`, error);
    });
  }, [isLoading, nextUrl, tryLoadItems]);

  /**
   * Handles navigating to the previous page of items.
   */
  const handlePrevPage = useCallback((): void => {
    if (isLoading || !prevUrl) return;
    tryLoadItems(prevUrl).catch((error: unknown) => {
      logger.logPromiseFailed(`STAC-COLLECTION-DETAIL - handlePrevPage - Failed to fetch items at url ${prevUrl}`, error);
    });
  }, [isLoading, prevUrl, tryLoadItems]);

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

  // #endregion

  /**
   * Formats the temporal extent for display.
   */
  const memoTemporalDisplay = useMemo((): string => {
    logger.logTraceUseMemo('STAC-COLLECTION-DETAIL - memoTemporalDisplay', collection.extent);
    return StacFieldUtils.formatTemporalExtent(collection, t('stacBrowser.present'), display.dateDisplay);
  }, [collection, t, display.dateDisplay]);

  const description = collection.description ?? '';
  const isDescLong = description.length > 200;
  const displayDesc = descExpanded || !isDescLong ? description : `${description.substring(0, 200)}...`;

  return (
    <Box sx={memoSxClasses.panelContent}>
      {/* Back link */}
      {onBack && (
        <Box sx={memoSxClasses.backLink}>
          <Button type="text" size="small" startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack}>
            {t('stacBrowser.backToCollections')}
          </Button>
        </Box>
      )}

      {/* Collection Header */}
      <Box sx={memoSxClasses.detailSection}>
        <Typography component="h3" tabIndex={-1} data-stac-view-focus sx={memoSxClasses.detailTitle}>
          {StacFieldUtils.getCollectionTitle(collection)}
        </Typography>

        {/* Description with Read more */}
        {description && (
          <Box>
            <Typography id={descriptionId} sx={memoSxClasses.detailDescription}>
              {displayDesc}
            </Typography>
            {isDescLong && (
              <Button type="text" size="small" aria-expanded={descExpanded} aria-controls={descriptionId} onClick={handleToggleDescription}>
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
        <Typography component="h4" sx={memoSxClasses.itemsSectionTitle}>
          {t('stacBrowser.items')}
          {numberMatched !== undefined ? ` (${numberMatched.toLocaleString(display.dateDisplay.language)})` : ''}
        </Typography>

        <Box role="status" aria-live="polite">
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
            <Typography sx={memoSxClasses.visuallyHidden}>{t('stacBrowser.itemsShown', { count: items.length })}</Typography>
          )}
        </Box>

        {!isLoading && items.length > 0 && (
          <StacItemList items={items} display={display} interactions={interactions} sxClasses={memoSxClasses} />
        )}

        {/* Pagination stays rendered while loading so the focused button is kept */}
        {(prevUrl || nextUrl) && (
          <Box sx={memoSxClasses.paginationBar}>
            <Button
              type="text"
              size="small"
              startIcon={<ArrowBackIcon fontSize="small" />}
              aria-disabled={isLoading || !prevUrl}
              onClick={handlePrevPage}
            >
              {t('stacBrowser.previous')}
            </Button>
            <Button
              type="text"
              size="small"
              endIcon={<ArrowForwardIcon fontSize="small" />}
              aria-disabled={isLoading || !nextUrl}
              onClick={handleNextPage}
            >
              {t('stacBrowser.next')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
