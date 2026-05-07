import React, { useCallback, useState } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Button, IconButton, Typography } from 'geoview-core/ui';
import { ArrowBackIcon } from 'geoview-core/ui/icons';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useMapController } from 'geoview-core/core/controllers/use-controllers';
import { StacLayerHelper } from 'geoview-core/geo/utils/stac-layer-helper';

import type { StacItem } from './stac-browser-types';
import { getSxClasses } from './stac-browser-style';

/** Props for the StacItemDetail component. */
interface StacItemDetailProps {
  /** The STAC item to display. */
  item: StacItem;
  /** The map ID. */
  mapId: string;
  /** Callback to go back to results list. */
  onBack: () => void;
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

  const { item, mapId, onBack } = props;
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const mapController = useMapController();
  const [addedToMap, setAddedToMap] = useState(false);

  /**
   * Handles zoom to item extent.
   */
  const handleZoomTo = useCallback((): void => {
    if (item.bbox && item.bbox.length >= 4) {
      void mapController.zoomToExtent([item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3]]);
    }
  }, [item.bbox, mapController]);

  /**
   * Handles adding the STAC item preview as an image layer on the map.
   */
  const handleAddToMap = useCallback((): void => {
    if (!item.bbox || item.bbox.length < 4) return;

    // Find preview URL (overview or thumbnail)
    let previewHref: string | undefined;
    if (item.assets) {
      const overview = Object.values(item.assets).find((asset) => asset.roles?.includes('overview'));
      if (overview) previewHref = overview.href;
      if (!previewHref) {
        const thumbnail = Object.values(item.assets).find((asset) => asset.roles?.includes('thumbnail'));
        previewHref = thumbnail?.href;
      }
    }

    if (!previewHref) {
      logger.logWarning('StacItemDetail - No preview image found for item', item.id);
      return;
    }

    const mapViewer = cgpv.api.getMapViewer(mapId);
    const olMap = mapViewer.map;
    const mapProjection = olMap.getView().getProjection().getCode();

    // Transform item bbox from EPSG:4326 to the map's projection
    const extent = transformExtent([item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3]], 'EPSG:4326', mapProjection);

    // Create an ImageStatic layer at the item's geographic extent
    const imageLayer = new ImageLayer({
      source: new Static({
        url: previewHref,
        imageExtent: extent,
        projection: mapProjection,
        crossOrigin: 'anonymous',
      }),
    });

    olMap.addLayer(imageLayer);
    void mapController.zoomToExtent([item.bbox[0], item.bbox[1], item.bbox[2], item.bbox[3]]);
    setAddedToMap(true);
  }, [cgpv.api, mapId, item, mapController]);

  /**
   * Gets the thumbnail or overview URL from item assets.
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
    <Box sx={sxClasses.detailPanel}>
      {/* Header */}
      <Box sx={sxClasses.detailHeader}>
        <IconButton aria-label={t('stacBrowser.back')} onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography sx={sxClasses.detailTitle}>{title}</Typography>
      </Box>

      {/* Content */}
      <Box sx={sxClasses.detailContent}>
        {/* Preview image */}
        {previewUrl && (
          <img src={previewUrl} alt={title} style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 4 }} />
        )}

        {/* Metadata */}
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

        {/* Description */}
        {item.properties.description && <Typography sx={sxClasses.detailDescription}>{String(item.properties.description)}</Typography>}

        {/* Assets */}
        {item.assets && Object.keys(item.assets).length > 0 && (
          <Box>
            <Typography sx={sxClasses.filterLabel}>{t('stacBrowser.assets')}</Typography>
            <Box sx={sxClasses.assetList}>
              {Object.entries(item.assets).map(([key, asset]) => (
                <Box key={key} sx={sxClasses.assetItem}>
                  <Typography sx={sxClasses.resultMeta}>
                    {asset.title ?? key} {asset.type && `(${asset.type})`}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Action buttons */}
      <Box sx={sxClasses.actionButtons}>
        <Button type="text" variant="outlined" onClick={handleZoomTo}>
          {t('stacBrowser.zoomTo')}
        </Button>
        <Button type="text" variant="contained" onClick={handleAddToMap} disabled={addedToMap}>
          {addedToMap ? t('stacBrowser.addedToMap') : t('stacBrowser.addToMap')}
        </Button>
      </Box>
    </Box>
  );
}
