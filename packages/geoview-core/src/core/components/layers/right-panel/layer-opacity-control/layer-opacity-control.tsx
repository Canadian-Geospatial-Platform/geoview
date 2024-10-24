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

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store actions
  const { setLayerOpacity } = useLayerStoreActions();

  let marks: Mark[] = [];
  if (layerDetails.opacityFromParent && layerDetails.opacityFromParent !== 1) {
    marks = [{ value: layerDetails.opacityFromParent * 100, label: t('layers.opacityMax') }];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSetOpacity = (opacityValue: number | number[], activeThumb: number): void => {
    const val = Array.isArray(opacityValue) ? opacityValue[0] : opacityValue;

    if (layerDetails.opacityFromParent && layerDetails.opacityFromParent !== 1 && val / 100 >= layerDetails.opacityFromParent) {
      setLayerOpacity(layerDetails.layerPath, layerDetails.opacityFromParent);
    } else {
      setLayerOpacity(layerDetails.layerPath, val / 100);
    }
  };

  return (
    <Box style={{ padding: '16px 17px 16px 23px' }}>
      <Box sx={sxClasses.layerOpacityControl}>
        <Typography sx={{ fontWeight: 'bold' }}>{t('layers.opacity')}</Typography>
        <Slider
          min={0}
          max={100}
          step={1}
          value={(layerDetails.opacity ? layerDetails.opacity : 1) * 100}
          onChange={handleSetOpacity}
          marks={marks}
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );
}
