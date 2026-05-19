import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, Switch, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { StacLayerHelper } from 'geoview-core/geo/utils/stac-layer-helper';

import type { StacItem, StacAsset } from './stac-browser-types';
import { getSxClasses } from './stac-browser-style';

/** Props for the StacItemDetail component. */
interface StacItemDetailProps {
  /** The STAC item to display. */
  item: StacItem;
  /** The map ID. */
  mapId: string;
  /** Callback to go back to the results list. */
  onBackToResults: () => void;
  /** Callback to go back to the search panel. */
  onBackToSearch: () => void;
}

/**
 * Creates the STAC item detail component.
 *
 * @param props - Properties defined in StacItemDetailProps interface
 * @returns The item detail component
 */
export function StacItemDetail(props: StacItemDetailProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-item-detail');

  const { item, mapId, onBackToResults, onBackToSearch } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { useCallback, useRef, useState } = cgpv.reactUtilities.react;

  // Get the OL map reference once at component level (like time-slider gets its controller once)
  const olMap = cgpv.api.getMapViewer(mapId).map;

  const [footprintVisible, setFootprintVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedAssetKey, setSelectedAssetKey] = useState<string | null>(null);
  const footprintLayerRef = useRef<unknown>(null);
  const previewLayerRef = useRef<unknown>(null);

  // #region Handlers

  /**
   * Handles zoom to item extent with capped zoom level.
   */
  const handleZoomTo = useCallback((): void => {
    if (item.bbox && item.bbox.length >= 4) {
      const extent = StacLayerHelper.transformBboxToMapProjection(olMap, [item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3]]);
      void olMap.getView().fit(extent, { maxZoom: 12, duration: 500, padding: [100, 100, 100, 100] });
    }
  }, [olMap, item.bbox]);

  /**
   * Handles toggling footprint visibility on the map.
   */
  const handleToggleFootprint = useCallback((): void => {
    if (footprintVisible && footprintLayerRef.current) {
      // Remove footprint layer
      StacLayerHelper.removeStacLayer(olMap, footprintLayerRef.current);
      footprintLayerRef.current = null;
      setFootprintVisible(false);
    } else {
      // Add footprint layer
      const addFootprint = async (): Promise<void> => {
        const selfLink = item.links?.find((link) => link.rel === 'self');
        const stacLayer = await StacLayerHelper.addStacLayer(olMap, {
          url: selfLink?.href,
          data: selfLink ? undefined : item,
          displayPreview: false,
          displayOverview: false,
          displayFootprint: true,
        });
        if (stacLayer) {
          footprintLayerRef.current = stacLayer;
          setFootprintVisible(true);
        }
      };
      void addFootprint();
    }
  }, [olMap, item, footprintVisible]);

  /**
   * Removes the currently displayed preview layer from the map.
   */
  const handleRemovePreview = useCallback((): void => {
    if (previewLayerRef.current) {
      StacLayerHelper.removeStacLayer(olMap, previewLayerRef.current);
      previewLayerRef.current = null;
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
        previewLayerRef.current = null;
      }

      // If clicking the same asset, toggle it off
      if (selectedAssetKey === assetKey) {
        setPreviewVisible(false);
        setSelectedAssetKey(null);
        return;
      }

      const addAsset = async (): Promise<void> => {
        // Use addGeoTiffLayer directly — it handles both:
        // - Palette-indexed COGs (normalize: false + embedded colormap style)
        // - Multi-band RGB COGs (normalize: true + convertToRGB: 'auto')
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
      return geotiffTypes.some((t2) => asset.type!.toLowerCase().startsWith(t2));
    }
    const url = asset.href.toLowerCase().split('?')[0];
    return url.endsWith('.tif') || url.endsWith('.tiff');
  }, []);

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

  return (
    <Box sx={sxClasses.panelContent}>
      {/* Navigation links */}
      <Box sx={sxClasses.backLink}>
        <Button type="text" size="small" onClick={onBackToResults}>
          ← {t('stacBrowser.backToResults')}
        </Button>
        <Button type="text" size="small" onClick={onBackToSearch}>
          ← {t('stacBrowser.backToSearch')}
        </Button>
      </Box>

      {/* Title */}
      <Typography sx={{ ...sxClasses.detailTitle, padding: '0 12px' }}>{title}</Typography>

      {/* Preview image */}
      {previewUrl && (
        <Box sx={{ padding: '0 12px' }}>
          <img src={previewUrl} alt={title} style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 4 }} />
        </Box>
      )}

      {/* Assets - clickable GeoTIFF assets to display on map */}
      {item.assets && Object.keys(item.assets).length > 0 && (
        <Box sx={{ padding: '0 12px' }}>
          <Typography sx={sxClasses.filterLabel}>{t('stacBrowser.assets')}</Typography>
          <Box sx={sxClasses.assetList}>
            {Object.entries(item.assets).map(([key, asset]) => {
              const isGeotiff = isGeoTiffAsset(asset);
              const isSelected = selectedAssetKey === key;
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
                  <Typography sx={{ ...sxClasses.resultMeta, fontWeight: isSelected ? 600 : 400 }}>
                    {isGeotiff ? '🗺️ ' : ''}
                    {asset.title ?? key}
                    {asset.type && ` (${asset.type})`}
                    {isSelected && ' ✓'}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Map controls */}
      <Box sx={{ ...sxClasses.mapControls, padding: '0 12px' }}>
        <Button type="text" variant="outlined" size="small" onClick={handleZoomTo}>
          {t('stacBrowser.zoomTo')}
        </Button>
        <Switch checked={footprintVisible} onChange={handleToggleFootprint} size="small" label={t('stacBrowser.showFootprint')} />
        {previewVisible && (
          <Button type="text" variant="outlined" color="error" size="small" onClick={handleRemovePreview}>
            {t('stacBrowser.removeLayer')}
          </Button>
        )}
      </Box>

      {/* Metadata */}
      <Box sx={{ padding: '0 12px' }}>
        {datetime && (
          <Typography sx={sxClasses.resultMeta}>
            {t('stacBrowser.datetime')}: {new Date(datetime).toLocaleString()}
          </Typography>
        )}
        {item.collection && (
          <Typography sx={sxClasses.resultMeta}>
            {t('stacBrowser.collection')}: {item.collection}
          </Typography>
        )}
        {item.properties.description && <Typography sx={sxClasses.detailDescription}>{String(item.properties.description)}</Typography>}
      </Box>
    </Box>
  );
}
