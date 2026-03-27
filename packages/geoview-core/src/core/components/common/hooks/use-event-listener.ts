import { useRef, useEffect } from 'react';
import { logger } from '@/core/utils/logger';

/**
 * A custom hook that handles the addition and removal of event listeners.
 *
 * Uses useRef and useEffect to ensure that the latest handler is used
 * without causing the effect to re-run on handler changes.
 *
 * @param eventName - The name of the event to listen to (e.g., 'click', 'resize', 'mousemove')
 * @param handler - The callback function to be called when the event occurs
 * @param element - Optional element to attach the event listener to. Defaults to window
 * @param enabled - Optional flag to enable/disable the event listener. Defaults to true
 *
 * @example
 * useEventListener<Window>('resize', (event: UIEvent) => {
 *   console.log('window resized');
 * }, window);
 *
 * @example
 * const buttonRef = useRef<HTMLButtonElement>(null);
 * useEventListener<HTMLButtonElement>('click', (event: MouseEvent) => {
 *   console.log('button clicked', event);
 * }, buttonRef.current);
 */
export function useEventListener<T extends HTMLElement | Window = Window>(
  eventName: T extends Window ? keyof WindowEventMap : keyof HTMLElementEventMap,
  handler: T extends Window
    ? (event: WindowEventMap[keyof WindowEventMap]) => void
    : (event: HTMLElementEventMap[keyof HTMLElementEventMap]) => void,
  element?: T | null,
  enabled: boolean = true // Add enabled parameter with default true
): void {
  // Keep track of the handler
  const savedHandler = useRef(handler);

  /**
   * Keeps the saved handler ref in sync with the latest handler.
   */
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  /**
   * Adds and removes the event listener on the target element.
   */
  useEffect(() => {
    // Make sure element supports addEventListener
    const targetElement = (element || window) as EventTarget;
    if (!targetElement?.addEventListener) return () => {};

    if (enabled) {
      logger.logTraceUseEffect('ADD EVENT LISTENER', eventName, element);

      // Create event listener that calls handler function stored in ref
      const eventListener = (event: Event): void => savedHandler.current(event);

      targetElement.addEventListener(eventName as string, eventListener);

      // Remove event listener on cleanup
      return () => {
        logger.logTraceUseEffect('REMOVE EVENT LISTENER', eventName, element);
        targetElement.removeEventListener(eventName as string, eventListener);
      };
    }

    // Return empty cleanup function if not enabled
    return () => {};
  }, [eventName, element, enabled]);
}
