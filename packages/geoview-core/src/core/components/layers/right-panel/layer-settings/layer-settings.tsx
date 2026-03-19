import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box, Divider, Typography } from '@/ui';
import { Switch } from '@/ui/switch/switch';

import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';

import { getSxClasses } from '../layer-details-style';
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
 * Displays available settings (raster function, mosaic rule, WMS styles,
 * interaction toggles) as inline collapsible sections. The header and
 * back navigation are handled by the parent.
 *
 * @param layerDetails - The legend layer to configure.
 */
export function LayerSettingsPanel({ layerDetails }: LayerSettingsPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/layer-settings');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store
  const { getLayerSettings, setLayerHoverable, setLayerQueryable } = useLayerStoreActions();
  const availableSettings = getLayerSettings(layerDetails.layerPath);

  // Derived values
  const isLayerHoverable = layerDetails.controls?.hover;
  const isLayerQueryable = layerDetails.controls?.query;

  // Stable handlers for hover/query toggles
  const handleToggleHoverable = useCallback((): void => {
    setLayerHoverable(layerDetails.layerPath, !layerDetails.hoverable!);
  }, [layerDetails.layerPath, layerDetails.hoverable, setLayerHoverable]);

  const handleToggleQueryable = useCallback((): void => {
    setLayerQueryable(layerDetails.layerPath, !layerDetails.queryable!);
  }, [layerDetails.layerPath, layerDetails.queryable, setLayerQueryable]);

  return (
    <Box>
      <Divider sx={{ height: 'auto', marginTop: '10px', marginBottom: '10px' }} variant="middle" />

      {availableSettings?.includes('rasterFunction') && <RasterFunctionPanel layerDetails={layerDetails} />}

      {availableSettings?.includes('mosaicRule') && <MosaicRulePanel layerDetails={layerDetails} />}

      {availableSettings?.includes('wmsStyles') && <WmsStylePanel layerDetails={layerDetails} />}

      {/* Interaction NEEDED */}
      {(isLayerHoverable || isLayerQueryable) && (
        <Box sx={sxClasses.infoSection}>
          <Typography sx={sxClasses.infoSectionTitle}>{t('layers.layerInfoInteraction')}</Typography>
          <Box sx={sxClasses.infoSectionContent}>
            {isLayerHoverable && (
              <Switch size="small" onChange={handleToggleHoverable} label={t('layers.layerHoverable')!} checked={layerDetails.hoverable} />
            )}
            {isLayerQueryable && (
              <Switch size="small" onChange={handleToggleQueryable} label={t('layers.layerQueryable')!} checked={layerDetails.queryable} />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
