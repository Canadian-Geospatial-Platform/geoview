import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Button } from '@mui/material';
import { Box, Typography, Stack, ExpandIcon, RemoveCircleOutlineIcon, AddCircleOutlineIcon, ButtonGroup } from '@/ui';
import { getSxClasses } from '../layers-style';
import { useLayerStoreActions, useLayersDisplayState } from '@/core/stores/store-interface-and-intial-values/layer-state';

export function LayersActions(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  //access store
  const displayState = useLayersDisplayState();
  const { setDisplayState } = useLayerStoreActions();


  const handleSetDisplayState = function(newState: string) {
    setDisplayState(newState);
  }

  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
      <div>
        <Typography sx={sxClasses.categoryTitle}>{t('general.layers')}</Typography>
      </div>

      <ButtonGroup size="small" variant="outlined" aria-label="outlined button group">
      <Button
          variant={displayState === 'add' ? "contained" : 'outlined'}
          startIcon={<AddCircleOutlineIcon fontSize="small" />}
          onClick={() => handleSetDisplayState('add')}
        >
          {t('general.add')}
        </Button>
      <Button
          variant={displayState === 'order' ? "contained" : 'outlined'}
          startIcon={<ExpandIcon fontSize="small" />}
          onClick={() => handleSetDisplayState('order')}
        >
          {t('legend.re-arrange')}
        </Button>
        <Button
          variant={displayState === 'remove' ? "contained" : 'outlined'}
          startIcon={<RemoveCircleOutlineIcon fontSize="small" />}
          onClick={() => handleSetDisplayState('remove')}
        >
          {t('general.remove')}
        </Button>
    </ButtonGroup>

    </Box>
  );
}
