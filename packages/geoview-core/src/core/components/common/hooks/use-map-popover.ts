import { useCallback, useState } from 'react';
import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import {
  getStoreUIFocusItem,
  getStoreUIPopoverCloseVersion,
  useStoreUIPopoverCloseVersion,
  type FocusItemProps,
} from '@/core/stores/states/ui-state';

/** The open state and handlers of a map-control popover. */
interface MapPopoverState {
  /** Whether the popover is open. */
  open: boolean;
  /** The element the popover is anchored to, or null when closed. */
  anchorEl: HTMLElement | null;
  /** Opens the popover and returns the focus owner that was active before it opened. */
  openAt: (element: HTMLElement) => FocusItemProps;
  /** Closes the popover. */
  close: () => void;
}

/**
 * Tracks the open state of a map-control popover. Closes when another popover opens on the same map
 * or a map popover close request is issued (for example, Ctrl+M).
 *
 * Openness is derived during render from the close-request version rather than reset in an effect: an effect
 * schedules a second render whose focus-trap cleanup can run after the map has been focused.
 *
 * @returns The popover open state, anchor element and open/close handlers
 */
export function useMapPopover(): MapPopoverState {
  const popoverCloseVersion = useStoreUIPopoverCloseVersion();
  const mapId = useStoreGeoViewMapId();
  const uiController = useUIController();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [openedAtCloseVersion, setOpenedAtCloseVersion] = useState<number>(popoverCloseVersion);

  const open = anchorEl !== null && openedAtCloseVersion === popoverCloseVersion;

  /**
   * Closes other popovers on the same map, then opens this one anchored to the given element.
   *
   * @param element - The element to anchor the popover to
   */
  const openAt = useCallback(
    (element: HTMLElement): FocusItemProps => {
      const previousFocusItem = getStoreUIFocusItem(mapId);
      uiController.closeMapPopovers();
      // Read the updated close-request version so this new popover is not closed by the request above.
      setOpenedAtCloseVersion(getStoreUIPopoverCloseVersion(mapId));
      setAnchorEl(element);
      return previousFocusItem;
    },
    [mapId, uiController]
  );

  /**
   * Closes the popover.
   */
  const close = useCallback((): void => setAnchorEl(null), []);

  return { open, anchorEl, openAt, close };
}
