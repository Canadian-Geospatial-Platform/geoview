import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';
import { Box, AddCircleOutlineIcon, ButtonGroup, DeleteOutlineIcon, HandleIcon } from '@/ui';
import { useLayerStoreActions, useLayersDisplayState } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeLayersViewDisplayState } from '../types';

export function LayersActions(): JSX.Element {
  const { t } = useTranslation<string>();

  // access store
  const displayState = useLayersDisplayState();
  const { setDisplayState } = useLayerStoreActions();

  const handleSetDisplayState = function (newState: TypeLayersViewDisplayState) {
    setDisplayState(newState);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'right', marginBottom: '15px' }}>
      <ButtonGroup size="small" variant="outlined" aria-label="outlined button group">
        <Button
          variant={displayState === 'add' ? 'contained' : 'outlined'}
          startIcon={<AddCircleOutlineIcon fontSize="small" />}
          onClick={() => handleSetDisplayState('add')}
        >
          {t('general.add')}
        </Button>
        <Button
          variant={displayState === 'order' ? 'contained' : 'outlined'}
          startIcon={<HandleIcon fontSize="small" />}
          onClick={() => handleSetDisplayState('order')}
        >
          {t('legend.re-arrange')}
        </Button>
        <Button
          variant={displayState === 'remove' ? 'contained' : 'outlined'}
          startIcon={<DeleteOutlineIcon fontSize="small" />}
          onClick={() => handleSetDisplayState('remove')}
        >
          {t('general.remove')}
        </Button>
      </ButtonGroup>
    </Box>
  );
}
