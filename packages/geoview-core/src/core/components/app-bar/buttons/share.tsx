import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ShareIcon, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@/ui';
import { useGeoViewMapId, useGeoViewSharedMode } from '@/core/stores/geoview-store';
import {
  useMapInteraction,
  useMapZoom,
  useMapCenterCoordinates,
  useMapProjection,
  useMapCurrentBasemapOptions,
  useMapOrderedLayers,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { Projection } from '@/geo/utils/projection';

import type { Coordinate } from 'ol/coordinate';
import type { TypeBasemapOptions, TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';
import { logger } from '@/core/utils/logger';
import { isValidUUID } from '@/core/utils/utilities';

/**
 * Generates a shareable URL query string from the current map state.
 *
 * This function creates URL parameters that can be used with maps having the data-shared attribute.
 * When a map with data-shared and data-config (or data-config-url) loads with these URL parameters,
 * the base configuration is preserved and URL parameters selectively update specific properties:
 * - Projection, zoom, and center coordinates are updated
 * - Basemap options (basemapId, shaded, labeled) are updated
 * - Layers from URL parameters are appended to existing config layers (not replaced)
 *
 * @param {number} zoom - Current zoom level of the map
 * @param {Coordinate} center - Current center coordinates of the map in the map's projection
 * @param {TypeValidMapProjectionCodes} projection - Current projection code (e.g., 3857, 3978)
 * @param {TypeBasemapOptions} basemap - Current basemap configuration (basemapId, shaded, labeled)
 * @param {string[]} layers - Array of layer paths; UUIDs are extracted from paths (e.g., "uuid/sublayer" -> "uuid")
 * @returns {string} URL query string with format: "?p=3857&z=4&c=-100.123456,40.654321&b=id:transport,s:on,l:off&keys=uuid1,uuid2"
 *                   Center coordinates are automatically reprojected to lon/lat (EPSG:4326) for sharing..
 *                   Returns empty string if an error occurs during generation.
 */
function getShareUrl(
  zoom: number,
  center: Coordinate,
  projection: TypeValidMapProjectionCodes,
  basemap: TypeBasemapOptions,
  layers: string[]
): string {
  try {
    const params: string[] = [];

    // Set projection (p)
    params.push(`p=${projection}`);

    // Set current zoom (z)
    params.push(`z=${zoom}`);

    // Set current center (c) - format: lon,lat (reprojected to EPSG:4326)
    const lonLat = Projection.transformToLonLat(center, Projection.getProjectionFromString(`EPSG:${projection}`));
    params.push(`c=${lonLat[0].toFixed(6)},${lonLat[1].toFixed(6)}`);

    // Get basemap options (b) - format: id:value,s:on/off,l:on/off
    const basemapParts: string[] = [];
    basemapParts.push(`id:${basemap.basemapId}`);
    basemapParts.push(`s:${basemap.shaded ? 'on' : 'off'}`);
    basemapParts.push(`l:${basemap.labeled ? 'on' : 'off'}`);
    params.push(`b=${basemapParts.join(',')}`);

    // Get layer keys (keys) - Process layer paths to extract valid UUIDs
    if (layers && layers.length > 0) {
      // Extract UUIDs from layer paths (split by '/' and take first part)
      const validUUIDs = layers
        .map((layer) => layer.split('/')[0]) // Get the first part before '/'
        .filter((id) => id && isValidUUID(id)) // Keep only valid UUIDs
        .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

      params.push(`keys=${validUUIDs.join(',')}`);
    }

    // Return the query string
    return params.length > 0 ? `?${params.join('&')}` : '';
  } catch (error) {
    logger.logError('Error generating share URL:', error);
    return '';
  }
}

/**
 * Share button component that allows users to copy a shareable URL based on the current map state.
 * Only visible when the map has data-shared attribute.
 *
 * @returns {JSX.Element | null} The share button component or null if shared mode is not enabled
 */
export default function Share(): JSX.Element | null {
  // Log
  logger.logTraceRender('components/app-bar/buttons/share');

  // Hooks
  const { t } = useTranslation<string>();

  // Store
  const mapId = useGeoViewMapId();
  const sharedMode = useGeoViewSharedMode();
  const interaction = useMapInteraction();
  const zoom = useMapZoom();
  const center = useMapCenterCoordinates();
  const projection = useMapProjection();
  const basemap = useMapCurrentBasemapOptions();
  const layers = useMapOrderedLayers();

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Handler to open modal
  const handleShareClick = useCallback(() => {
    logger.logTraceUseCallback('SHARE - click');

    // Generate the URL only when opening the modal
    const baseUrl = window.location.origin + window.location.pathname;
    const queryParams = getShareUrl(zoom, center, projection, basemap, layers);
    setShareUrl(baseUrl + queryParams);

    setIsModalOpen(true);
  }, [zoom, center, projection, basemap, layers]);

  // Handler to close modal
  const handleCloseModal = useCallback(() => {
    logger.logTraceUseCallback('SHARE - close modal');
    setIsModalOpen(false);
  }, []);

  // Handler to copy URL to clipboard
  const handleCopyUrl = useCallback(() => {
    logger.logTraceUseCallback('SHARE - copy URL');

    navigator.clipboard.writeText(shareUrl).then(
      () => {
        logger.logInfo('URL copied to clipboard:', shareUrl);
        // Close modal after successful copy
        setIsModalOpen(false);
        // TODO: Show success notification
      },
      (error: unknown) => {
        logger.logError('Failed to copy URL to clipboard', error);
      }
    );
  }, [shareUrl]);

  // Memoize visibility check
  const isVisible = useMemo(() => {
    return sharedMode === true;
  }, [sharedMode]);

  // If shared mode is not enabled, don't render the button
  if (!isVisible) return null;

  return (
    <>
      <IconButton
        id={`${mapId}-share-button`}
        aria-label={t('appbar.share')}
        tooltip={t('appbar.share')}
        tooltipPlacement="right"
        onClick={handleShareClick}
        className={interaction === 'dynamic' ? 'buttonFilled' : 'style4'}
      >
        <ShareIcon />
      </IconButton>

      <Dialog open={isModalOpen} onClose={handleCloseModal} aria-labelledby="share-dialog-title" maxWidth="sm" fullWidth>
        <DialogTitle id="share-dialog-title">{t('appbar.share')}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 2, pb: 1 }}>
            <TextField
              fullWidth
              value={shareUrl}
              slotProps={{
                input: {
                  readOnly: true,
                },
                inputLabel: {
                  sx: {
                    color: 'primary.main',
                    '&.Mui-focused': {
                      color: 'primary.main',
                    },
                  },
                },
              }}
              label={t('appbar.shareUrl')}
              variant="outlined"
              multiline
              maxRows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCopyUrl} type="text" variant="contained" color="primary" autoFocus>
            {t('general.copy')}
          </Button>
          <Button onClick={handleCloseModal} type="text">
            {t('general.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
