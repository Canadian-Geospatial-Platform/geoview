import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Divider, IconButton } from '@/ui';
import { PaletteIcon } from '@/ui';

import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';

import { RasterFunctionPanel } from './raster-function-selector';
import { MosaicRulePanel } from './mosaic-rule-selector';
import { WmsStyleSelector } from './wms-style-selector';
import type { TypeLegendLayer } from '../../types';
import { logger } from '@/core/utils/logger';

interface LayerSettingsPanelProps {
  layerDetails: TypeLegendLayer;
}

/**
 * Panel view for layer settings content.
 *
 * Displays available settings (raster function, mosaic rule) as inline
 * sections. WMS style selection opens as a popup menu. The header and
 * back navigation are handled by the parent.
 *
 * @param layerDetails - The legend layer to configure.
 */
export function LayerSettingsPanel({ layerDetails }: LayerSettingsPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/layer-settings');

  const { t } = useTranslation<string>();

  // Store
  const { getLayerSettings } = useLayerStoreActions();
  const availableSettings = getLayerSettings(layerDetails.layerPath);

  // State for WMS style popup
  const [wmsAnchorEl, setWmsAnchorEl] = useState<HTMLElement | null>(null);

  const handleWmsClose = (): void => {
    setWmsAnchorEl(null);
  };

  return (
    <Box>
      <Divider sx={{ height: 'auto', marginTop: '10px', marginBottom: '10px' }} variant="middle" />

      {availableSettings?.includes('rasterFunction') && <RasterFunctionPanel layerDetails={layerDetails} />}

      {availableSettings?.includes('mosaicRule') && <MosaicRulePanel layerDetails={layerDetails} />}

      {availableSettings?.includes('wmsStyles') && (
        <>
          <IconButton
            aria-label={t('layers.settings.selectWmsStyle')}
            className="buttonOutline"
            onClick={(event) => setWmsAnchorEl(event.currentTarget)}
            tooltipPlacement="bottom"
          >
            <PaletteIcon />
          </IconButton>
          <WmsStyleSelector layerDetails={layerDetails} anchorEl={wmsAnchorEl} onClose={handleWmsClose} onClickOutside={handleWmsClose} />
        </>
      )}
    </Box>
  );
}
