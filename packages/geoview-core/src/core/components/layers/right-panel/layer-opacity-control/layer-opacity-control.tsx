import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import type { Theme, SxProps } from '@mui/material/styles';
import type { Mark } from '@mui/material/Slider/useSlider.types';

import { Box, Slider, Typography } from '@/ui';
import type { SxStyles } from '@/ui/style/types';
import { getSxClasses } from './layer-opacity-control-styles';
import {
  useStoreLayerIsHiddenOnMap,
  useStoreLayerName,
  useStoreLayerOpacity,
  useStoreLayerOpacityMaxFromParent,
} from '@/core/stores/states/layer-state';
import { logger } from '@/core/utils/logger';
import { useLayerController } from '@/core/controllers/use-controllers';

/** Properties for the layer opacity control. */
interface LayerOpacityControlProps {
  /** The layer path to control opacity for. */
  layerPath: string;
}

/**
 * Creates the opacity control for a layer.
 *
 * @param props - Properties defined in LayerOpacityControlProps interface
 * @returns The layer opacity control
 */
export function LayerOpacityControl({ layerPath }: LayerOpacityControlProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-opacity-control/layer-opacity-control');

  const layerOpacity = useStoreLayerOpacity(layerPath) ?? 1;
  const layerParentOpacity = useStoreLayerOpacityMaxFromParent(layerPath) ?? 1;

  // Hook
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('LAYER-OPACITY-CONTROL - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // Store
  const layerHidden = useStoreLayerIsHiddenOnMap(layerPath);
  const layerName = useStoreLayerName(layerPath);
  const layerController = useLayerController();
  const labelId = useId();

  // State
  const [marks, setMarks] = useState<Mark[]>([]);
  const [localOpacity, setLocalOpacity] = useState<number>(layerOpacity);

  // Sync local state with store when layerDetails.opacity changes
  /**
   * Synchronizes the local opacity with the layer and its parent limit.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER OPACITY CONTROL - opacity sync', layerOpacity, layerParentOpacity);

    // Update the local opacity if it exceeds the max
    const newValue = Math.min(layerOpacity, layerParentOpacity);
    setLocalOpacity(newValue);
  }, [layerOpacity, layerParentOpacity]);

  // Update markers if the parent has a specific opacity other than 1
  /**
   * Updates the slider marks when the parent opacity limit changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER OPACITY CONTROL - parent opacity', layerParentOpacity, t);

    // Add mark for parent opacity
    if (layerParentOpacity !== 1) {
      setMarks([{ value: Math.round(layerParentOpacity * 100), label: t('layers.opacityMax') }]);
    } else {
      setMarks([]);
    }
  }, [layerParentOpacity, t]);

  /**
   * Formats the opacity value as a translated percentage string.
   *
   * @param value - The slider value to format
   * @returns The translated value text
   */
  const getOpacityValueText = useCallback((value: number): string => t('layers.opacityValueText', { value }), [t]);

  // #region Handlers

  /**
   * Handles slider opacity changes, optionally committing them to the store.
   */
  const handleSliderChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (value: number | number[], activeThumb: number, updateStore = false): void => {
      const val = (Array.isArray(value) ? value[0] : value) / 100;
      const newValue = Math.min(val, layerParentOpacity);

      // Necessary to keep the handle from exceeding the max from parent
      setLocalOpacity(newValue);
      layerController.setLayerOpacity(layerPath, newValue, updateStore);
    },
    [layerPath, layerParentOpacity, layerController]
  );

  /**
   * Commits the opacity value after slider interaction.
   */
  const handleSliderChangeCommitted = useCallback(
    (value: number | number[]): void => {
      handleSliderChange(value, 1, true);
    },
    [handleSliderChange]
  );

  // #endregion Handlers

  return (
    <Box sx={memoSxClasses.layerOpacityControl}>
      <Typography
        id={labelId}
        sx={[memoSxClasses.controlLabel, layerHidden ? memoSxClasses.controlLabelHidden : undefined] as SxProps<Theme>}
      >
        {t('layers.opacity')}
      </Typography>
      <Slider
        disabled={layerHidden}
        value={Math.round(localOpacity * 100)}
        step={1}
        min={0}
        max={100}
        marks={marks}
        onChange={handleSliderChange}
        onChangeCommitted={handleSliderChangeCommitted}
        valueLabelDisplay="auto"
        aria-label={t('layers.opacityAriaLabel', { name: layerName, label: t('layers.opacity') })}
        onValueDisplayAriaLabel={getOpacityValueText}
        onValueLabelFormat={getOpacityValueText}
      />
    </Box>
  );
}
