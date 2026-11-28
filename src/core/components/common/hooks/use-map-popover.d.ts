import { type FocusItemProps } from '@/core/stores/states/ui-state';
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
export declare function useMapPopover(): MapPopoverState;
export {};
//# sourceMappingURL=use-map-popover.d.ts.map