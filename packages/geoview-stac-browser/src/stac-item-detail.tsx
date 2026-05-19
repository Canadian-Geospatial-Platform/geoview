import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { StacLayerHelper } from 'geoview-core/geo/utils/stac-layer-helper';

import type { StacItem, StacAsset } from './stac-browser-types';
import { getSxClasses } from './stac-browser-style';

/** Color for item-level footprint. */
const ITEM_COLOR = '#FF8C00';

/** Props for the StacItemDetail component. */
interface StacItemDetailProps {
  /** The STAC item to display. */
  item: StacItem;
  /** The map ID. */
  mapId: string;
  /** Callback to go back to the previous view. */
  onBack: () => void;
  /** Optional callback to navigate up to the item's collection. */
  onGoToCollection?: (collectionId: string) => void;
}

/**
 * Creates the STAC item detail component with auto-shown footprint and asset controls.
 *
 * @param props - Properties defined in StacItemDetailProps interface
 * @returns The item detail component
 */
export function StacItemDetail(props: StacItemDetailProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-item-detail');

  const { item, mapId, onBack, onGoToCollection } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useMemo, useRef, useState } = cgpv.reactUtilities.react;
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const olMap = cgpv.api.getMapViewer(mapId).map;

  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedAssetKey, setSelectedAssetKey] = useState<string | null>(null);
  const footprintLayerRef = useRef<unknown | undefined>(undefined);
  const previewLayerRef = useRef<unknown | undefined>(undefined);

  /**
   * Auto-shows the item footprint in orange on mount and cleans up on unmount.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-ITEM-DETAIL - Auto-show footprint', item.id);

    if (item.geometry) {
      footprintLayerRef.current = StacLayerHelper.addGeometryFootprintLayer(olMap, item.geometry, ITEM_COLOR, 0.15);
    } else if (item.bbox && item.bbox.length >= 4) {
      footprintLayerRef.current = StacLayerHelper.addBboxFootprintLayer(
        olMap,
        [item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3]],
        ITEM_COLOR,
        0.15
      );
    }

    return (): void => {
      if (footprintLayerRef.current) {
        StacLayerHelper.removeStacLayer(olMap, footprintLayerRef.current);
        footprintLayerRef.current = undefined;
      }
      // Also remove any preview/asset layer on unmount
      if (previewLayerRef.current) {
        StacLayerHelper.removeStacLayer(olMap, previewLayerRef.current);
        previewLayerRef.current = undefined;
      }
    };
  }, [olMap, item]);

  // #region Handlers

  /**
   * Handles zoom to item extent.
   */
  const handleZoomTo = useCallback((): void => {
    if (item.bbox && item.bbox.length >= 4) {
      const extent = StacLayerHelper.transformBboxToMapProjection(olMap, [item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3]]);
      void olMap.getView().fit(extent, { maxZoom: 12, duration: 500, padding: [100, 100, 100, 100] });
    }
  }, [olMap, item.bbox]);

  /**
   * Removes the currently displayed preview layer from the map.
   */
  const handleRemovePreview = useCallback((): void => {
    if (previewLayerRef.current) {
      StacLayerHelper.removeStacLayer(olMap, previewLayerRef.current);
      previewLayerRef.current = undefined;
      setPreviewVisible(false);
      setSelectedAssetKey(null);
    }
  }, [olMap]);

  /**
   * Handles displaying a specific asset on the map.
   */
  const handleShowAsset = useCallback(
    (assetKey: string): void => {
      const asset = item.assets?.[assetKey];
      if (!asset) return;

      // Remove previous preview layer if any
      if (previewLayerRef.current) {
        StacLayerHelper.removeStacLayer(olMap, previewLayerRef.current);
        previewLayerRef.current = undefined;
      }

      // If clicking the same asset, toggle it off
      if (selectedAssetKey === assetKey) {
        setPreviewVisible(false);
        setSelectedAssetKey(null);
        return;
      }

      const addAsset = async (): Promise<void> => {
        const layer = await StacLayerHelper.addGeoTiffLayer(olMap, asset.href);
        if (layer) {
          previewLayerRef.current = layer;
          setPreviewVisible(true);
          setSelectedAssetKey(assetKey);
        }
      };
      void addAsset();
    },
    [olMap, selectedAssetKey, item.assets]
  );

  /**
   * Handles click on an asset row.
   */
  const handleAssetClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      const { assetKey } = event.currentTarget.dataset;
      if (assetKey) handleShowAsset(assetKey);
    },
    [handleShowAsset]
  );

  /**
   * Handles keyboard activation on an asset row.
   */
  const handleAssetKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const { assetKey } = event.currentTarget.dataset;
        if (assetKey) handleShowAsset(assetKey);
      }
    },
    [handleShowAsset]
  );

  // #endregion

  /**
   * Checks if an asset is a GeoTIFF by media type or file extension.
   *
   * @param asset - The STAC asset to check
   * @returns Whether the asset is a GeoTIFF
   */
  const isGeoTiffAsset = useCallback((asset: StacAsset): boolean => {
    const geotiffTypes = ['image/tiff', 'image/geotiff', 'image/x-geotiff', 'application/x-geotiff'];
    if (asset.type) {
      return geotiffTypes.some((mediaType) => asset.type!.toLowerCase().startsWith(mediaType));
    }
    const url = asset.href.toLowerCase().split('?')[0];
    return url.endsWith('.tif') || url.endsWith('.tiff');
  }, []);

  /**
   * Filters assets to only include displayable ones (excludes thumbnail, overview, and metadata-only assets).
   */
  const memoVisibleAssets = useMemo((): [string, StacAsset][] => {
    logger.logTraceUseMemo('STAC-ITEM-DETAIL - memoVisibleAssets', item.assets);

    if (!item.assets) return [];
    const hiddenRoles = new Set(['thumbnail', 'overview']);
    return Object.entries(item.assets).filter(([, asset]) => {
      if (!asset.roles || asset.roles.length === 0) return true;
      // Exclude assets whose roles are ALL hidden (thumbnail/overview)
      const hasVisibleRole = asset.roles.some((role) => !hiddenRoles.has(role));
      return hasVisibleRole;
    });
  }, [item.assets]);

  /**
   * Gets the thumbnail or overview URL from item assets.
   *
   * @returns The preview image URL, or undefined if no suitable asset exists
   */
  const getPreviewUrl = useCallback((): string | undefined => {
    if (!item.assets) return undefined;
    const overview = Object.values(item.assets).find((asset) => asset.roles?.includes('overview'));
    if (overview) return overview.href;
    const thumbnail = Object.values(item.assets).find((asset) => asset.roles?.includes('thumbnail'));
    return thumbnail?.href;
  }, [item.assets]);

  const previewUrl = getPreviewUrl();
  const title = String(item.properties.title ?? item.id);
  const datetime = String(item.properties.datetime ?? item.properties.start_datetime ?? '');
  const created = item.properties.created ? String(item.properties.created) : undefined;
  const updated = item.properties.updated ? String(item.properties.updated) : undefined;
  const projEpsg = item.properties['proj:epsg'] as number | undefined;
  const projShape = item.properties['proj:shape'] as number[] | undefined;
  const projTransform = item.properties['proj:transform'] as number[] | undefined;

  return (
    <Box sx={sxClasses.panelContent}>
      {/* Sticky navigation links */}
      <Box sx={sxClasses.stickyNav}>
        <Button type="text" size="small" onClick={onBack}>
          ← {t('stacBrowser.back')}
        </Button>
        {onGoToCollection && item.collection && (
          <Button type="text" size="small" onClick={(): void => onGoToCollection(item.collection!)}>
            ↑ {t('stacBrowser.goToCollection')}
          </Button>
        )}
      </Box>

      {/* Title */}
      <Typography sx={[sxClasses.detailTitle, sxClasses.detailSection]}>{title}</Typography>

      {/* Preview image */}
      {previewUrl && (
        <Box sx={sxClasses.detailSection}>
          <img src={previewUrl} alt={title} style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 4 }} />
        </Box>
      )}

      {/* Map controls */}
      <Box sx={sxClasses.detailSection}>
        <Box sx={sxClasses.mapControls}>
          <Button type="text" variant="outlined" size="small" onClick={handleZoomTo} sx={sxClasses.zoomButton}>
            {t('stacBrowser.zoomTo')}
          </Button>
          {previewVisible && (
            <Button type="text" variant="outlined" color="error" size="small" onClick={handleRemovePreview}>
              {t('stacBrowser.removeLayer')}
            </Button>
          )}
        </Box>
      </Box>

      {/* General Metadata */}
      <Box sx={sxClasses.metadataSection}>
        <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.general')}</Typography>
        {datetime && (
          <Box sx={sxClasses.metadataRow}>
            <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.datetime')}</Typography>
            <Typography sx={sxClasses.resultMeta}>{new Date(datetime).toLocaleString()}</Typography>
          </Box>
        )}
        {item.collection && (
          <Box sx={sxClasses.metadataRow}>
            <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.collection')}</Typography>
            <Typography sx={sxClasses.resultMeta}>{item.collection}</Typography>
          </Box>
        )}
        {created && (
          <Box sx={sxClasses.metadataRow}>
            <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.created')}</Typography>
            <Typography sx={sxClasses.resultMeta}>{new Date(created).toLocaleString()}</Typography>
          </Box>
        )}
        {updated && (
          <Box sx={sxClasses.metadataRow}>
            <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.updated')}</Typography>
            <Typography sx={sxClasses.resultMeta}>{new Date(updated).toLocaleString()}</Typography>
          </Box>
        )}
        {item.properties.description && <Typography sx={sxClasses.detailDescription}>{String(item.properties.description)}</Typography>}
      </Box>

      {/* Projection Metadata */}
      {(projEpsg || projShape || projTransform) && (
        <Box sx={sxClasses.metadataSection}>
          <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.projection')}</Typography>
          {projEpsg && (
            <Box sx={sxClasses.metadataRow}>
              <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.epsgCode')}</Typography>
              <Typography sx={sxClasses.resultMeta}>EPSG:{projEpsg}</Typography>
            </Box>
          )}
          {projShape && projShape.length >= 2 && (
            <Box sx={sxClasses.metadataRow}>
              <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.imageDimensions')}</Typography>
              <Typography sx={sxClasses.resultMeta}>
                {projShape[1].toLocaleString()} × {projShape[0].toLocaleString()}
              </Typography>
            </Box>
          )}
          {projTransform && projTransform.length >= 6 && (
            <Box sx={sxClasses.metadataRow}>
              <Typography sx={sxClasses.metadataLabel}>{t('stacBrowser.transform')}</Typography>
              <Typography sx={sxClasses.resultMeta}>
                [{projTransform[0]}; {projTransform[1]}; {projTransform[2]}] [{projTransform[3]}; {projTransform[4]}; {projTransform[5]}]
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Assets - clickable GeoTIFF assets to display on map */}
      {memoVisibleAssets.length > 0 && (
        <Box sx={sxClasses.detailSection}>
          <Typography sx={sxClasses.filterLabel}>{t('stacBrowser.assets')}</Typography>
          <Box sx={sxClasses.assetList}>
            {memoVisibleAssets.map(([key, asset]) => {
              const isGeotiff = isGeoTiffAsset(asset);
              const isSelected = selectedAssetKey === key;
              const roles = asset.roles?.filter((r) => r !== 'thumbnail' && r !== 'overview') ?? [];
              return (
                <Box
                  key={key}
                  data-asset-key={key}
                  sx={{
                    ...sxClasses.assetItem,
                    cursor: isGeotiff ? 'pointer' : 'default',
                    backgroundColor: isSelected ? theme.palette.action.selected : 'transparent',
                    '&:hover': isGeotiff ? { backgroundColor: theme.palette.action.hover } : {},
                    borderRadius: '4px',
                    padding: '4px 8px',
                  }}
                  onClick={isGeotiff ? handleAssetClick : undefined}
                  role={isGeotiff ? 'button' : undefined}
                  tabIndex={isGeotiff ? 0 : undefined}
                  onKeyDown={isGeotiff ? handleAssetKeyDown : undefined}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <Typography sx={{ ...sxClasses.resultMeta, fontWeight: isSelected ? 600 : 400 }}>{asset.title ?? key}</Typography>
                    <Box sx={{ display: 'flex', gap: theme.spacing(0.5), flexWrap: 'wrap' }}>
                      {roles.map((role) => (
                        <Box key={role} component="span" sx={sxClasses.assetRoleBadge}>
                          {role.toUpperCase()}
                        </Box>
                      ))}
                      {isGeotiff && (
                        <Box component="span" sx={sxClasses.assetTypeBadge}>
                          COG
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
