import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import { useCallback, useEffect, useRef } from 'react';
import { Box, AddCircleOutlineIcon, ButtonGroup, DeleteOutlineIcon, HandleIcon, VisibilityOutlinedIcon, Button } from '@/ui';
import { ToggleAll } from '../toggle-all/toggle-all';
import {
  useLayerStoreActions,
  useLayerDisplayState,
  useLayerLegendLayers,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeLayersViewDisplayState } from './types';
import { logger } from '@/core/utils/logger';

export function LayersToolbar(): JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation<string>();
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const layerToolbarStyle = {
    padding: '8px 18px 4px 8px',
    '& .MuiButton-startIcon': { [theme.breakpoints.down('md')]: { margin: 0, padding: '0 0.25rem' } },
  };

  // access store
  const displayState = useLayerDisplayState();
  const legendLayers = useLayerLegendLayers();
  const { setDisplayState } = useLayerStoreActions();

  const handleSetDisplayState = useCallback(
    (dispState: TypeLayersViewDisplayState): void => {
      logger.logTraceUseCallback('LAYER TOOLBAR - handleSetDisplayState', dispState);

      setDisplayState(dispState);
    },
    [setDisplayState]
  );

  useEffect((): void => {
    if (displayState !== 'add' && legendLayers.length === 0) setDisplayState('add');
  }, [displayState, legendLayers.length, setDisplayState]);

  return (
    <Box id="layers-toolbar" sx={layerToolbarStyle}>
      <ButtonGroup size="small" variant="outlined" aria-label="outlined button group">
        <Button
          makeResponsive
          type="text"
          disabled={!legendLayers.length}
          size="small"
          tooltip={t('general.view')!}
          variant={displayState === 'view' ? 'contained' : 'outlined'}
          startIcon={<VisibilityOutlinedIcon fontSize={theme.palette.geoViewFontSize.sm} />}
          onClick={() => handleSetDisplayState('view')}
        >
          {t('general.view')}
        </Button>
        <Button
          ref={addButtonRef}
          makeResponsive
          type="text"
          size="small"
          tooltip={t('legend.addLayer')!}
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
          tooltip={t('legend.sortLayers')!}
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
          tooltip={t('legend.removeLayer')!}
          variant={displayState === 'remove' ? 'contained' : 'outlined'}
          startIcon={<DeleteOutlineIcon fontSize={theme.palette.geoViewFontSize.sm} />}
          onClick={() => handleSetDisplayState('remove')}
        >
          {t('general.remove')}
        </Button>
      </ButtonGroup>
      <ToggleAll source="layers" />
    </Box>
  );
}
