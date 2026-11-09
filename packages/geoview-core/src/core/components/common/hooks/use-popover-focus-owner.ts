import { useCallback, useEffect, useRef } from 'react';
import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { getStoreUIFocusItem, type FocusItemProps } from '@/core/stores/states/ui-state';
import { logger } from '@/core/utils/logger';

/** Shared ownership operations; consumers retain their own dismissal and trigger-focus policies. */
interface PopoverFocusOwner {
  /** Captures the previous owner once, before opening clears or replaces it. */
  rememberPreviousOwner: (previousFocusItem?: FocusItemProps) => void;
  /** Takes ownership without moving DOM focus. */
  claimFocusOwner: (previousFocusItem?: FocusItemProps) => void;
  /** Restores the previous owner only if this popover still owns focus, then discards the snapshot. */
  releaseFocusOwner: () => void;
  /** Discards a snapshot when yielding without restoring ownership. */
  discardPreviousOwner: () => void;
  /** Coordinates unowned acquisition, superseding owners, and external closure. */
  synchronizeOwnership: (open: boolean, keyboardMode: boolean) => void;
}

/**
 * Shares map-scoped focus ownership without deciding when to focus a popover's trigger.
 *
 * @param ownerId - The popover's focus-owner identifier
 * @param buttonId - The trigger identifier registered with the focus owner
 * @param close - Closes the popover without moving DOM focus
 * @returns Ownership operations for the consumer's opening handlers and lifecycle effects
 */
export function usePopoverFocusOwner(ownerId: string, buttonId: string | undefined, close: () => void): PopoverFocusOwner {
  const mapId = useStoreGeoViewMapId();
  const uiController = useUIController();
  const previousFocusItemRef = useRef<FocusItemProps | undefined>(undefined);
  const previousOpenRef = useRef(false);

  /**
   * Preserves the pre-open snapshot across status echoes and subsequent ownership acquisition.
   *
   * @param previousFocusItem - The snapshot returned by useMapPopover before closing other popovers
   */
  const rememberPreviousOwner = useCallback(
    (previousFocusItem?: FocusItemProps): void => {
      if (previousFocusItemRef.current === undefined) previousFocusItemRef.current = previousFocusItem ?? getStoreUIFocusItem(mapId);
    },
    [mapId]
  );

  /**
   * Acquires ownership without an entry-focus jump.
   *
   * @param previousFocusItem - The pre-open owner, when opening has already changed the store
   */
  const claimFocusOwner = useCallback(
    (previousFocusItem?: FocusItemProps): void => {
      if (getStoreUIFocusItem(mapId).activeElementId === ownerId) return;
      rememberPreviousOwner(previousFocusItem);
      uiController.enableFocusTrap({ activeElementId: ownerId, callbackElementId: buttonId || false, focusOnEntry: false });
    },
    [buttonId, mapId, ownerId, rememberPreviousOwner, uiController]
  );

  /** Discards stale ownership when yielding to a newer panel or modal. */
  const discardPreviousOwner = useCallback((): void => {
    previousFocusItemRef.current = undefined;
  }, []);

  /** Restores ownership only while this popover remains the current owner. */
  const releaseFocusOwner = useCallback((): void => {
    if (getStoreUIFocusItem(mapId).activeElementId === ownerId) {
      uiController.enableFocusTrap({
        ...(previousFocusItemRef.current ?? { activeElementId: false, callbackElementId: false }),
        focusOnEntry: false,
      });
    }
    discardPreviousOwner();
  }, [discardPreviousOwner, mapId, ownerId, uiController]);

  /**
   * Releases ownership when the popover is removed while the map remains mounted.
   */
  useEffect((): (() => void) => {
    logger.logTraceUseEffect('USE-POPOVER-FOCUS-OWNER - unmount cleanup', releaseFocusOwner);
    return releaseFocusOwner;
  }, [releaseFocusOwner]);

  /**
   * Coordinates the common lifecycle while leaving mode-specific policies to Settings.
   *
   * @param open - Whether the popover is currently open
   * @param keyboardMode - Whether keyboard navigation is enabled
   */
  const synchronizeOwnership = useCallback(
    (open: boolean, keyboardMode: boolean): void => {
      // Other effects may have changed ownership since the consumer rendered.
      const currentFocusItem = getStoreUIFocusItem(mapId);
      if (open && currentFocusItem.activeElementId && currentFocusItem.activeElementId !== ownerId) {
        discardPreviousOwner();
        close();
      } else if (open && keyboardMode && currentFocusItem.activeElementId !== ownerId) {
        claimFocusOwner();
      }

      // External closure must release ownership without returning focus to the trigger.
      const wasOpen = previousOpenRef.current;
      previousOpenRef.current = open;
      if (wasOpen && !open) {
        releaseFocusOwner();
      }
    },
    [claimFocusOwner, close, discardPreviousOwner, mapId, ownerId, releaseFocusOwner]
  );

  return { rememberPreviousOwner, claimFocusOwner, releaseFocusOwner, discardPreviousOwner, synchronizeOwnership };
}
