import { useEffect, useState } from 'react';
import { Box, CircularProgressBase, DeleteOutlineIcon, IconButton, UndoIcon } from '@/ui';
import { TypeLegendLayer } from '../types';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';

interface DeleteUndoButtonProps {
  layer: TypeLegendLayer;
}

interface UndoButtonProps {
  progressValue: number;
  onUndo: () => void;
}

function UndoButtonWithProgress(props: UndoButtonProps): JSX.Element {
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
  const { layer } = props;

  const [progress, setProgress] = useState(10);
  const [inUndoState, setInUndoState] = useState(false);

  // get store actions
  const { deleteLayer } = useLayerStoreActions();

  const handleDeleteClick = () => {
    setInUndoState(true);
  };

  const handleUndoClick = () => {
    setInUndoState(false);
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
      }, 250);
      return () => {
        clearInterval(timer);
      };
    }
    setProgress(0);
    return undefined;
  }, [inUndoState]);

  if (!inUndoState) {
    return (
      <IconButton onClick={handleDeleteClick} edge="end" size="small">
        <DeleteOutlineIcon color="error" />
      </IconButton>
    );
  }
  return <UndoButtonWithProgress progressValue={progress} onUndo={handleUndoClick} />;
}
