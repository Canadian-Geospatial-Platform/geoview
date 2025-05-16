import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import { useCallback } from 'react';
import { Box, Switch, Tooltip } from '@/ui';
import {
  useAllLayersCollapsed,
  useAllLayersVisible,
  useMapHasCollapsibleLayers,
  useMapStoreActions
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useLayerDisplayState } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { logger } from '@/core/utils/logger';

interface ToggleAllProps {
  source?: 'layers' | 'legend';
}

export function ToggleAll({ source = 'legend' }: ToggleAllProps): JSX.Element {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  // Log
  logger.logTraceRender('components/toggle-all/toggle');
  const { t } = useTranslation<string>();

  const displayState = useLayerDisplayState();
  const allLayersVisible = useAllLayersVisible();
  const allLayersCollapsed = useAllLayersCollapsed();
  const hasCollapsibleLayers = useMapHasCollapsibleLayers();
  const { setAllLayersVisibility, setAllLayersCollapsed } = useMapStoreActions();

  const toggleAllStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '0px',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft: '8px',
    width: 'fit-content'
  };

  const handleVisibilityToggle = useCallback(() => {
    setAllLayersVisibility(!allLayersVisible);
  }, [allLayersVisible, setAllLayersVisibility]);

  const handleCollapseToggle = useCallback(() => {
    setAllLayersCollapsed(!allLayersCollapsed);
  }, [allLayersCollapsed, setAllLayersCollapsed]);

  return (
    <Box id="toggle-all" sx={toggleAllStyle}>
      {(source === 'legend' || displayState === 'view') && (
        <Tooltip title={t('toggle-all.show-tooltip')}>
          <span>
          <Switch
            size={isSmallScreen ? "small": "medium"}
            checked={allLayersVisible}
            onChange={handleVisibilityToggle}
            label={t('toggle-all.show')!}
          />
          </span>
        </Tooltip>
      )}
      {hasCollapsibleLayers && (
        <Tooltip title={t('toggle-all.collapse-tooltip')}>
          <span>
          <Switch
            size={isSmallScreen ? "small": "medium"}
            checked={allLayersCollapsed}
            onChange={handleCollapseToggle}
            label={t('toggle-all.collapse')!}
          />
          </span>
        </Tooltip>
      )}
    </Box>
  );
}
