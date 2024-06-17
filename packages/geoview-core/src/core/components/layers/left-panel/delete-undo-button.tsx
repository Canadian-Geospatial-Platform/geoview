import { useEffect, useState } from 'react';
import { Box, CircularProgressBase, DeleteOutlineIcon, IconButton, UndoIcon } from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { LAYER_STATUS } from '@/core/utils/constant';

interface DeleteUndoButtonProps {
  layer: TypeLegendLayer;
}

interface UndoButtonProps {
  progressValue: number;
  onUndo: () => void;
}

function UndoButtonWithProgress(props: UndoButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/delete-undo-button/UndoButtonWithProgress');

  const { progressValue, onUndo } = props;
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
        <IconButton edge="end" size="small">
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

  // Hide remove layer icon when layer status is loading or processing.
  if (layer.layerStatus === LAYER_STATUS.LOADING || layer.layerStatus === LAYER_STATUS.PROCESSING) {
    return <Box />;
  }
  if (!inUndoState && layer.controls?.remove !== false && !getLayerDeleteInProgress()) {
    return (
      <IconButton onClick={handleDeleteClick} edge="end" size="small">
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
  return <UndoButtonWithProgress progressValue={progress} onUndo={handleUndoClick} />;
}
