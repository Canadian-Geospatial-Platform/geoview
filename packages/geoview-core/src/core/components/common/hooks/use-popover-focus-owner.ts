import { useCallback, useEffect, useRef } from 'react';
import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreGeoViewMapId, type GeoviewStoreType } from '@/core/stores/geoview-store';
import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import { getStoreUIFocusItem, type FocusItemProps } from '@/core/stores/states/ui-state';
import { logger } from '@/core/utils/logger';
import { buildAppBarFocusTrapId, buildTabId, isAppBarFocusTrapId } from '@/core/utils/element-id';

/**
 * Return owners belong to a store instance, not a reusable map ID. Weak keys do not retain destroyed stores;
 * release/yield/unmount still remove individual entries explicitly rather than relying on garbage collection.
 */
const previousPopoverOwners = new WeakMap<GeoviewStoreType, Map<string, FocusItemProps>>();

/**
 * Resolves the return owner before opening a popover closes the outgoing popover.
 *
 * Snapshots are flattened on capture: replacing About with a navbar panel inherits About's
 * return owner, not About itself. Resolve synchronously before close effects discard that snapshot.
 *
 * @param mapId - The map whose popovers will close
 * @returns The underlying panel owner, or the current owner when it is not a tracked popover
 */
export function getPopoverReturnFocusItem(mapId: string): FocusItemProps {
  const store = getGeoViewStore(mapId);
  const current = store.getState().uiState.focusItem;
  return (current.activeElementId && previousPopoverOwners.get(store)?.get(current.activeElementId)) || current;
}

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
  const store = useGeoViewStore();
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
      if (previousFocusItemRef.current !== undefined) return;
      const previousOwner = previousFocusItem ?? getPopoverReturnFocusItem(mapId);
      previousFocusItemRef.current = previousOwner;
      const mapOwners = previousPopoverOwners.get(store) ?? new Map<string, FocusItemProps>();
      mapOwners.set(ownerId, previousOwner);
      previousPopoverOwners.set(store, mapOwners);
    },
    [mapId, ownerId, store]
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
    const mapOwners = previousPopoverOwners.get(store);
    mapOwners?.delete(ownerId);
    if (mapOwners?.size === 0) previousPopoverOwners.delete(store);
  }, [ownerId, store]);

  /** Restores only this live store's owner; always discards the snapshot, even if restoration throws. */
  const releaseFocusOwner = useCallback((): void => {
    try {
      // Late cleanup must not restore ownership into a replacement viewer using the same map ID.
      if (getGeoViewStore(mapId) === store && store.getState().uiState.focusItem.activeElementId === ownerId) {
        let previousOwner = previousFocusItemRef.current;
        const { activeAppBarTab, activeFooterBarTab, footerTabs, hiddenTabs } = store.getState().uiState;
        const previousOwnerId = previousOwner?.activeElementId;

        // An AppBar panel may have closed or switched while this popover owned focus.
        if (
          isAppBarFocusTrapId(mapId, previousOwnerId) &&
          (!activeAppBarTab.isOpen ||
            !activeAppBarTab.isFocusTrapped ||
            previousOwnerId !== buildAppBarFocusTrapId(mapId, activeAppBarTab.tabId))
        ) {
          previousOwner = undefined;
        }
        // Footer tabs may be switched, collapsed, hidden, or removed while the popover is open.
        if (previousOwnerId && previousOwnerId.startsWith(buildTabId(mapId, ''))) {
          const { tabId, isOpen } = activeFooterBarTab;
          const tabExists = footerTabs.some((tab) => tab.id === tabId) || (tabId === 'guide' && footerTabs.length > 0);
          if (!isOpen || !tabId || !tabExists || hiddenTabs.includes(tabId) || previousOwnerId !== buildTabId(mapId, tabId)) {
            previousOwner = undefined;
          }
        }
        uiController.enableFocusTrap({
          ...(previousOwner ?? { activeElementId: false, callbackElementId: false }),
          focusOnEntry: false,
        });
      }
    } finally {
      discardPreviousOwner();
    }
  }, [discardPreviousOwner, mapId, ownerId, store, uiController]);

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
