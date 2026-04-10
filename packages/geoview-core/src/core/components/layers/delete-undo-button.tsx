import type { KeyboardEvent, MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, CircularProgressBase, DeleteOutlineIcon, IconButton, UndoIcon } from '@/ui';
import { useStoreLayerDeletionStartTime } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { logger } from '@/core/utils/logger';
import { TIMEOUT } from '@/core/utils/constant';
import { useLayerController } from '@/core/controllers/use-controllers';

interface UndoButtonProps {
  progressValue: number;
  onUndo: (event: MouseEvent) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
  iconRef: React.RefObject<HTMLButtonElement>;
}

function UndoButtonWithProgress(props: UndoButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/delete-undo-button/UndoButtonWithProgress');

  const { t } = useTranslation<string>();

  const { progressValue, onUndo, handleKeyDown, iconRef } = props;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }} onClick={onUndo}>
      <CircularProgressBase
        variant="determinate"
        size={40}
        value={progressValue}
        sx={{
          '& .MuiCircularProgress-circle': {
            transition: 'none', // completely disable transitions so it doesn't mess up the progress animation, which relies on requestAnimationFrame and smooth updates to the value prop. If transition is not set to none, the progress circle will only update on weird force renders.
          },
        }}
      />
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

interface DeleteUndoButtonProps {
  layerPath: string;
  layerRemovable: boolean;
  focusTargetIdAfterDelete?: string;
}

export function DeleteUndoButton(props: DeleteUndoButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/delete-undo-button/DeleteUndoButton');

  const { layerPath, layerRemovable, focusTargetIdAfterDelete } = props;

  const { t } = useTranslation<string>();

  // Refs for buttons to manage focus
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const undoButtonRef = useRef<HTMLButtonElement>(null);

  // Store hooks
  const layerDeletionStartTime = useStoreLayerDeletionStartTime(layerPath);
  const layerController = useLayerController();

  // state
  const [progress, setProgress] = useState(0);

  /**
   * Performs the delete operation on the layer.
   *
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
    layerController
      .deleteLayerStartTimer(layerPath, TIMEOUT.deleteLayerUndoWindow)
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
   *
   * @param wasKeyboardActivated - Indicates if the delete was activated via the keyboard or not.
   */
  const performUndo = (wasKeyboardActivated: boolean): void => {
    // Call the action
    layerController.deleteLayerAbort(layerPath);

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

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('components/layers/delete-undo-button/DeleteUndoButton', layerDeletionStartTime);

    // If no deletion happening
    if (!layerDeletionStartTime) return undefined;

    // Use requestAnimationFrame to update the progress percentage instead of relying on a value
    // constantly being updated coming from the store, for performance.
    // RAF syncs with the browser repaint cycle for smoother animation and auto-pauses when the tab is hidden.
    // For the RAF to work, the transition on the MuiCircularProgress-circle component must be set to none,
    // otherwise it will cause the progress circle to only update on weird force renders.
    let frameId: number;
    const animate = (): void => {
      const elapsed = Date.now() - layerDeletionStartTime;
      const pct = Math.min((elapsed / TIMEOUT.deleteLayerUndoWindow) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        frameId = requestAnimationFrame(animate);
      }
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [layerDeletionStartTime]);

  // Never hide the remove icon, so user can remove forever loading/processing layers.
  if (layerRemovable && !layerDeletionStartTime) {
    return (
      <IconButton
        iconRef={deleteButtonRef}
        onClick={handleDeleteClick}
        className="buttonOutline"
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
        disabled
      >
        <DeleteOutlineIcon color="disabled" />
      </IconButton>
    );
  }
  return (
    <UndoButtonWithProgress
      iconRef={undoButtonRef}
      progressValue={progress}
      onUndo={handleUndoClick}
      handleKeyDown={handleUndoDeleteKeyDown}
    />
  );
}
