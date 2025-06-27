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
 * @param {boolean} [enabled=true]
 *        Optional flag to enable/disable the event listener. Defaults to true
 * @returns {void} - The function doesn't return anything
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
export declare function useEventListener<T extends HTMLElement | Window = Window>(eventName: T extends Window ? keyof WindowEventMap : keyof HTMLElementEventMap, handler: T extends Window ? (event: WindowEventMap[keyof WindowEventMap]) => void : (event: HTMLElementEventMap[keyof HTMLElementEventMap]) => void, element?: T | null, enabled?: boolean): void;
//# sourceMappingURL=use-event-listener.d.ts.map