import type { KeyboardEvent, MouseEvent } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgressBase, DeleteOutlineIcon, IconButton, UndoIcon } from '@/ui';
import {
  useLayerSelectorDeletionProgressPercentage,
  useLayerStoreActions,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { logger } from '@/core/utils/logger';

interface DeleteUndoButtonProps {
  layerPath: string;
  layerRemovable: boolean;
  focusTargetIdAfterDelete?: string;
}

interface UndoButtonProps {
  progressValue: number;
  onUndo: (event: MouseEvent) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  iconRef: React.RefObject<HTMLButtonElement>;
}

function UndoButtonWithProgress(props: UndoButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/delete-undo-button/UndoButtonWithProgress');

  const { t } = useTranslation<string>();

  const { progressValue, onUndo, handleKeyDown, iconRef } = props;
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
        <IconButton iconRef={iconRef} aria-label={t('layers.undoLayer')} edge="end" size="small" onKeyDown={handleKeyDown}>
          <UndoIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export function DeleteUndoButton(props: DeleteUndoButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/right-panel/delete-undo-button/DeleteUndoButton');

  const { layerPath, layerRemovable, focusTargetIdAfterDelete } = props;

  const { t } = useTranslation<string>();

  // Refs for buttons to manage focus
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const undoButtonRef = useRef<HTMLButtonElement>(null);

  // get store actions
  const { deleteLayer, deleteLayerAbort } = useLayerStoreActions();
  const layerDeletionProgressPercentage = useLayerSelectorDeletionProgressPercentage(layerPath);

  /**
   * Performs the delete operation on the layer.
   * @param wasKeyboardActivated - Indicates if the delete was activated via the keyboard or not.
   */
  const performDelete = (wasKeyboardActivated: boolean): void => {
    // If was keyboard activated on clicking
    if (wasKeyboardActivated) {
      requestAnimationFrame(() => {
        // Focus on the undo button ref now
        undoButtonRef.current?.focus();
      });
    }

    // Delete the layer
    deleteLayer(layerPath)
      .then((deleted) => {
        // If deleted, set focus elsewhere
        if (deleted && focusTargetIdAfterDelete) {
          const targetId = focusTargetIdAfterDelete;
          requestAnimationFrame(() => {
            document.getElementById(targetId)?.focus();
          });
        }
      })
      .catch((error: unknown) => {
        // Log error
        logger.logPromiseFailed('in deleteLayer in handleDeleteClick', error);
      });
  };

  /**
   * Performs the undo operation on the layer.
   * @param wasKeyboardActivated - Indicates if the delete was activated via the keyboard or not.
   */
  const performUndo = (wasKeyboardActivated: boolean): void => {
    // Call the action
    deleteLayerAbort(layerPath);

    // If was keyboard activated on clicking
    if (wasKeyboardActivated) {
      // Focus on the delete button ref now
      requestAnimationFrame(() => deleteButtonRef.current?.focus());
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteClick = (event: MouseEvent): void => {
    performDelete(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUndoClick = (event: MouseEvent): void => {
    performUndo(false);
  };

  const handleDeleteKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      performDelete(true);
    }
  };

  const handleUndoDeleteKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      performUndo(true);
    }
  };

  // Never hide the remove icon, so user can remove forever loading/processing layers.
  if (layerRemovable && layerDeletionProgressPercentage === undefined) {
    return (
      <IconButton
        iconRef={deleteButtonRef}
        onClick={handleDeleteClick}
        className="buttonOutline"
        edge="end"
        size="small"
        onKeyDown={handleDeleteKeyDown}
        aria-label={t('layers.deleteLayer')}
      >
        <DeleteOutlineIcon color="error" />
      </IconButton>
    );
  }
  if (!layerRemovable) {
    return (
      <IconButton
        iconRef={deleteButtonRef}
        aria-label={t('layers.deleteLayer')}
        onClick={handleDeleteClick}
        className="buttonOutline"
        edge="end"
        size="small"
        disabled
      >
        <DeleteOutlineIcon color="disabled" />
      </IconButton>
    );
  }
  return (
    <UndoButtonWithProgress
      iconRef={undoButtonRef}
      progressValue={layerDeletionProgressPercentage ?? 0}
      onUndo={handleUndoClick}
      handleKeyDown={handleUndoDeleteKeyDown}
    />
  );
}
