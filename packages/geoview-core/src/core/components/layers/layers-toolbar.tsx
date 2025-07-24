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
  // Log
  logger.logTraceRender('components/layers/layers-toolbar');

  // Hooks
  const theme = useTheme();
  const { t } = useTranslation<string>();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const userClickedAdd = useRef(false);

  const layerToolbarStyle = {
    padding: '0 18px 4px 0',
    '& .MuiButton-startIcon': { [theme.breakpoints.down('md')]: { margin: 0, padding: '0 0.25rem' } },
    '& .MuiButtonGroup-root': { backgroundColor: theme.palette.geoViewColor.bgColor.light[300] },
  };

  // Store
  const displayState = useLayerDisplayState();
  const legendLayers = useLayerLegendLayers();
  const { setDisplayState } = useLayerStoreActions();

  // State
  const lastDisplayState = useRef<TypeLayersViewDisplayState | null>(null);

  /**
   * Handles toolbar button clicks and sets the appropriate display state.
   * For the Add button, it sets a flag to prevent auto-switching back to view mode.
   */
  const handleSetDisplayState = useCallback(
    (displayStateParam: TypeLayersViewDisplayState): void => {
      logger.logTraceUseCallback('LAYER TOOLBAR - handleSetDisplayState', displayStateParam);

      // If user clicks Add, set the flag
      if (displayStateParam === 'add') {
        userClickedAdd.current = true;
      } else {
        userClickedAdd.current = false;
      }

      setDisplayState(displayStateParam);
    },
    [setDisplayState]
  );

  /**
   * Primary effect for handling display state logic.
   * - Forces 'add' state when no layers exist
   * - Tracks display state changes
   * - Resets flags when transitioning away from 'add' state
   */
  useEffect(() => {
    // Always show 'add' panel when there are no layers
    if (legendLayers.length === 0 && displayState !== 'add') {
      setDisplayState('add');
    }

    // Track display state changes to handle transitions
    if (lastDisplayState.current !== displayState) {
      lastDisplayState.current = displayState;

      // Reset the userClickedAdd flag when leaving 'add' state
      if (displayState !== 'add') {
        userClickedAdd.current = false;
      }
    }
  }, [displayState, legendLayers.length, setDisplayState]);

  /**
   * Secondary effect specifically for auto-switching to view mode.
   * Only runs when the layer count changes to avoid race conditions.
   * Auto-switches from 'add' to 'view' only when:
   * 1. Layers exist
   * 2. Current state is 'add'
   * 3. User didn't explicitly click the Add button
   */
  useEffect(() => {
    if (legendLayers.length > 0 && displayState === 'add' && !userClickedAdd.current) {
      setDisplayState('view');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legendLayers.length]); // Only depend on legendLayers.length

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
