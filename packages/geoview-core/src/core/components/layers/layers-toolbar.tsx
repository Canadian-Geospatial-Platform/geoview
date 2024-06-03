import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import { Box, AddCircleOutlineIcon, ButtonGroup, DeleteOutlineIcon, HandleIcon, VisibilityOutlinedIcon, Button } from '@/ui';
import {
  useLayerStoreActions,
  useLayerDisplayState,
  useLayerLegendLayers,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeLayersViewDisplayState } from './types';

export function LayersToolbar(): JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation<string>();

  // access store
  const displayState = useLayerDisplayState();
  const legendLayers = useLayerLegendLayers();
  const { setDisplayState } = useLayerStoreActions();

  const handleSetDisplayState = (dispState: TypeLayersViewDisplayState): void => {
    setDisplayState(dispState);
  };

  return (
    <Box id="layers-toolbar" sx={{ padding: '8px 18px 0px 18px' }}>
      <ButtonGroup size="small" variant="outlined" aria-label="outlined button group">
        <Button
          makeResponsive
          type="text"
          disabled={!legendLayers.length}
          size="small"
          tooltip="general.view"
          variant={displayState === 'view' ? 'contained' : 'outlined'}
          startIcon={<VisibilityOutlinedIcon fontSize={theme.palette.geoViewFontSize.sm} />}
          onClick={() => handleSetDisplayState('view')}
        >
          {t('general.view')}
        </Button>
        <Button
          makeResponsive
          type="text"
          size="small"
          tooltip="legend.addLayer"
          variant={displayState === 'add' ? 'contained' : 'outlined'}
          startIcon={<AddCircleOutlineIcon fontSize={theme.palette.geoViewFontSize.sm} />}
          onClick={() => handleSetDisplayState('add')}
        >
          {t('general.add')}
        </Button>
        <Button
          makeResponsive
          type="text"
          disabled={!legendLayers.length}
          size="small"
          tooltip="legend.sortLayers"
          variant={displayState === 'order' ? 'contained' : 'outlined'}
          startIcon={<HandleIcon fontSize={theme.palette.geoViewFontSize.sm} />}
          onClick={() => handleSetDisplayState('order')}
        >
          {t('legend.sort')}
        </Button>
        <Button
          makeResponsive
          type="text"
          disabled={!legendLayers.length}
          size="small"
          tooltip="legend.removeLayer"
          variant={displayState === 'remove' ? 'contained' : 'outlined'}
          startIcon={<DeleteOutlineIcon fontSize={theme.palette.geoViewFontSize.sm} />}
          onClick={() => handleSetDisplayState('remove')}
        >
          {t('general.remove')}
        </Button>
      </ButtonGroup>
    </Box>
  );
}
