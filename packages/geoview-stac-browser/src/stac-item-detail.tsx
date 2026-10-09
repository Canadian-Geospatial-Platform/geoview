import type { SxProps } from 'geoview-core/ui/style/types';
import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, IconButton, Typography } from 'geoview-core/ui';
import { CopyIcon, DownloadIcon, VisibilityIcon, VisibilityOffIcon } from 'geoview-core/ui/icons';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStacBrowserController } from 'geoview-core/core/controllers/use-controllers';

import type { StacAsset, StacItem, StacItemDisplayOptions } from './stac-browser-types';
import { ITEM_COLOR } from './stac-api-service';
import { StacAssetUtils } from './stac-asset-utils';
import { resolveStacItemDisplayOptions } from './stac-config-utils';
import { StacFieldUtils } from './stac-field-utils';
import { StacMetadataView } from './stac-metadata-view';
import { getSxClasses } from './stac-browser-style';

/** Geometry group used for the item footprint. */
const FOOTPRINT_GROUP = 'stac-item-footprint';

/** Overlay id used for the asset preview of the item detail. */
const PREVIEW_OVERLAY_ID = 'stac-item-detail-preview';

/** Props for the StacItemDetail component. */
interface StacItemDetailProps {
  /** The STAC item to display. */
  item: StacItem;
  /** Display options shared with the item cards. */
  display: StacItemDisplayOptions;
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

  const { item, display, onBack, onGoToCollection } = props;
  const effectiveDisplay = resolveStacItemDisplayOptions(display, item.collection);
  const { itemView, actions, isPreviewEnabled } = effectiveDisplay;
  const previewOpacity = effectiveDisplay.preview?.opacity;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useMemo, useState } = cgpv.reactUtilities.react;
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const stacController = useStacBrowserController();

  const [selectedAssetKey, setSelectedAssetKey] = useState<string | null>(null);

  /**
   * Auto-shows the item footprint in orange on mount and cleans up on unmount.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-ITEM-DETAIL - Auto-show footprint', item.id);

    stacController.addFootprints(FOOTPRINT_GROUP, [item], ITEM_COLOR, 0.15);

    return (): void => {
      stacController.clearFootprints(FOOTPRINT_GROUP);
      stacController.removeOverlay(PREVIEW_OVERLAY_ID);
    };
  }, [stacController, item]);

  // #region Handlers

  /**
   * Handles navigating up to the item's collection.
   */
  const handleGoToCollection = useCallback((): void => {
    if (onGoToCollection && item.collection) onGoToCollection(item.collection);
  }, [onGoToCollection, item.collection]);

  /**
   * Handles toggling asset visibility on the map.
   */
  const handleToggleView = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      const { assetKey } = event.currentTarget.dataset;
      if (!assetKey) return;

      const asset = item.assets?.[assetKey];
      if (!asset) return;

      stacController.removeOverlay(PREVIEW_OVERLAY_ID);

      // If clicking the same asset, toggle it off
      if (selectedAssetKey === assetKey) {
        setSelectedAssetKey(null);
        return;
      }

      stacController
        .addGeoTiffOverlay(PREVIEW_OVERLAY_ID, asset.href, previewOpacity)
        .then((isAdded) => {
          if (isAdded) setSelectedAssetKey(assetKey);
          else stacController.showError('stacBrowser.errorPreview');
        })
        .catch((error: unknown) => {
          logger.logError('STAC-ITEM-DETAIL - Failed to show asset on map', error);
        });
    },
    [stacController, selectedAssetKey, item.assets, previewOpacity]
  );

  /**
   * Handles copying an asset URL to the clipboard.
   */
  const handleCopyUrl = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    const { assetHref } = event.currentTarget.dataset;
    if (assetHref) void navigator.clipboard.writeText(assetHref);
  }, []);

  /**
   * Handles downloading an asset by opening its URL.
   */
  const handleDownload = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    const { assetHref } = event.currentTarget.dataset;
    if (assetHref) window.open(assetHref, '_blank', 'noopener,noreferrer');
  }, []);

  // #endregion

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

  const thumbnailUrl = StacAssetUtils.getThumbnailUrl(item);
  const title = StacFieldUtils.getTitle(item, itemView?.titleField);

  return (
    <Box sx={memoSxClasses.panelContent}>
      {/* Sticky navigation links */}
      <Box sx={memoSxClasses.stickyNav}>
        <Button type="text" size="small" onClick={onBack}>
          ← {t('stacBrowser.back')}
        </Button>
        {onGoToCollection && item.collection && (
          <Button type="text" size="small" onClick={handleGoToCollection}>
            ↑ {t('stacBrowser.goToCollection')}
          </Button>
        )}
      </Box>

      {/* Title */}
      <Typography sx={[memoSxClasses.detailTitle, memoSxClasses.detailSection] as SxProps}>{title}</Typography>

      {/* Metadata */}
      <Box sx={memoSxClasses.metadataSection}>
        <Typography sx={memoSxClasses.filterLabel}>{t('stacBrowser.metadata')}</Typography>
        {thumbnailUrl && <Box component="img" src={thumbnailUrl} alt={title} sx={memoSxClasses.previewImage} />}
        <StacMetadataView item={item} itemView={itemView} sxClasses={memoSxClasses} />
      </Box>

      {/* Assets - clickable GeoTIFF assets to display on map */}
      {memoVisibleAssets.length > 0 && (
        <Box sx={memoSxClasses.detailSection}>
          <Typography sx={memoSxClasses.filterLabel}>{t('stacBrowser.assets')}</Typography>
          <Box sx={memoSxClasses.assetList}>
            {memoVisibleAssets.map(([key, asset]) => {
              const isGeotiff = StacAssetUtils.isGeoTiff(asset);
              const isSelected = selectedAssetKey === key;
              const roles = asset.roles?.filter((r) => r !== 'thumbnail' && r !== 'overview') ?? [];
              return (
                <Box
                  key={key}
                  sx={{
                    ...memoSxClasses.assetItem,
                    backgroundColor: isSelected ? theme.palette.action.selected : 'transparent',
                  }}
                >
                  <Box sx={memoSxClasses.itemRowText}>
                    <Typography sx={{ ...memoSxClasses.resultMeta, fontWeight: isSelected ? 600 : 400 }}>{asset.title ?? key}</Typography>
                    <Box sx={memoSxClasses.assetBadgeRow}>
                      {roles.map((role) => (
                        <Box key={role} component="span" sx={memoSxClasses.assetRoleBadge}>
                          {role.toUpperCase()}
                        </Box>
                      ))}
                      {isGeotiff && (
                        <Box component="span" sx={memoSxClasses.assetTypeBadge}>
                          COG
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box sx={memoSxClasses.assetActions}>
                    {isGeotiff && isPreviewEnabled && actions?.showOnMap !== false && (
                      <IconButton
                        aria-label={t('stacBrowser.showOnMap')}
                        size="small"
                        data-asset-key={key}
                        onClick={handleToggleView}
                        color={isSelected ? 'primary' : 'default'}
                      >
                        {isSelected ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                      </IconButton>
                    )}
                    {actions?.copyUrl !== false && (
                      <IconButton aria-label={t('stacBrowser.copyUrl')} size="small" data-asset-href={asset.href} onClick={handleCopyUrl}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    )}
                    {actions?.download !== false && (
                      <IconButton aria-label={t('stacBrowser.download')} size="small" data-asset-href={asset.href} onClick={handleDownload}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    )}
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
