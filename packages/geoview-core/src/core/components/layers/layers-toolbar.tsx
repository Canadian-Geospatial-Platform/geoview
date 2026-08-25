import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material';

import { Box, AddCircleOutlineIcon, Button } from '@/ui';
import type { SxStyles } from '@/ui/style/types';
import { ToggleAll } from '@/core/components/toggle-all/toggle-all';
import { useStoreLayerDisplayState, useStoreLayerTopLevelLayerPaths } from '@/core/stores/states/layer-state';
import type { TypeLayersViewDisplayState } from './types';
import { logger } from '@/core/utils/logger';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useLayerController } from '@/core/controllers/use-controllers';
import { getSxClasses } from './layers-toolbar-style';

interface TypeLayersToolbar {
  containerType: TypeContainerBox;
}

/**
 * Creates the layers toolbar component.
 *
 * @param props - Properties defined in TypeLayersToolbar interface
 * @returns The layers toolbar component
 */
export function LayersToolbar({ containerType }: TypeLayersToolbar): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/layers-toolbar');

  // Hooks
  const theme = useTheme();
  const { t } = useTranslation<string>();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const userClickedAdd = useRef(false);

  const memoSxClasses = useMemo((): SxStyles => {
    return getSxClasses(theme);
  }, [theme]);

  // Store
  const mapId = useStoreGeoViewMapId();
  const displayState = useStoreLayerDisplayState();
  const layerPaths = useStoreLayerTopLevelLayerPaths();
  const layerController = useLayerController();

  // State
  const lastDisplayState = useRef<TypeLayersViewDisplayState | null>(null);

  /**
   * Handles toolbar button clicks and sets the appropriate display state.
   * For the Add button, it sets a flag to prevent auto-switching back to view mode.
   */
  const handleSetDisplayState = useCallback(
    (displayStateParam: TypeLayersViewDisplayState): void => {
      // If user clicks Add, set the flag
      if (displayStateParam === 'add') {
        userClickedAdd.current = true;
      } else {
        userClickedAdd.current = false;
      }

      layerController.setLayerDisplayState(displayStateParam);
    },
    [layerController]
  );

  /**
   * Primary effect for handling display state logic.
   * - Forces 'add' state when no layers exist
   * - Tracks display state changes
   * - Resets flags when transitioning away from 'add' state
   * - Restores focus when user cancels
   */
  useEffect(() => {
    logger.logTraceUseEffect('LAYERS-TOOLBAR - display state logic', displayState, layerPaths.length);
    // Always show 'add' panel when there are no layers
    if (layerPaths.length === 0 && displayState !== 'add') {
      layerController.setLayerDisplayState('add');
    }

    // Track display state changes to handle transitions
    if (lastDisplayState.current !== displayState) {
      lastDisplayState.current = displayState;

      // Restore focus to Add button when user cancels (before resetting the userClickedAdd flag)
      if (displayState === 'view' && userClickedAdd.current) {
        requestAnimationFrame(() => {
          addButtonRef.current?.focus();
        });
      }

      // Reset the userClickedAdd flag when leaving 'add' state
      if (displayState !== 'add') {
        userClickedAdd.current = false;
      }
    }
  }, [displayState, layerPaths.length, layerController]);

  /**
   * Secondary effect specifically for auto-switching to view mode.
   * Only runs when the layer count changes to avoid race conditions.
   * Auto-switches from 'add' to 'view' only when:
   * 1. Layers exist
   * 2. Current state is 'add'
   * 3. User didn't explicitly click the Add button
   */
  useEffect(() => {
    logger.logTraceUseEffect('LAYERS-TOOLBAR - auto-switch to view mode', layerPaths.length);
    if (layerPaths.length > 0 && displayState === 'add' && !userClickedAdd.current) {
      layerController.setLayerDisplayState('view');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerPaths.length, layerController]); // Only depend on layerPaths.length and layerController

  return (
    <Box id={`${mapId}-${containerType}-layers-toolbar`} sx={memoSxClasses.container}>
      <Button
        ref={addButtonRef}
        makeResponsive
        type="text"
        size="small"
        tooltip={t('legend.addLayer')}
        tooltipPlacement="top"
        variant={displayState === 'add' ? 'contained' : 'outlined'}
        startIcon={<AddCircleOutlineIcon />}
        onClick={() => handleSetDisplayState('add')}
        sx={memoSxClasses.addButton}
      >
        {t('legend.addLayer')}
      </Button>
      <ToggleAll source="layers" containerType={containerType} />
    </Box>
  );
}
