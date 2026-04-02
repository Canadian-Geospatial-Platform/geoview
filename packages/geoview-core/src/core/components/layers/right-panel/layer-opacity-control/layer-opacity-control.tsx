import { useCallback, useEffect, useId, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import type { Mark } from '@mui/base';

import { getSxClasses } from './layer-opacity-control-styles';
import { Box, Slider, Typography } from '@/ui';
import { useStoreLayerOpacity, useStoreLayerOpacityMaxFromParent } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useStoreMapIsLayerHiddenOnMap } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useLayerController } from '@/core/controllers/use-controllers';

interface LayerOpacityControlProps {
  /** The layer path to control opacity for. */
  layerPath: string;
}

export function LayerOpacityControl({ layerPath }: LayerOpacityControlProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-opacity-control/layer-opacity-control');

  const layerOpacity = useStoreLayerOpacity(layerPath) ?? 1;
  const layerParentOpacity = useStoreLayerOpacityMaxFromParent(layerPath) ?? 1;

  // Hook
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store
  const layerHidden = useStoreMapIsLayerHiddenOnMap(layerPath);
  const layerController = useLayerController();
  const labelId = useId();

  // State
  const [marks, setMarks] = useState<Mark[]>([]);
  const [localOpacity, setLocalOpacity] = useState(layerOpacity);

  // Sync local state with store when layerDetails.opacity changes
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER OPACITY CONTROL - opacity sync', layerOpacity);

    // Update the local opacity if it exceeds the max
    const newValue = Math.min(layerOpacity, layerParentOpacity);
    setLocalOpacity(newValue);
  }, [layerOpacity, layerParentOpacity]);

  // Update markers if the parent has a specific opacity other than 1
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER OPACITY CONTROL - parent opacity', layerParentOpacity);

    // Add mark for parent opacity
    if (layerParentOpacity !== 1) {
      setMarks([{ value: Math.round(layerParentOpacity * 100), label: t('layers.opacityMax') }]);
    } else {
      setMarks([]);
    }
  }, [layerParentOpacity, t]);

  /**
   * WCAG - Formats the opacity value as a percentage for screen readers.
   */
  const getAriaValueText = useCallback((value: number): string => {
    return `${value}%`;
  }, []);

  /**
   * Updates the opacity of the layer on the map, optionally updating the store
   * @param value - The opacity to set.
   * @param activeThumb - Provided by onChange, but not used.
   * @param updateStore - Should the store be updated.
   */
  const handleSliderChange = useCallback(
    (value: number | number[], activeThumb: number, updateStore: boolean = false): void => {
      const val = (Array.isArray(value) ? value[0] : value) / 100;
      const newValue = Math.min(val, layerParentOpacity);

      // Necessary to keep the handle from exceeding the max from parent
      setLocalOpacity(newValue);
      layerController.setLayerOpacity(layerPath, newValue, updateStore);
    },
    [layerPath, layerParentOpacity, layerController]
  );

  return (
    <Box sx={sxClasses.layerOpacityControl}>
      <Typography id={labelId} sx={layerHidden ? sxClasses.controlHidden : sxClasses.controlVisible}>
        {t('layers.opacity')}
      </Typography>
      <Slider
        min={0}
        max={100}
        step={1}
        value={Math.round(localOpacity * 100)}
        onChange={handleSliderChange}
        onChangeCommitted={(value: number | number[]) => handleSliderChange(value, 1, true)}
        onValueLabelFormat={(value) => `${value}%`}
        marks={marks}
        valueLabelDisplay="auto"
        disabled={layerHidden}
        aria-labelledby={labelId}
        onValueDisplayAriaLabel={getAriaValueText}
        slotProps={{
          input: {
            // Set to undefined to prevent redundant ARIA attributes; native min and max are already output
            'aria-valuemin': undefined,
            'aria-valuemax': undefined,
          },
        }}
      />
    </Box>
  );
}
