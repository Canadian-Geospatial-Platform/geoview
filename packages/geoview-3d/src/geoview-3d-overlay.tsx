import { useEffect, useMemo, useRef } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box } from 'geoview-core/ui';
import type { SxStyles } from 'geoview-core/ui/style/types';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { logger } from 'geoview-core/core/utils/logger';
import { useMapController } from 'geoview-core/core/controllers/use-controllers';
import { useStoreMapCenterCoordinates, useStoreMapCurrentProjectionEPSG, useStoreMapZoom } from 'geoview-core/core/stores/states/map-state';
import { Projection } from 'geoview-core/geo/utils/projection';

import { getSxClasses } from './geoview-3d-panel-style';
import { TilesetRenderer } from './tileset-renderer';
import { toDeckViewport } from './viewport-sync';

/** Loading state of the configured tileset. */
export type TypeTilesetStatus = 'invalidUrl' | 'loading' | 'loaded' | 'error';

/** Props for the GeoView3DOverlay component. */
interface GeoView3DOverlayProps {
  /** The URL of the tileset.json to render. */
  tilesetUrl: string;
  /** Called whenever the tileset loading status changes. */
  onStatusChange: (status: TypeTilesetStatus, message?: string) => void;
}

/**
 * Creates the 3D overlay component: a deck.gl canvas covering the map, rendering the configured tileset.
 *
 * The deck.gl renderer (and its WebGL context) lives exactly as long as this component is mounted.
 *
 * @param props - Properties defined in GeoView3DOverlayProps interface
 * @returns The 3D overlay component
 */
export function GeoView3DOverlay(props: GeoView3DOverlayProps): JSX.Element {
  logger.logTraceRender('geoview-3d/geoview-3d-overlay > GeoView3DOverlay');

  const { tilesetUrl, onStatusChange } = props;
  const { t } = useTranslation<string>();
  const theme = (window as TypeWindow).cgpv.ui.useTheme();

  const memoSxClasses = useMemo((): SxStyles => {
    return getSxClasses(theme);
  }, [theme]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TilesetRenderer | undefined>(undefined);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const mapController = useMapController();
  const mapCenter = useStoreMapCenterCoordinates();
  const mapZoom = useStoreMapZoom();
  const mapProjectionEPSG = useStoreMapCurrentProjectionEPSG();

  /**
   * Creates the deck.gl renderer on the owned canvas on mount and destroys it on unmount.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOVIEW-3D-OVERLAY - create renderer');

    if (!canvasRef.current) return undefined;
    const renderer = new TilesetRenderer(canvasRef.current, {
      onTilesetLoad: (): void => onStatusChangeRef.current('loaded'),
      onError: (message: string): void => onStatusChangeRef.current('error', message),
    });
    rendererRef.current = renderer;

    return (): void => {
      rendererRef.current = undefined;
      renderer.destroy();
    };
  }, []);

  /**
   * Loads the tileset into the renderer whenever its URL changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOVIEW-3D-OVERLAY - tileset url', tilesetUrl);

    if (!rendererRef.current) return;
    onStatusChangeRef.current('loading');
    rendererRef.current.setTilesetUrl(tilesetUrl);
  }, [tilesetUrl]);

  /**
   * Moves the 3D camera to the 2D map's centre and zoom whenever the map finishes moving.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOVIEW-3D-OVERLAY - sync viewport', mapCenter, mapZoom);

    // mapCenter is a trigger token only: the store holds the projected centre, the controller gives lon/lat.
    const renderer = rendererRef.current;
    if (!renderer) return;

    const { lonlat, projected } = mapController.getMapCenterPosition();
    const scale = mapController.getScaleFromZoom(mapZoom);
    const mapUnitsPerPixel = scale === undefined ? undefined : mapController.getResolutionFromScale(scale);
    // Map units are only true ground metres at the projection's origin; scale them to the centre.
    const metersPerPixel =
      mapUnitsPerPixel === undefined ? undefined : mapUnitsPerPixel * Projection.getResolution(mapProjectionEPSG, projected);

    const viewport = toDeckViewport(lonlat, metersPerPixel);
    if (viewport) renderer.setViewport(viewport);
  }, [mapCenter, mapZoom, mapProjectionEPSG, mapController]);

  return (
    <Box sx={memoSxClasses.overlay}>
      <Box
        component="canvas"
        ref={canvasRef}
        sx={memoSxClasses.canvas}
        tabIndex={0}
        role="application"
        aria-roledescription={t('GeoView3D.canvasRole')}
        aria-label={t('GeoView3D.canvasLabel')}
      />
    </Box>
  );
}
