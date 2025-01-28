import { logger } from '@/core/utils/logger';
import { useRef, useEffect } from 'react';

/**
 * A custom hook that handles the addition and removal of event listeners.
 * This hook uses useRef and useEffect to ensure that the latest handler is used
 * without causing the effect to re-run on handler changes.
 *
 * @template T - The type of element (HTMLElement or Window)
 *
 * @param {T extends Window ? keyof WindowEventMap : keyof HTMLElementEventMap} eventName
 *        The name of the event to listen to (e.g., 'click', 'resize', 'mousemove')
 * @param {Function} handler
 *        The callback function to be called when the event occurs. The event parameter type
 *        will be inferred based on the element type (Window or HTMLElement)
 * @param {T | null} [element]
 *        Optional element to attach the event listener to. If not provided, defaults to window
 *
 * @example
 * // Window event example
 * useEventListener<Window>('resize', (event: UIEvent) => {
 *   console.log('window resized');
 * }, window);
 *
 * @example
 * // Button click example
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
  element?: T | null
): void {
  // Keep track of the handler
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    logger.logTraceUseEffect('ADD EVENT LISTENER', eventName, element)
    
    // Make sure element supports addEventListener
    const targetElement = (element || window) as EventTarget;
    if (!targetElement?.addEventListener) return;

    // Create event listener that calls handler function stored in ref
    const eventListener = (event: Event) => savedHandler.current(event);

    targetElement.addEventListener(eventName as string, eventListener);

    // Remove event listener on cleanup
    return () => {
      targetElement.removeEventListener(eventName as string, eventListener);
    };
  }, [eventName, element]);
}
