import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import { Box, AddCircleOutlineIcon, ButtonGroup, DeleteOutlineIcon, HandleIcon, VisibilityOutlinedIcon } from '@/ui';
import { useLayerStoreActions, useLayerDisplayState } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeLayersViewDisplayState } from './types';
import { ResponsiveButton } from '../common';

export function LayersToolbar(): JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation<string>();

  // access store
  const displayState = useLayerDisplayState();
  const { setDisplayState } = useLayerStoreActions();

  const handleSetDisplayState = (dispState: TypeLayersViewDisplayState): void => {
    setDisplayState(dispState);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'left', padding: '18px 18px 0px 18px' }}>
      <ButtonGroup size="small" variant="outlined" aria-label="outlined button group">
        <ResponsiveButton
          size="small"
          tooltipKey="general.view"
          variant={displayState === 'view' ? 'contained' : 'outlined'}
          startIcon={<VisibilityOutlinedIcon fontSize={theme.palette.geoViewFontSize.sm} />}
          onClick={() => handleSetDisplayState('view')}
        >
          {t('general.view')}
        </ResponsiveButton>
        <ResponsiveButton
          size="small"
          tooltipKey="legend.addLayer"
          variant={displayState === 'add' ? 'contained' : 'outlined'}
          startIcon={<AddCircleOutlineIcon fontSize={theme.palette.geoViewFontSize.sm} />}
          onClick={() => handleSetDisplayState('add')}
        >
          {t('general.add')}
        </ResponsiveButton>
        <ResponsiveButton
          size="small"
          tooltipKey="legend.sortLayers"
          variant={displayState === 'order' ? 'contained' : 'outlined'}
          startIcon={<HandleIcon fontSize={theme.palette.geoViewFontSize.sm} />}
          onClick={() => handleSetDisplayState('order')}
        >
          {t('legend.sort')}
        </ResponsiveButton>
        <ResponsiveButton
          size="small"
          tooltipKey="legend.removeLayer"
          variant={displayState === 'remove' ? 'contained' : 'outlined'}
          startIcon={<DeleteOutlineIcon fontSize={theme.palette.geoViewFontSize.sm} />}
          onClick={() => handleSetDisplayState('remove')}
        >
          {t('general.remove')}
        </ResponsiveButton>
      </ButtonGroup>
    </Box>
  );
}
