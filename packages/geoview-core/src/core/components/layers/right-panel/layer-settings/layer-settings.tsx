import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box, Divider, Typography } from '@/ui';
import { Switch } from '@/ui/switch/switch';

import {
  useStoreLayerHasText,
  useStoreLayerTextVisibility,
  useStoreLayerStyleSettings,
  useStoreLayerControls,
  useStoreLayerHoverable,
  useStoreLayerQueryable,
} from '@/core/stores/store-interface-and-intial-values/layer-state';

import { getSxClasses } from '../layer-details-style';
import { RasterFunctionPanel } from './raster-function-selector';
import { MosaicRulePanel } from './mosaic-rule-selector';
import { WmsStylePanel } from './wms-style-selector';
import { useLayerController } from '@/core/controllers/use-controllers';
import { logger } from '@/core/utils/logger';

interface LayerSettingsPanelProps {
  /** The layer path to configure settings for. */
  layerPath: string;
}

/**
 * Panel view for layer settings content.
 *
 * Displays available settings (raster function, mosaic rule, WMS styles,
 * interaction toggles) as inline collapsible sections. The header and
 * back navigation are handled by the parent.
 *
 * @param layerPath - The layer path to configure.
 */
export function LayerSettingsPanel({ layerPath }: LayerSettingsPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/layer-settings');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store
  const layerController = useLayerController();
  const hasText = useStoreLayerHasText(layerPath);
  const textVisible = useStoreLayerTextVisibility(layerPath);
  const availableSettings = useStoreLayerStyleSettings(layerPath);
  const layerControls = useStoreLayerControls(layerPath);
  const hoverable = useStoreLayerHoverable(layerPath);
  const queryable = useStoreLayerQueryable(layerPath);

  // Derived values
  const isLayerHoverable = layerControls?.hover;
  const isLayerQueryable = layerControls?.query;

  // TODO: CHECK - Change the use of hooks in those callbacks to use state getters instead?

  // Stable handlers for hover/query toggles
  const handleToggleHoverable = useCallback((): void => {
    layerController.setLayerHoverable(layerPath, !hoverable!);
  }, [layerPath, hoverable, layerController]);

  const handleToggleQueryable = useCallback((): void => {
    layerController.setLayerQueryable(layerPath, !queryable!);
  }, [layerPath, queryable, layerController]);

  const handleToggleText = useCallback((): void => {
    layerController.setLayerTextVisibility(layerPath, !textVisible);
  }, [layerPath, textVisible, layerController]);

  function renderToggleTextButton(): JSX.Element {
    return (
      <Switch
        size="small"
        onChange={handleToggleText}
        label={textVisible ? t('legend.hideText') : t('legend.showText')}
        checked={textVisible}
      />
    );
  }

  function renderInteractionSection(): JSX.Element | null {
    if (!(isLayerHoverable || isLayerQueryable || hasText)) {
      return null;
    }

    return (
      <Box sx={sxClasses.infoSection}>
        <Typography sx={sxClasses.infoSectionTitle}>{t('layers.layerInfoInteraction')}</Typography>
        <Box sx={sxClasses.infoSectionContent}>
          {isLayerHoverable && (
            <Switch size="small" onChange={handleToggleHoverable} label={t('layers.layerHoverable')} checked={hoverable} />
          )}
          {isLayerQueryable && (
            <Switch size="small" onChange={handleToggleQueryable} label={t('layers.layerQueryable')} checked={queryable} />
          )}
          {hasText && renderToggleTextButton()}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Divider sx={{ height: 'auto', marginTop: '10px', marginBottom: '10px' }} variant="middle" />

      {availableSettings?.includes('rasterFunction') && <RasterFunctionPanel layerPath={layerPath} />}
      {availableSettings?.includes('mosaicRule') && <MosaicRulePanel layerPath={layerPath} />}
      {availableSettings?.includes('wmsStyles') && <WmsStylePanel layerPath={layerPath} />}

      {renderInteractionSection()}
    </Box>
  );
}
