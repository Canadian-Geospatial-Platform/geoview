import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Mark } from '@mui/base';
import { Slider as MaterialSlider } from '@mui/material';
import { getSxClasses } from './layer-opacity-control-styles';
import { Box, Typography } from '@/ui';
import { TypeLegendLayer } from '../../types';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';

interface LayerOpacityControlProps {
  layerDetails: TypeLegendLayer;
}

export function LayerOpacityControl(props: LayerOpacityControlProps): JSX.Element {
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

  const handleSetOpacity = (event: Event, opacityValue: number | number[]) => {
    const val = Array.isArray(opacityValue) ? opacityValue[0] : opacityValue;

    if (layerDetails.opacityFromParent && layerDetails.opacityFromParent !== 1 && val / 100 >= layerDetails.opacityFromParent) {
      setLayerOpacity(layerDetails.layerPath, layerDetails.opacityFromParent);
    } else {
      setLayerOpacity(layerDetails.layerPath, val / 100);
    }
  };

  return (
    <div style={{ padding: '16px 17px 16px 23px' }}>
      <Box sx={sxClasses.layerOpacityControl}>
        <Typography sx={{ fontWeight: 'bold' }}>{t('layers.opacity')}</Typography>
        <MaterialSlider
          min={0}
          max={100}
          value={(layerDetails.opacity ? layerDetails.opacity : 1) * 100}
          onChange={handleSetOpacity}
          marks={marks}
        />
      </Box>
    </div>
  );
}
