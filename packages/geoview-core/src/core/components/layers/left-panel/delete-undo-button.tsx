import { useEffect, useState, KeyboardEvent } from 'react';
import { Box, CircularProgressBase, DeleteOutlineIcon, IconButton, UndoIcon } from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';

interface DeleteUndoButtonProps {
  layer: TypeLegendLayer;
}

interface UndoButtonProps {
  progressValue: number;
  onUndo: () => void;
  handleKeyDown: (e: KeyboardEvent) => void;
}

function UndoButtonWithProgress(props: UndoButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/delete-undo-button/UndoButtonWithProgress');

  const { progressValue, onUndo, handleKeyDown } = props;
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }} onClick={onUndo}>
      <CircularProgressBase variant="determinate" size={40} value={progressValue} />
      <Box
        style={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconButton edge="end" size="small" onKeyDown={(e) => handleKeyDown(e)}>
          <UndoIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export function DeleteUndoButton(props: DeleteUndoButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/delete-undo-button/DeleteUndoButton');

  const { layer } = props;

  const [progress, setProgress] = useState(10);
  const [inUndoState, setInUndoState] = useState(false);

  // get store actions
  const { deleteLayer, setLayerDeleteInProgress, getLayerDeleteInProgress } = useLayerStoreActions();
  const { getVisibilityFromOrderedLayerInfo, setOrToggleLayerVisibility } = useMapStoreActions();
  const { setSelectedFooterLayerListItemId } = useUIStoreActions();

  const handleDeleteClick = (): void => {
    if (getVisibilityFromOrderedLayerInfo(layer.layerPath)) setOrToggleLayerVisibility(layer.layerPath);
    setInUndoState(true);
    setLayerDeleteInProgress(true);
  };

  const handleUndoClick = (): void => {
    setOrToggleLayerVisibility(layer.layerPath);
    setInUndoState(false);
    setLayerDeleteInProgress(false);
  };

  const handleDeleteKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDeleteClick();
      setSelectedFooterLayerListItemId(layer.layerId);
    }
  };

  const handleUndoDeleteKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleUndoClick();
      setSelectedFooterLayerListItemId('');
      e.preventDefault();
    }
  };

  // Make sure there is no pending state on unmount. If not, it can stay in progress forever...
  // If user switch panel when action is in progress
  useEffect(() => {
    return () => {
      setInUndoState(false);
      setLayerDeleteInProgress(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (progress === 100) {
      deleteLayer(layer.layerPath);
      setInUndoState(false);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  useEffect(() => {
    if (inUndoState) {
      const timer = setInterval(() => {
        setProgress((prevProgress) => (prevProgress >= 100 ? 0 : prevProgress + 5));
      }, 90);
      return () => {
        clearInterval(timer);
      };
    }
    setProgress(0);
    return undefined;
  }, [inUndoState]);

  // Never hide the remove icon, so user can remove forever loading/processing layers.
  if (!inUndoState && layer.controls?.remove !== false && !getLayerDeleteInProgress()) {
    return (
      <IconButton onClick={handleDeleteClick} edge="end" size="small" onKeyDown={(e) => handleDeleteKeyDown(e)}>
        <DeleteOutlineIcon color="error" />
      </IconButton>
    );
  }
  if (!inUndoState) {
    return (
      <IconButton onClick={handleDeleteClick} edge="end" size="small" disabled>
        <DeleteOutlineIcon color="disabled" />
      </IconButton>
    );
  }
  return <UndoButtonWithProgress progressValue={progress} onUndo={handleUndoClick} handleKeyDown={handleUndoDeleteKeyDown} />;
}
