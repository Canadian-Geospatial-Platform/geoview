import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import type { SelectChangeEvent } from '@mui/material';

import { Box, Divider, Typography, Select } from '@/ui';
import { Switch } from '@/ui/switch/switch';

import {
  useStoreLayerHasText,
  useStoreLayerTextVisibility,
  useStoreLayerStyleSettings,
  useStoreLayerControls,
  useStoreLayerHoverable,
  useStoreLayerQueryable,
} from '@/core/stores/states/layer-state';
import {
  useStoreSwiperInteractive,
  useStoreSwiperLayerPaths,
  useStoreSwiperLayerSides,
  useStoreSwiperOrientation,
  type SwipeSide,
} from '@/core/stores/states/swiper-state';

import { getSxClasses } from '../layer-details-style';
import { RasterFunctionPanel } from './raster-function-selector';
import { MosaicRulePanel } from './mosaic-rule-selector';
import { WmsStylePanel } from './wms-style-selector';
import { useLayerController } from '@/core/controllers/use-controllers';
import { useSwiperControllerIfExists } from '@/core/controllers/use-controllers';
import type { SwiperController } from '@/core/controllers/swiper-controller';
import { logger } from '@/core/utils/logger';

interface SwiperLayerSettingsSectionProps {
  /** The layer path to configure swiper settings for. */
  layerPath: string;

  /** The swiper controller used to add/remove layers and set their side. */
  controller: SwiperController;
}

/**
 * Renders the swiper settings section for a layer.
 *
 * Only visible when the swiper plugin is loaded and configured as interactive. Lets the user add
 * or remove the layer from the swiper and choose which side of the bar reveals the layer.
 *
 * @param layerPath - The layer path to configure.
 * @param controller - The swiper controller instance.
 * @returns The swiper settings section, or null when the swiper is not interactive.
 */
function SwiperLayerSettingsSection({ layerPath, controller }: SwiperLayerSettingsSectionProps): JSX.Element | null {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-settings/layer-settings > SwiperLayerSettingsSection');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store
  const interactive = useStoreSwiperInteractive();
  const orientation = useStoreSwiperOrientation();
  const layerPaths = useStoreSwiperLayerPaths();
  const layerSides = useStoreSwiperLayerSides();

  // Derived values
  const isInSwiper = layerPaths.includes(layerPath);
  const currentSide = layerSides[layerPath] ?? (orientation === 'vertical' ? 'left' : 'up');

  // #region Handlers

  /**
   * Handles adding or removing the current layer from the swiper.
   */
  const handleToggleSwiper = useCallback((): void => {
    if (isInSwiper) controller.removeLayerPath(layerPath);
    else controller.addLayerPath(layerPath);
  }, [isInSwiper, controller, layerPath]);

  /**
   * Handles changing the visible side of the swiper bar for the current layer.
   */
  const handleChangeSide = useCallback(
    (event: SelectChangeEvent<unknown>): void => {
      controller.setLayerSide(layerPath, event.target.value as SwipeSide);
    },
    [controller, layerPath]
  );

  // #endregion

  if (!interactive) return null;

  const sideMenuItems =
    orientation === 'vertical'
      ? [{ item: { value: 'left', children: t('swiper.sideLeft') } }, { item: { value: 'right', children: t('swiper.sideRight') } }]
      : [{ item: { value: 'up', children: t('swiper.sideUp') } }, { item: { value: 'down', children: t('swiper.sideDown') } }];

  return (
    <Box sx={sxClasses.infoSection}>
      <Typography sx={sxClasses.infoSectionTitle}>{t('swiper.settingsTitle')}</Typography>
      <Box sx={sxClasses.swiperSectionContent}>
        <Switch size="small" onChange={handleToggleSwiper} label={t('swiper.showInSwiper')} checked={isInSwiper} />
        {isInSwiper && (
          <Select
            value={currentSide}
            onChange={handleChangeSide}
            label={t('swiper.sideLabel')}
            labelId={`${layerPath}-swiper-side-label`}
            inputLabel={{ id: `${layerPath}-swiper-side-label` }}
            menuItems={sideMenuItems}
            sx={sxClasses.swiperSideSelect}
          />
        )}
      </Box>
    </Box>
  );
}

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
  const swiperController = useSwiperControllerIfExists();
  const hasText = useStoreLayerHasText(layerPath);
  const textVisible = useStoreLayerTextVisibility(layerPath);
  const availableSettings = useStoreLayerStyleSettings(layerPath);
  const layerControls = useStoreLayerControls(layerPath);
  const hoverable = useStoreLayerHoverable(layerPath);
  const queryable = useStoreLayerQueryable(layerPath);

  // Derived values
  const isLayerHoverable = layerControls?.hover;
  const isLayerQueryable = layerControls?.query;

  // Stable handlers for hover/query toggles
  const handleToggleHoverable = useCallback((): void => {
    layerController.setLayerHoverable(layerPath, !hoverable);
  }, [layerPath, hoverable, layerController]);

  const handleToggleQueryable = useCallback((): void => {
    layerController.setLayerQueryable(layerPath, !queryable);
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
      {swiperController && <SwiperLayerSettingsSection layerPath={layerPath} controller={swiperController} />}
    </Box>
  );
}
