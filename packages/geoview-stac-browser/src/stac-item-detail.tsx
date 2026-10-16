import type { SxProps, SxStyles } from 'geoview-core/ui/style/types';
import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, IconButton, Typography } from 'geoview-core/ui';
import { ArrowBackIcon, ArrowUpIcon, CopyIcon, DownloadIcon, VisibilityIcon, VisibilityOffIcon } from 'geoview-core/ui/icons';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStacBrowserController } from 'geoview-core/core/controllers/use-controllers';

import type { StacAsset, StacItem, StacItemDisplayOptions } from './stac-browser-types';
import { StacAssetUtils } from './stac-asset-utils';
import { StacConfigUtils } from './stac-config-utils';
import { StacFieldUtils } from './stac-field-utils';
import { StacMetadataView } from './stac-metadata-view';
import { getSxClasses } from './stac-browser-style';

/** Geometry group used for the item footprint. */
const FOOTPRINT_GROUP = 'stac-item-footprint';

/** Props for the StacItemDetail component. */
interface StacItemDetailProps {
  /** The STAC item to display. */
  item: StacItem;
  /** Display options shared with the item cards. */
  display: StacItemDisplayOptions;
  /** Optional URL of the asset of this item currently previewed on the map, shared with the item cards. */
  previewedHref?: string;
  /** Callback to show or hide an asset of the item on the map. */
  onToggleAssetPreview: (item: StacItem, asset: StacAsset) => void;
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

  const { item, display, previewedHref, onToggleAssetPreview, onBack, onGoToCollection } = props;
  const effectiveDisplay = StacConfigUtils.resolveItemDisplayOptions(display, item.collection);
  const { itemView, actions, isPreviewEnabled } = effectiveDisplay;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const { useCallback, useEffect, useMemo } = cgpv.reactUtilities.react;
  const memoSxClasses = useMemo((): SxStyles => getSxClasses(theme), [theme]);

  const stacController = useStacBrowserController();

  /**
   * Auto-shows the item footprint on mount and cleans up on unmount; the map preview is shared and kept.
   */
  useEffect(() => {
    logger.logTraceUseEffect('STAC-ITEM-DETAIL - Auto-show footprint', item.id);

    stacController.setFootprints(FOOTPRINT_GROUP, [
      { geometry: item.geometry, bbox: item.bbox, ...StacConfigUtils.getFootprintStyle(display, item.collection, 'item') },
    ]);

    return (): void => {
      stacController.clearFootprints(FOOTPRINT_GROUP);
    };
  }, [stacController, item, display]);

  // #region Handlers

  /**
   * Handles navigating up to the item's collection.
   */
  const handleGoToCollection = useCallback((): void => {
    if (onGoToCollection && item.collection) onGoToCollection(item.collection);
  }, [onGoToCollection, item.collection]);

  /**
   * Handles toggling an asset on the map.
   */
  const handleToggleView = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      const { assetKey } = event.currentTarget.dataset;
      const asset = assetKey ? item.assets?.[assetKey] : undefined;
      if (asset) onToggleAssetPreview(item, asset);
    },
    [item, onToggleAssetPreview]
  );

  /**
   * Handles copying an asset URL to the clipboard and reports the outcome.
   */
  const handleCopyUrl = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      const { assetHref } = event.currentTarget.dataset;
      if (!assetHref) return;
      navigator.clipboard
        .writeText(assetHref)
        .then(() => stacController.showSuccess('stacBrowser.urlCopied'))
        .catch((error: unknown) => {
          logger.logError('STAC-ITEM-DETAIL - Failed to copy the asset URL', error);
          stacController.showError('stacBrowser.errorCopy');
        });
    },
    [stacController]
  );

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
        <Button type="text" size="small" startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack}>
          {t('stacBrowser.back')}
        </Button>
        {onGoToCollection && item.collection && (
          <Button type="text" size="small" startIcon={<ArrowUpIcon fontSize="small" />} onClick={handleGoToCollection}>
            {t('stacBrowser.goToCollection')}
          </Button>
        )}
      </Box>

      {/* Title */}
      <Typography
        component="h3"
        tabIndex={-1}
        data-stac-view-focus
        sx={[memoSxClasses.detailTitle, memoSxClasses.detailSection] as SxProps}
      >
        {title}
      </Typography>

      {/* Metadata */}
      <Box sx={memoSxClasses.metadataSection}>
        <Typography component="h4" sx={memoSxClasses.filterLabel}>
          {t('stacBrowser.metadata')}
        </Typography>
        {thumbnailUrl && (
          <Box component="img" src={thumbnailUrl} alt={t('stacBrowser.previewOf', { title })} sx={memoSxClasses.previewImage} />
        )}
        <StacMetadataView item={item} itemView={itemView} dateDisplay={display.dateDisplay} sxClasses={memoSxClasses} />
      </Box>

      {/* Assets - clickable GeoTIFF assets to display on map */}
      {memoVisibleAssets.length > 0 && (
        <Box sx={memoSxClasses.detailSection}>
          <Typography component="h4" sx={memoSxClasses.filterLabel}>
            {t('stacBrowser.assets')}
          </Typography>
          <Box sx={memoSxClasses.assetList}>
            {memoVisibleAssets.map(([key, asset]) => {
              const isGeotiff = StacAssetUtils.isGeoTiff(asset);
              const isSelected = previewedHref === asset.href;
              const assetTitle = asset.title ?? key;
              const roles = asset.roles?.filter((r) => r !== 'thumbnail' && r !== 'overview') ?? [];
              return (
                <Box key={key} sx={[memoSxClasses.assetItem, isSelected && memoSxClasses.assetItemSelected] as SxProps}>
                  <Box sx={memoSxClasses.itemRowText}>
                    <Typography sx={[memoSxClasses.resultMeta, isSelected && memoSxClasses.assetTitleSelected] as SxProps}>
                      {assetTitle}
                    </Typography>
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
                        aria-label={t('stacBrowser.showOnMapOf', { title: assetTitle })}
                        aria-pressed={isSelected}
                        size="small"
                        data-asset-key={key}
                        onClick={handleToggleView}
                        color={isSelected ? 'primary' : 'default'}
                      >
                        {isSelected ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                      </IconButton>
                    )}
                    {actions?.copyUrl !== false && (
                      <IconButton
                        aria-label={t('stacBrowser.copyUrlOf', { title: assetTitle })}
                        size="small"
                        data-asset-href={asset.href}
                        onClick={handleCopyUrl}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    )}
                    {actions?.download !== false && (
                      <IconButton
                        aria-label={`${t('stacBrowser.downloadOf', { title: assetTitle })}${t('general.opensInNewTab')}`}
                        size="small"
                        data-asset-href={asset.href}
                        onClick={handleDownload}
                      >
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
