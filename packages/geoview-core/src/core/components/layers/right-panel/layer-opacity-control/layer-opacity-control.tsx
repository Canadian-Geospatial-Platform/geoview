import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Mark } from '@mui/base';
import { getSxClasses } from './layer-opacity-control-styles';
import { Box, Slider, Typography } from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
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

  // State
  const [localOpacity, setLocalOpacity] = useState((layerDetails.opacity ?? 1) * 100);
  const [marks, setMarks] = useState<Mark[]>([]);

  // Sync local state with store when layerDetails.opacity changes
  useEffect(() => {
    setLocalOpacity((layerDetails.opacity ?? 1) * 100);
  }, [layerDetails.opacity]);

  useEffect(() => {
    if (layerDetails.opacityFromParent && layerDetails.opacityFromParent !== 1) {
      setMarks([{ value: layerDetails.opacityFromParent * 100, label: t('layers.opacityMax') }]);
    } else {
      setMarks([]);
    }
  }, [layerDetails.opacityFromParent, t]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSliderChange = (value: number | number[], activeThumb: number): void => {
    const val = Array.isArray(value) ? value[0] : value;
    setLocalOpacity(val);
  };

  const handleSliderChangeCommitted = (value: number | number[]): void => {
    const val = Array.isArray(value) ? value[0] : value;
    if (layerDetails.opacityFromParent && layerDetails.opacityFromParent !== 1 && val / 100 >= layerDetails.opacityFromParent) {
      setLayerOpacity(layerDetails.layerPath, layerDetails.opacityFromParent);
    } else {
      setLayerOpacity(layerDetails.layerPath, localOpacity / 100);
    }
  };

  return (
    <Box sx={sxClasses.layerOpacityControl}>
      <Typography sx={{ fontWeight: 'bold' }}>{t('layers.opacity')}</Typography>
      <Slider
        min={0}
        max={100}
        step={1}
        value={localOpacity}
        onChange={handleSliderChange}
        onChangeCommitted={handleSliderChangeCommitted}
        marks={marks}
        valueLabelDisplay="auto"
      />
    </Box>
  );
}
