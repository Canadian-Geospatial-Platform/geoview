import { useEffect, useMemo, useRef, useState } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Typography } from 'geoview-core/ui';
import type { SxStyles } from 'geoview-core/ui/style/types';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { logger } from 'geoview-core/core/utils/logger';

import { getSxClasses } from './geoview-3d-panel-style';
import type { TypeGeoView3DConfig } from './geoview-3d-types';
import { TilesetRenderer } from './tileset-renderer';

/** Props for the GeoView3DPanel component. */
interface GeoView3DPanelProps {
  /** The plugin configuration. */
  config: TypeGeoView3DConfig;
}

/** Loading state of the configured tileset. */
type TypeTilesetStatus = 'invalidUrl' | 'loading' | 'loaded' | 'error';

/**
 * Creates the 3D panel component rendering the configured 3D Tiles tileset with deck.gl.
 *
 * @param props - Properties defined in GeoView3DPanelProps interface
 * @returns The 3D panel component
 */
export function GeoView3DPanel(props: GeoView3DPanelProps): JSX.Element {
  logger.logTraceRender('geoview-3d/geoview-3d-panel > GeoView3DPanel');

  const { config } = props;
  const { t } = useTranslation<string>();
  const theme = (window as TypeWindow).cgpv.ui.useTheme();

  const memoSxClasses = useMemo((): SxStyles => {
    return getSxClasses(theme);
  }, [theme]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TilesetRenderer | undefined>(undefined);
  const [status, setStatus] = useState<TypeTilesetStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * Creates the deck.gl renderer on the owned canvas on mount and destroys it on unmount.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOVIEW-3D-PANEL - create renderer');

    if (!canvasRef.current) return undefined;
    const renderer = new TilesetRenderer(canvasRef.current, {
      onTilesetLoad: (): void => setStatus('loaded'),
      onError: (message: string): void => {
        setErrorMessage(message);
        setStatus('error');
      },
    });
    rendererRef.current = renderer;

    return (): void => {
      rendererRef.current = undefined;
      renderer.destroy();
    };
  }, []);

  /**
   * Loads the configured tileset into the renderer whenever its URL changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOVIEW-3D-PANEL - tileset url', config.tilesetUrl);

    const renderer = rendererRef.current;
    if (!renderer) return;

    if (TilesetRenderer.isValidTilesetUrl(config.tilesetUrl)) {
      setStatus('loading');
      renderer.setTilesetUrl(config.tilesetUrl);
    } else {
      setStatus('invalidUrl');
      renderer.setTilesetUrl(undefined);
    }
  }, [config.tilesetUrl]);

  return (
    <Box sx={memoSxClasses.container}>
      <Box
        component="canvas"
        ref={canvasRef}
        sx={memoSxClasses.canvas}
        tabIndex={0}
        role="application"
        aria-roledescription={t('GeoView3D.canvasRole')}
        aria-label={t('GeoView3D.canvasLabel')}
      />
      <Box sx={memoSxClasses.status} role="status" aria-live="polite">
        <Typography variant="body2">{t(`GeoView3D.status.${status}`, { message: errorMessage })}</Typography>
      </Box>
    </Box>
  );
}
