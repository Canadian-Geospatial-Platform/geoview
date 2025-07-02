import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Mark } from '@mui/base';
import { getSxClasses } from './layer-opacity-control-styles';
import { Box, Slider, Typography } from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useSelectorIsLayerHiddenOnMap } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

interface LayerOpacityControlProps {
  layerDetails: TypeLegendLayer;
}

export function LayerOpacityControl(props: LayerOpacityControlProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/layer-opacity-control/layer-opacity-control');

  const { layerDetails } = props;

  // Hook
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store actions
  const { setLayerOpacity } = useLayerStoreActions();

  const layerHidden = useSelectorIsLayerHiddenOnMap(layerDetails.layerPath);

  // State
  const [localOpacity, setLocalOpacity] = useState(layerDetails.opacity || 1);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [opacityMax, setOpacityMax] = useState(layerDetails.opacityFromParent || 1);

  // Sync local state with store when layerDetails.opacity changes
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER OPACITY CONTROL - opacity sync', layerDetails.opacity);

    if (layerDetails.opacity) setLocalOpacity(layerDetails.opacity);
  }, [layerDetails.opacity]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER OPACITY CONTROL - parent opacity', layerDetails.opacityFromParent);

    setOpacityMax(layerDetails.opacityFromParent || 1);
    // Add mark for parent opacity
    if (layerDetails.opacityFromParent && layerDetails.opacityFromParent !== 1) {
      setMarks([{ value: layerDetails.opacityFromParent * 100, label: t('layers.opacityMax') }]);
    } else {
      setMarks([]);
    }
  }, [layerDetails.opacityFromParent, t]);

  // Keeps the slider handle from exceeding the max opacity
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LAYER OPACITY CONTROL - max opacity', localOpacity, opacityMax);

    // Update the local opacity if it exceeds the max - if the check happens earlier, the handle will not always reset
    if (localOpacity > opacityMax) setLocalOpacity(opacityMax);
  }, [localOpacity, opacityMax]);

  /**
   * Updates the opacity of the layer on the map, optionally updating the store
   * @param {number | number[]} value - The opacity to set.
   * @param {number} activeThumb - Provided by onChange, but not used.
   * @param {boolean} updateStore - Should the store be updated.
   */
  const handleSliderChange = useCallback(
    (value: number | number[], activeThumb: number, updateStore: boolean = false): void => {
      const val = (Array.isArray(value) ? value[0] : value) / 100;
      const newValue = val > opacityMax ? opacityMax : val;
      // Necessary to keep the handle from exceeding the max from parent
      if (updateStore) setLocalOpacity(val);
      if (newValue !== localOpacity) setLayerOpacity(layerDetails.layerPath, newValue, updateStore);
    },
    [layerDetails.layerPath, localOpacity, opacityMax, setLayerOpacity]
  );

  return (
    <Box sx={sxClasses.layerOpacityControl}>
      <Typography sx={layerHidden ? sxClasses.controlHidden : { fontWeight: 'bold' }}>{t('layers.opacity')}</Typography>
      <Slider
        min={0}
        max={100}
        step={1}
        value={localOpacity * 100}
        onChange={handleSliderChange}
        onChangeCommitted={(value: number | number[]) => handleSliderChange(value, 1, true)}
        marks={marks}
        valueLabelDisplay="auto"
        disabled={layerHidden}
      />
    </Box>
  );
}
