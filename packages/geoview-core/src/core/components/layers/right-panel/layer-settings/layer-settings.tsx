import { Box, Divider } from '@/ui';

import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';

import { RasterFunctionPanel } from './raster-function-selector';
import { MosaicRulePanel } from './mosaic-rule-selector';
import { WmsStylePanel } from './wms-style-selector';
import type { TypeLegendLayer } from '../../types';
import { logger } from '@/core/utils/logger';

interface LayerSettingsPanelProps {
  layerDetails: TypeLegendLayer;
}

/**
 * Panel view for layer settings content.
 *
 * Displays available settings (raster function, mosaic rule, WMS styles)
 * as inline collapsible sections. The header and back navigation are
 * handled by the parent.
 *
 * @param layerDetails - The legend layer to configure.
 */
export function LayerSettingsPanel({ layerDetails }: LayerSettingsPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/layer-settings');

  // Store
  const { getLayerSettings } = useLayerStoreActions();
  const availableSettings = getLayerSettings(layerDetails.layerPath);

  return (
    <Box>
      <Divider sx={{ height: 'auto', marginTop: '10px', marginBottom: '10px' }} variant="middle" />

      {availableSettings?.includes('rasterFunction') && <RasterFunctionPanel layerDetails={layerDetails} />}

      {availableSettings?.includes('mosaicRule') && <MosaicRulePanel layerDetails={layerDetails} />}

      {availableSettings?.includes('wmsStyles') && <WmsStylePanel layerDetails={layerDetails} />}
    </Box>
  );
}
