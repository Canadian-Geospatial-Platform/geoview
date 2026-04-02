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
export declare function useEventListener<T extends HTMLElement | Window = Window>(eventName: T extends Window ? keyof WindowEventMap : keyof HTMLElementEventMap, handler: T extends Window ? (event: WindowEventMap[keyof WindowEventMap]) => void : (event: HTMLElementEventMap[keyof HTMLElementEventMap]) => void, element?: T | null, enabled?: boolean): void;
//# sourceMappingURL=use-event-listener.d.ts.map