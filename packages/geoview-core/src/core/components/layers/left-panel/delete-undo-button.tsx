import { useEffect, useState, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgressBase, DeleteOutlineIcon, IconButton, UndoIcon } from '@/ui';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useMapStoreActions, useSelectorLayerVisibility } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';

interface DeleteUndoButtonProps {
  layerPath: string;
  layerId: string;
  layerRemovable: boolean;
}

interface UndoButtonProps {
  progressValue: number;
  onUndo: () => void;
  handleKeyDown: (event: KeyboardEvent) => void;
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

  const { layerPath, layerId, layerRemovable } = props;

  const { t } = useTranslation<string>();

  const [progress, setProgress] = useState(10);
  const [inUndoState, setInUndoState] = useState(false);

  // get store actions
  const { deleteLayer, setLayerDeleteInProgress, getLayerDeleteInProgress } = useLayerStoreActions();
  const { setOrToggleLayerVisibility, removeLayerHighlights } = useMapStoreActions();
  const { setSelectedFooterLayerListItemId } = useUIStoreActions();
  const isVisible = useSelectorLayerVisibility(layerPath);

  const handleDeleteClick = (): void => {
    if (isVisible) setOrToggleLayerVisibility(layerPath);
    removeLayerHighlights(layerPath);
    setInUndoState(true);
    setLayerDeleteInProgress(layerPath);
  };

  const handleUndoClick = (): void => {
    setOrToggleLayerVisibility(layerPath);
    setInUndoState(false);
    setLayerDeleteInProgress('');
  };

  const handleDeleteKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleDeleteClick();
      setSelectedFooterLayerListItemId(layerId);
    }
  };

  const handleUndoDeleteKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      handleUndoClick();
      setSelectedFooterLayerListItemId('');
      event.preventDefault();
    }
  };

  // Make sure there is no pending state on unmount. If not, it can stay in progress forever...
  // If user switch panel when action is in progress
  useEffect(() => {
    return () => {
      setInUndoState(false);
      setLayerDeleteInProgress('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (progress === 100) {
      deleteLayer(layerPath);
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
  if (!inUndoState && layerRemovable && !getLayerDeleteInProgress()) {
    return (
      <IconButton
        onClick={handleDeleteClick}
        edge="end"
        size="small"
        onKeyDown={(e) => handleDeleteKeyDown(e)}
        tooltip={t('layers.deleteLayer')!}
      >
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
