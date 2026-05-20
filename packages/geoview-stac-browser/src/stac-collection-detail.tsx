import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { GeoUtilities } from 'geoview-core/geo/utils/utilities';
import { StacLayerHelper } from 'geoview-core/geo/utils/stac-layer-helper';

import type { StacCollection, StacItem } from './stac-browser-types';
import { COLLECTION_COLOR, ITEM_COLOR, StacApiService } from './stac-api-service';
import { getSxClasses } from './stac-browser-style';

/** Props for the StacCollectionDetail component. */
interface StacCollectionDetailProps {
  /** The collection to display. */
  collection: StacCollection;
  /** The STAC API service instance. */
  apiService: StacApiService;
  /** The map ID. */
  mapId: string;
  /** Callback when an item is clicked. */
  onItemClick: (item: StacItem) => void;
  /** Callback to go back to the collections list. */
  onBack: () => void;
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

  const { collection, apiService, mapId, onItemClick, onBack } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useMemo, useState } = cgpv.reactUtilities.react;
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const mapViewer = cgpv.api.getMapViewer(mapId);
  const olMap = mapViewer.map;
  const geometryApi = mapViewer.geometry;

  /** Items for the current page. */
  const [items, setItems] = useState<StacItem[]>([]);
  /** Whether items are loading. */
  const [isLoading, setIsLoading] = useState(false);
  /** Next page URL for pagination. */
  const [nextUrl, setNextUrl] = useState<string | undefined>(undefined);
  /** Previous page URL for pagination. */
  const [prevUrl, setPrevUrl] = useState<string | undefined>(undefined);
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
          | [number, number, number, number]
          | undefined;
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
    StacLayerHelper.clearFootprints(geometryApi, 'stac-collection-footprints');

    // Draw collection footprint with union extent (blue)
    if (memoUnionExtent) {
      StacLayerHelper.addFootprintLayer(geometryApi, { bbox: memoUnionExtent }, COLLECTION_COLOR, 0.08, 'stac-collection-footprints');
    }

    // Draw individual item footprints (orange)
    for (const item of items) {
      if (item.geometry) {
        StacLayerHelper.addFootprintLayer(geometryApi, { geometry: item.geometry }, ITEM_COLOR, 0.15, 'stac-collection-footprints');
      } else if (item.bbox && item.bbox.length >= 4) {
        StacLayerHelper.addFootprintLayer(
          geometryApi,
          { bbox: [item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3]] },
          ITEM_COLOR,
          0.15,
          'stac-collection-footprints'
        );
      }
    }

    return (): void => {
      StacLayerHelper.clearFootprints(geometryApi, 'stac-collection-footprints');
    };
  }, [geometryApi, items, memoUnionExtent]);

  /**
   * Fetches items for the collection on mount.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-COLLECTION-DETAIL - Fetch items on mount', collection.id);

    let cancelled = false;
    const fetchItems = async (): Promise<void> => {
      setIsLoading(true);
      const response = await apiService.fetchCollectionItems(collection.id, 10);
      if (!cancelled) {
        setItems(response.features);
        setNextUrl(StacApiService.getNextPageUrl(response));
        setPrevUrl(StacApiService.getPrevPageUrl(response));
        setIsLoading(false);
      }
    };
    void fetchItems();
    return (): void => {
      cancelled = true;
    };
  }, [apiService, collection.id]);

  // #region Handlers

  /**
   * Handles navigating to the next page of items.
   */
  const handleNextPage = useCallback((): void => {
    if (!nextUrl) return;
    const doFetch = async (): Promise<void> => {
      setIsLoading(true);
      const response = await apiService.fetchCollectionItems(collection.id, undefined, nextUrl);
      setItems(response.features);
      setNextUrl(StacApiService.getNextPageUrl(response));
      setPrevUrl(StacApiService.getPrevPageUrl(response));
      setIsLoading(false);
    };
    void doFetch();
  }, [nextUrl, apiService, collection.id]);

  /**
   * Handles navigating to the previous page of items.
   */
  const handlePrevPage = useCallback((): void => {
    if (!prevUrl) return;
    const doFetch = async (): Promise<void> => {
      setIsLoading(true);
      const response = await apiService.fetchCollectionItems(collection.id, undefined, prevUrl);
      setItems(response.features);
      setNextUrl(StacApiService.getNextPageUrl(response));
      setPrevUrl(StacApiService.getPrevPageUrl(response));
      setIsLoading(false);
    };
    void doFetch();
  }, [prevUrl, apiService, collection.id]);

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
    if (memoUnionExtent) {
      const extent = StacLayerHelper.transformBboxToMapProjection(mapId, memoUnionExtent);
      void olMap.getView().fit(extent, { maxZoom: 12, duration: 500, padding: [100, 100, 100, 100] });
    }
  }, [mapId, olMap, memoUnionExtent]);

  /**
   * Handles click on an item card.
   */
  const handleItemCardClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      const { itemId } = event.currentTarget.dataset;
      const item = items.find((i) => i.id === itemId);
      if (item) onItemClick(item);
    },
    [items, onItemClick]
  );

  /**
   * Handles keyboard activation on an item card.
   */
  const handleItemCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const { itemId } = event.currentTarget.dataset;
        const item = items.find((i) => i.id === itemId);
        if (item) onItemClick(item);
      }
    },
    [items, onItemClick]
  );

  // #endregion

  /**
   * Formats the temporal extent for display.
   */
  const memoTemporalDisplay = useMemo((): string => {
    logger.logTraceUseMemo('STAC-COLLECTION-DETAIL - memoTemporalDisplay', collection.extent);
    return StacApiService.formatTemporalExtent(collection);
  }, [collection]);

  /**
   * Gets the asset type badge for an item (e.g., "COG").
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

  const description = collection.description ?? '';
  const isDescLong = description.length > 200;
  const displayDesc = descExpanded || !isDescLong ? description : `${description.substring(0, 200)}...`;

  return (
    <Box sx={sxClasses.panelContent}>
      {/* Back link */}
      <Box sx={sxClasses.backLink}>
        <Button type="text" size="small" onClick={onBack}>
          ← {t('stacBrowser.backToCollections')}
        </Button>
      </Box>

      {/* Collection Header */}
      <Box sx={sxClasses.detailSection}>
        <Typography sx={sxClasses.detailTitle}>{collection.title ?? collection.id}</Typography>

        {/* Description with Read more */}
        {description && (
          <Box>
            <Typography sx={sxClasses.detailDescription}>{displayDesc}</Typography>
            {isDescLong && (
              <Button type="text" size="small" onClick={handleToggleDescription}>
                {descExpanded ? t('stacBrowser.readLess') : t('stacBrowser.readMore')}
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Metadata Section */}
      <Box sx={sxClasses.metadataSection}>
        {/* Keywords */}
        {collection.keywords && collection.keywords.length > 0 && (
          <Box sx={sxClasses.metadataRow}>
            <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.keywords')}</Typography>
            <Box sx={sxClasses.keywordChipsRow}>
              {collection.keywords.map((keyword) => (
                <Box key={keyword} component="span" sx={sxClasses.keywordChip}>
                  {keyword}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* License */}
        {collection.license && (
          <Box sx={sxClasses.metadataRow}>
            <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.license')}</Typography>
            <Typography sx={sxClasses.resultMeta}>{collection.license}</Typography>
          </Box>
        )}

        {/* Temporal extent */}
        {memoTemporalDisplay && (
          <Box sx={sxClasses.metadataRow}>
            <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.temporal')}</Typography>
            <Typography sx={sxClasses.resultMeta}>{memoTemporalDisplay}</Typography>
          </Box>
        )}

        {/* Zoom to collection extent */}
        {memoUnionExtent && (
          <Button type="text" variant="outlined" size="small" onClick={handleZoomToExtent} sx={sxClasses.zoomButton}>
            {t('stacBrowser.zoomToExtent')}
          </Button>
        )}
      </Box>

      {/* Items Section */}
      <Box sx={sxClasses.detailSection}>
        <Typography sx={sxClasses.itemsSectionTitle}>{t('stacBrowser.items')}</Typography>

        {isLoading && (
          <Box sx={sxClasses.loading}>
            <Typography>{t('stacBrowser.loading')}</Typography>
          </Box>
        )}

        {!isLoading && items.length === 0 && (
          <Box sx={sxClasses.noResults}>
            <Typography>{t('stacBrowser.noResults')}</Typography>
          </Box>
        )}

        {!isLoading &&
          items.map((item) => {
            const thumbnailUrl = getThumbnailUrl(item);
            const badge = getAssetTypeBadge(item);
            const datetime = item.properties.datetime ?? item.properties.start_datetime;
            return (
              <Box
                key={item.id}
                data-item-id={item.id}
                sx={sxClasses.itemRow}
                onClick={handleItemCardClick}
                onKeyDown={handleItemCardKeyDown}
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

        {/* Pagination */}
        {!isLoading && (prevUrl || nextUrl) && (
          <Box sx={sxClasses.paginationBar}>
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
