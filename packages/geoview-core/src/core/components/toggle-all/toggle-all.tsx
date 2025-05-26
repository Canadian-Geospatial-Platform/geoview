import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import { useCallback } from 'react';
import { Box, Switch, Tooltip } from '@/ui';
import {
  useAllLayersCollapsed,
  useAllLayersVisible,
  useMapHasCollapsibleLayers,
  useMapStoreActions,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useLayerDisplayState, useLayersAreLoading } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { logger } from '@/core/utils/logger';

interface ToggleAllProps {
  source?: 'layers' | 'legend';
}

const toggleAllStyle = {
  display: 'flex',
  flexDirection: 'row',
  gap: '0px',
  justifyContent: 'flex-start',
  alignItems: 'center',
  marginLeft: '8px',
  width: 'fit-content',
};

export function ToggleAll({ source = 'legend' }: ToggleAllProps): JSX.Element {
  // Log
  logger.logTraceRender('components/toggle-all/toggle');

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation<string>();

  const displayState = useLayerDisplayState();
  const allLayersVisible = useAllLayersVisible();
  const allLayersCollapsed = useAllLayersCollapsed();
  const layersAreLoading = useLayersAreLoading();
  const hasCollapsibleLayers = useMapHasCollapsibleLayers();
  const { setAllLayersVisibility, setAllLayersCollapsed } = useMapStoreActions();

  const handleVisibilityToggle = useCallback(() => {
    setAllLayersVisibility(!allLayersVisible);
  }, [allLayersVisible, setAllLayersVisibility]);

  const handleCollapseToggle = useCallback(() => {
    setAllLayersCollapsed(!allLayersCollapsed);
  }, [allLayersCollapsed, setAllLayersCollapsed]);

  // TODO Hide this component until all layers have loaded the first time.
  // TO.DO May require something external as a useRef for the first time the !layerAreLoading didn't work
  // TO.DO There's an odd interaction going on where the map initially has no layers (!layersAreLoading) and then starts loading the layers (layersAreLoading)
  // TO.DO So need something more stable from the state
  return (
    <Box id="toggle-all" sx={toggleAllStyle}>
      {(source === 'legend' || displayState === 'view') && (
        <Tooltip title={t('toggleAll.showTooltip')}>
          <span>
            <Switch
              size={isSmallScreen ? 'small' : 'medium'}
              checked={allLayersVisible}
              onChange={handleVisibilityToggle}
              label={t('toggleAll.show') || undefined}
              disabled={layersAreLoading}
            />
          </span>
        </Tooltip>
      )}
      {hasCollapsibleLayers && (
        <Tooltip title={t('toggleAll.collapseTooltip')}>
          <span>
            <Switch
              size={isSmallScreen ? 'small' : 'medium'}
              checked={allLayersCollapsed}
              onChange={handleCollapseToggle}
              label={t('toggleAll.collapse') || undefined}
              disabled={layersAreLoading}
            />
          </span>
        </Tooltip>
      )}
    </Box>
  );
}
