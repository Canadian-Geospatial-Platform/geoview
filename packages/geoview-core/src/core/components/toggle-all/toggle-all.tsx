import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '@mui/material';
import { useCallback } from 'react';
import { Box, Switch, Tooltip } from '@/ui';
import {
  setStoreMapAllMapLayerCollapsed,
  useMapAllLayersCollapsedToggle,
  useMapAllLayersVisibleToggle,
  useMapHasCollapsibleLayersToggle,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useLayerDisplayState, useLayerAreLayersLoading } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

import type { TypeContainerBox } from '@/core/types/global-types';
import { useMapController } from '@/core/controllers/map-controller';

/** The properties for the toggle all component. */
interface ToggleAllProps {
  /** The source panel triggering the toggle. */
  source: 'layers' | 'legend';
  /** The type of container box. */
  containerType: TypeContainerBox;
}

/** Default styles for the toggle all container. */
const toggleAllStyle = {
  display: 'flex',
  flexDirection: 'row',
  gap: '0px',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: 'fit-content',
};

/**
 * Renders toggle switches to control visibility and collapse state of all layers.
 *
 * @param props - The toggle all properties
 * @returns The toggle all component
 */
export function ToggleAll({ source, containerType }: ToggleAllProps): JSX.Element {
  // Log
  logger.logTraceRender('components/toggle-all/toggle');

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation<string>();
  const mapId = useGeoViewMapId();

  const displayState = useLayerDisplayState();
  const allLayersVisible = useMapAllLayersVisibleToggle();
  const allLayersCollapsed = useMapAllLayersCollapsedToggle();
  const layersAreLoading = useLayerAreLayersLoading();
  const hasCollapsibleLayers = useMapHasCollapsibleLayersToggle();
  const mapController = useMapController();

  /**
   * Handles when the user toggles the visibility switch.
   */
  const handleVisibilityToggle = useCallback((): void => {
    mapController.setAllMapLayerVisibility(!allLayersVisible);
  }, [allLayersVisible, mapController]);

  /**
   * Handles when the user toggles the collapse switch.
   */
  const handleCollapseToggle = useCallback((): void => {
    setStoreMapAllMapLayerCollapsed(mapId, !allLayersCollapsed);
  }, [allLayersCollapsed, mapId]);

  // TODO Hide this component until all layers have loaded the first time.
  // TO.DO May require something external as a useRef for the first time the !layerAreLoading didn't work
  // TO.DO There's an odd interaction going on where the map initially has no layers (!layersAreLoading) and then starts loading the layers (layersAreLoading)
  // TO.DO So need something more stable from the state
  return (
    <Box id={`${mapId}-${containerType}-${source}-toggle-all`} sx={toggleAllStyle}>
      {(source === 'legend' || displayState === 'view') && (
        <Tooltip title={t('toggleAll.showTooltip')} placement="top">
          <span>
            <Switch
              size={isSmallScreen ? 'small' : 'medium'}
              checked={allLayersVisible}
              onChange={handleVisibilityToggle}
              label={t('toggleAll.show')}
              disabled={layersAreLoading}
              disableRipple
            />
          </span>
        </Tooltip>
      )}
      {hasCollapsibleLayers && (source === 'legend' || displayState === 'view') && (
        <Tooltip title={t('toggleAll.collapseTooltip')} placement="top">
          <span>
            <Switch
              size={isSmallScreen ? 'small' : 'medium'}
              checked={allLayersCollapsed}
              onChange={handleCollapseToggle}
              label={t('toggleAll.collapse')}
              disableRipple
            />
          </span>
        </Tooltip>
      )}
    </Box>
  );
}
