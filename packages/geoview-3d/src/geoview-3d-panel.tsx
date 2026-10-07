import { Box, Typography } from 'geoview-core/ui';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { logger } from 'geoview-core/core/utils/logger';

import type { TypeGeoView3DConfig } from './geoview-3d-types';

/** Props for the GeoView3DPanel component. */
interface GeoView3DPanelProps {
  config: TypeGeoView3DConfig;
}

/**
 * GeoView 3D panel component.
 *
 * Skeleton placeholder for Phase 1. The deck.gl canvas and Tile3DLayer are added in Phase 2.
 *
 * @param props - The component props
 * @returns The 3D panel element
 */
export function GeoView3DPanel(props: GeoView3DPanelProps): JSX.Element {
  logger.logTraceRender('geoview-3d/geoview-3d-panel > GeoView3DPanel');

  const { config } = props;
  const { t } = useTranslation<string>();

  return (
    <Box sx={{ padding: '1rem' }}>
      <Typography variant="body1">{t('GeoView3D.placeholder')}</Typography>
      <Typography variant="caption">{`tilesetUrl: ${config.tilesetUrl}`}</Typography>
    </Box>
  );
}
