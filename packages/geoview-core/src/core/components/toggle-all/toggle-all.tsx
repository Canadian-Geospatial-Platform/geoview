import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
// import { useCallback, useEffect, useRef } from 'react';
import { Box, Switch } from '@/ui';
import {
  useAllLayersCollapsed,
  useAllLayersVisible,
  useMapHasCollapsibleLayers,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useLayerDisplayState } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { logger } from '@/core/utils/logger';

interface ToggleAllProps {
  source?: 'toolbar' | 'legend';
}

export function ToggleAll({ source = 'legend' }: ToggleAllProps): JSX.Element {
  const theme = useTheme();
  // Log
  logger.logTraceRender('components/toggle-all/toggle');
  const { t } = useTranslation<string>();

  const displayState = useLayerDisplayState();
  const allLayersVisible = useAllLayersVisible();
  const allLayersCollapsed = useAllLayersCollapsed();
  const hasCollapsibleLayers = useMapHasCollapsibleLayers();

  const toggleAllStyle = { display: 'flex', flexDirection: 'row', gap: '8px' };

  return (
    <Box id="toggle-all" sx={toggleAllStyle}>
      {(source === 'legend' || displayState === 'view') && <Switch checked={allLayersVisible} title={t('toggle-all.show') || undefined} />}
      {hasCollapsibleLayers && <Switch checked={allLayersCollapsed} title={t('toggle-all.collapse') || undefined} />}
    </Box>
  );
}
