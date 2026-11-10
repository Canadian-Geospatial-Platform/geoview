/* eslint-disable max-classes-per-file */
// GV This file is meant to hold a complex abstract class with nested-classes to separate DOM-related utilities for GeoView maps.
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { TypeContainerBox, TypeHTMLElement } from '@/core/types/global-types';
import { delay, doTimeout, whenThisThen } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { DateMgt } from '@/core/utils/date-mgt';
import { CONTAINER_TYPE, PAGE_SCROLL_GAP_PX, OL_ZOOM_PIXEL_PADDING, TABS, TIMEOUT, type TypeMapFitPadding } from '@/core/utils/constant';

// GV DomHelper should only be referenced by application-level code
// GV DomHelper itself should definitely not import Controllers or Zustand Store States.

/** Selectors for elements that can participate in a viewer's keyboard focus cycle. */
const TABBABLE_SELECTOR = 'input, select, textarea, a[href], button, [tabindex], [contenteditable]:not([contenteditable="false"])';

/** The observers to monitor element removals from the DOM tree */
const observers: Record<string, MutationObserver> = {};

/**
 * Provides map-scoped DOM utilities and shared page scroll locking.
 */
export abstract class DomHelper {
  // Multiple map viewers can activate fullscreen fallback independently; keep the page locked until all release it.
  /** Number of active page scroll locks. */
  static #pageScrollLockCount = 0;

  /** Restores the page state captured before the first active scroll lock. */
  static #restorePageScroll?: () => void;

  // #region GENERIC - PUBLIC

  /**
   * Builds a DOM id in the canonical `${mapId}-suffix` format (generic to specific).
   *
   * Every DOM id in GeoView must be map-scoped so that multiple maps on the same page
   * never collide. Always create ids through this helper instead of composing strings by hand.
   *
   * @param mapId - The map identifier
   * @param suffix - The specific, map-relative id portion (e.g. 'appBar', 'tabsContainer')
   * @returns The canonical id string `${mapId}-${suffix}`
   */
  static buildGVElementId(mapId: string, suffix: string): string {
    return `${mapId}-${suffix}`;
  }

  /**
   * Resolves a map's root GeoView HTML element from the live DOM.
   *
   * The root element carries the map id as its DOM id. Resolving from the live DOM (instead of
   * the store) keeps this helper free of store/react dependencies and avoids circular imports.
   *
   * @param mapId - The map identifier
   * @returns The root GeoView HTML element
   * @throws {Error} When the root element is not found
   */
  static getGVRootElement(mapId: string): HTMLElement {
    const rootElement = document.getElementById(mapId);
    if (rootElement) return rootElement;
    throw new Error(`Root element not found for mapId: ${mapId}`);
  }

  /**
   * Finds an element by its map-relative suffix, scoped to the map's root element.
   *
   * The lookup is performed with the canonical `${mapId}-suffix` id inside the map's root element.
   * When the root is not mounted yet, it falls back to a global `document.getElementById` and logs a
   * warning, because a global lookup is not map-scoped and can resolve an element from another map.
   *
   * @param mapId - The map identifier
   * @param suffix - The map-relative id portion (without the `${mapId}-` prefix)
   * @returns The matching element, or undefined when none is found
   * @throws {Error} When the root element is not found
   */
  static getGVElementById<T extends HTMLElement = HTMLElement>(mapId: string, suffix: string): T | undefined {
    const fullId = this.buildGVElementId(mapId, suffix);
    const root = this.getGVRootElement(mapId);

    // Scoped lookup within the map root (preferred).
    if (root) return root.querySelector<T>(`#${CSS.escape(fullId)}`) ?? undefined;

    // Fallback: not map-scoped — warn because it can resolve an element from another map.
    logger.logWarning(`getGVElementById: root element for map '${mapId}' not found, falling back to global document lookup`, fullId);
    return (document.getElementById(fullId) as T | null) ?? undefined;
  }

  /**
   * Finds an element by its FULL DOM id, scoped to the map's root element.
   *
   * Use this for the many focus-restore call sites that already hold a complete DOM id (built with the
   * `${mapId}-` prefix) rather than a bare suffix. Scoping to the root keeps the lookup map-safe.
   *
   * @param mapId - The map identifier
   * @param fullId - A complete DOM id (already prefixed with `${mapId}-`)
   * @returns The matching element, or undefined when none is found
   * @throws {Error} When the root element is not found
   */
  static getGVElementByFullId<T extends HTMLElement = HTMLElement>(mapId: string, fullId: string): T | undefined {
    const root = this.getGVRootElement(mapId);

    // Scoped lookup within the map root (preferred).
    if (root) return root.querySelector<T>(`#${CSS.escape(fullId)}`) ?? undefined;

    // Fallback: not map-scoped — warn because it can resolve an element from another map.
    logger.logWarning(`getGVElementByFullId: root element for map '${mapId}' not found, falling back to global document lookup`, fullId);
    return (document.getElementById(fullId) as T | null) ?? undefined;
  }

  /**
   * Runs a CSS selector scoped inside a map's root element.
   *
   * When the root is not mounted yet, it falls back to a global `document.querySelector` and logs a
   * warning, because a global query is not map-scoped and can resolve an element from another map.
   *
   * @param mapId - The map identifier
   * @param selector - Any valid CSS selector, evaluated within the map's root element
   * @returns The first matching element, or undefined when none is found
   * @throws {Error} When the root element is not found
   */
  static queryGVSelector<T extends Element = HTMLElement>(mapId: string, selector: string): T | undefined {
    const root = this.getGVRootElement(mapId);

    // Scoped query within the map root (preferred).
    if (root) return root.querySelector<T>(selector) ?? undefined;

    // Fallback: not map-scoped — warn because it can resolve an element from another map.
    logger.logWarning(`queryGVSelector: root element for map '${mapId}' not found, falling back to global document query`, selector);
    return document.querySelector<T>(selector) ?? undefined;
  }

  /**
   * Runs a CSS selector scoped inside a map's root element and returns all matches.
   *
   * When the root is not mounted yet, it falls back to a global `document.querySelectorAll` and logs a
   * warning, because a global query is not map-scoped and can resolve elements from another map.
   *
   * @param mapId - The map identifier
   * @param selector - Any valid CSS selector, evaluated within the map's root element
   * @returns An array of matching elements (empty when none are found)
   * @throws {Error} When the root element is not found
   */
  static queryGVSelectorAll<T extends Element = HTMLElement>(mapId: string, selector: string): T[] {
    const root = this.getGVRootElement(mapId);

    // Scoped query within the map root (preferred).
    if (root) return Array.from(root.querySelectorAll<T>(selector));

    // Fallback: not map-scoped — warn because it can resolve elements from another map.
    logger.logWarning(`queryGVSelectorAll: root element for map '${mapId}' not found, falling back to global document query`, selector);
    return Array.from(document.querySelectorAll<T>(selector));
  }

  /**
   * Gets the layer list item button in the specified Layers panel.
   *
   * @param mapId - The map identifier
   * @param layerPath - The full layer path
   * @param containerType - The app bar or footer bar containing the Layers panel
   * @returns The layer list item button element, or undefined when it is not rendered
   */
  static getLayerBoxInLayersPanel(mapId: string, layerPath: string, containerType: TypeContainerBox): HTMLElement | undefined {
    return this.getGVElementById(mapId, `${containerType}-layers-${layerPath}`);
  }

  /**
   * Gets the visibility toggle button for a layer in a map's layer panel.
   *
   * @param mapId - The map identifier
   * @param layerPath - The full layer path
   * @param containerType - The app bar or footer bar containing the Layers panel
   * @returns The visibility button, or undefined when the layer row or button is not rendered
   */
  static getVisibleButton(mapId: string, layerPath: string, containerType: TypeContainerBox): HTMLButtonElement | undefined {
    const layerListItem = this.getGVElementById(mapId, `${containerType}-layers-${layerPath}`);
    return layerListItem?.parentElement?.querySelector<HTMLButtonElement>('.rightIcons-container button[aria-pressed]') ?? undefined;
  }

  /**
   * Checks whether a layer's visibility button displays the visible eye icon.
   *
   * @param mapId - The map identifier
   * @param layerPath - The full layer path
   * @param containerType - The app bar or footer bar containing the Layers panel
   * @returns True for the visible eye icon, or false for the hidden eye icon
   * @throws {Error} When the visibility button is missing or its eye icon state is ambiguous
   */
  static getVisibleButtonVisibility(mapId: string, layerPath: string, containerType: TypeContainerBox): boolean {
    const visibilityButton = this.getVisibleButton(mapId, layerPath, containerType);
    if (!visibilityButton) {
      throw new Error(`Layer visibility button not found for map '${mapId}', container '${containerType}', layer '${layerPath}'`);
    }
    const visibleIcon = visibilityButton.querySelector('[data-testid="VisibilityOutlinedIcon"]');
    const hiddenIcon = visibilityButton.querySelector('[data-testid="VisibilityOffOutlinedIcon"]');
    if (Boolean(visibleIcon) === Boolean(hiddenIcon)) {
      throw new Error(`Layer visibility icon state is ambiguous for map '${mapId}', container '${containerType}', layer '${layerPath}'`);
    }
    return Boolean(visibleIcon);
  }

  /**
   * Waits until a layer's visibility button displays the requested eye icon state.
   *
   * Retries every 100 milliseconds while the button is missing, its icon state is ambiguous, or the state does not match.
   * Waits indefinitely if the requested state is never reached.
   *
   * @param mapId - The map identifier
   * @param layerPath - The full layer path
   * @param containerType - The app bar or footer bar containing the Layers panel
   * @param visibility - True to wait for the visible eye icon, or false to wait for the hidden eye icon
   * @returns A promise that resolves when the button displays the requested visibility state
   */
  static async waitVisibleButtonVisibility(
    mapId: string,
    layerPath: string,
    containerType: TypeContainerBox,
    visibility: boolean
  ): Promise<void> {
    await whenThisThen(() => {
      try {
        return this.getVisibleButtonVisibility(mapId, layerPath, containerType) === visibility;
      } catch {
        return false;
      }
    });
    return;
  }

  /**
   * Returns visible tabbable elements in keyboard order within a map's focus trap.
   *
   * MUI's default list includes elements hidden by panels, which can leave Shift+Tab on the first skip link with nowhere visible to go.
   *
   * @param mapId - The map containing the focus trap
   * @param root - The viewer shell containing the focusable elements
   * @returns The currently visible and enabled elements in tab order
   */
  static getGVVisibleTabbable(mapId: string, root: HTMLElement): HTMLElement[] {
    const elements = this.queryGVSelectorAll<HTMLElement>(mapId, `#${CSS.escape(root.id)} :is(${TABBABLE_SELECTOR})`);
    const radios = elements.filter(
      (element): element is HTMLInputElement => element instanceof window.HTMLInputElement && element.type === 'radio'
    );
    const candidates = elements.filter((element) => {
      // Only the checked radio (or first radio when none is checked) participates in a group's tab order.
      if (element instanceof window.HTMLInputElement && element.type === 'radio' && element.name) {
        const group = radios.filter((radio) => radio.name === element.name);
        if (element !== (group.find((radio) => radio.checked) ?? group[0])) return false;
      }

      return (
        element.tabIndex >= 0 &&
        !element.matches(':disabled') &&
        !element.closest('[inert], [aria-hidden="true"]') &&
        element.getClientRects().length > 0 &&
        window.getComputedStyle(element).visibility === 'visible'
      );
    });

    const ordered = candidates.filter((element) => element.tabIndex > 0).sort((first, second) => first.tabIndex - second.tabIndex);
    return [...ordered, ...candidates.filter((element) => element.tabIndex === 0)];
  }

  /**
   * Returns the currently focused element in the document.
   *
   * @returns The active element, or undefined when the document has no active element
   */
  static getActiveElement(): Element | undefined {
    const { activeElement } = document;
    return activeElement ?? undefined;
  }

  /**
   * Checks whether an element is an input, textarea, select, or contenteditable element.
   *
   * @param element - The element to check, or undefined when there is no active element
   * @returns Whether the element is an input, textarea, select, or contenteditable element
   */
  static isInputOrContentEditableElement(element: Element | null | undefined): boolean {
    return (
      element instanceof window.HTMLInputElement ||
      element instanceof window.HTMLTextAreaElement ||
      element instanceof window.HTMLSelectElement ||
      this.isContentEditableElement(element)
    );
  }

  /**
   * Checks whether the currently focused element is an input, textarea, select, or contenteditable element.
   *
   * @returns Whether the active element is an input, textarea, select, or contenteditable element
   */
  static isActiveElementInputOrContentEditableElement(): boolean {
    return this.isInputOrContentEditableElement(this.getActiveElement());
  }

  /**
   * Checks whether an element is contenteditable.
   *
   * @param element - The element to check, or undefined when there is no active element
   * @returns Whether the element is contenteditable
   */
  static isContentEditableElement(element: Element | null | undefined): boolean {
    return element instanceof window.HTMLElement && element.isContentEditable;
  }

  /**
   * Locks the page scrolling while a viewer fills the browser viewport (fullscreen fallback).
   *
   * Saves the page state on the first lock and restores it only after the last lock is released.
   *
   * @returns An idempotent release function restoring overflow, scroll position and lost focus after the last lock
   */
  static lockPageScroll(): () => void {
    if (this.#pageScrollLockCount === 0) {
      const { documentElement, body } = document;
      const { scrollX, scrollY } = window;
      const previousHtmlOverflow = documentElement.style.overflow;
      const previousBodyOverflow = body.style.overflow;
      const previousFocus = this.getActiveElement();

      documentElement.style.overflow = 'hidden';
      body.style.overflow = 'hidden';

      this.#restorePageScroll = (): void => {
        documentElement.style.overflow = previousHtmlOverflow;
        body.style.overflow = previousBodyOverflow;
        window.scrollTo(scrollX, scrollY);

        // The control used to exit (e.g. the fallback exit button) may have been removed, leaving focus on the body
        const activeElement = this.getActiveElement();
        if ((!activeElement || activeElement === body) && previousFocus instanceof window.HTMLElement && previousFocus.isConnected) {
          previousFocus.focus({ preventScroll: true });
        }
      };
    }

    this.#pageScrollLockCount += 1;
    let released = false;
    return (): void => {
      if (released) return;
      released = true;
      this.#pageScrollLockCount -= 1;
      if (this.#pageScrollLockCount === 0) {
        const restore = this.#restorePageScroll;
        this.#restorePageScroll = undefined;
        restore?.();
      }
    };
  }

  /**
   * Checks whether an element is fully visible in the viewport.
   *
   * @param element - The element to check
   * @returns Whether the element is visible within the viewport
   */
  static isElementInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Scrolls an element into view only if it is outside the viewport.
   *
   * Respects reduced-motion preferences. For 'start', adds offset pixels above the element.
   * For 'end', adds offset pixels below the element. For 'center' and 'nearest', uses standard scrollIntoView behavior.
   *
   * @param element - The HTML element to scroll into view if not visible
   * @param blockValue - The vertical alignment ('start', 'center', 'end', 'nearest')
   * @param offset - Optional offset in pixels for 'start' and 'end' positions (default: 100)
   */
  static scrollIfNotVisible(element: HTMLElement, blockValue: ScrollLogicalPosition, offset = 100): void {
    const prefersReducedMotion =
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behaviorScroll = (prefersReducedMotion ? 'instant' : 'smooth') as ScrollBehavior;
    const rect = element.getBoundingClientRect();
    if (rect.top < offset || rect.bottom > window.innerHeight) {
      if (blockValue === 'center' || blockValue === 'nearest') {
        element.scrollIntoView({ behavior: behaviorScroll, block: blockValue });
      } else {
        let scrollTop;
        if (blockValue === 'end') {
          scrollTop = window.scrollY + rect.bottom - window.innerHeight + offset;
        } else {
          scrollTop = window.scrollY + rect.top - offset;
        }
        window.scrollTo({
          top: scrollTop,
          behavior: behaviorScroll,
        });
      }
    }
  }

  /**
   * Reveals the complete map section (app bar, map, nav bar and map info) of a map.
   *
   * Leaves up to PAGE_SCROLL_GAP_PX above fitting sections; oversized sections keep a stable gap of that size.
   * Shared by the app bar, map info and the zoom-to-feature actions so they all align the map the same way.
   *
   * @param mapId - The map identifier
   */
  static scrollMapSectionIntoView(mapId: string): void {
    const mapSection = this.getGVElementById(mapId, 'map');
    if (!mapSection) return;

    this.#scrollSectionIntoView(mapSection, 'start');
  }

  /**
   * Scrolls the footer into view, aligning its bottom when it fits or its top when it is taller than the viewport.
   *
   * @param mapId - The map identifier
   */
  static scrollFooterIntoView(mapId: string): void {
    const footer = this.getTabsContainer(mapId);
    if (!footer) return;

    this.#scrollSectionIntoView(footer, 'end');
  }

  /**
   * Schedules footer scrolling after layout and focus updates, unless the footer has been removed.
   *
   * @param mapId - The map identifier
   */
  static scrollFooterIntoViewAfterResize(mapId: string): void {
    const footer = this.getTabsContainer(mapId);
    if (!footer) return;

    delay(TIMEOUT.tabsContainerResize)
      .then((): void => {
        if (footer.isConnected) this.#scrollSectionIntoView(footer, 'end');
      })
      .catch((error: unknown): void => logger.logPromiseFailed('Failed to scroll footer after resize', error));
  }

  /**
   * Scrolls a list item into view within its scrollable container only, without scrolling the page.
   *
   * Adds a 20px gap for better visibility when scrolling.
   *
   * @param listItem - The list item element to scroll into view
   */
  static scrollListItemIntoView(listItem: HTMLElement): void {
    const prefersReducedMotion =
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behaviorScroll = (prefersReducedMotion ? 'instant' : 'smooth') as ScrollBehavior;
    const gap = 20;

    let container: HTMLElement | null = listItem.parentElement;
    while (container && container !== document.body) {
      const { overflowY } = window.getComputedStyle(container);
      if ((overflowY === 'auto' || overflowY === 'scroll') && container.scrollHeight > container.clientHeight) {
        break;
      }
      container = container.parentElement;
    }

    if (!container || container === document.body) return;

    const itemRect = listItem.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const isAbove = itemRect.top < containerRect.top;
    const isBelow = itemRect.bottom > containerRect.bottom;

    if (!isAbove && !isBelow) return;

    const itemTop = listItem.offsetTop - container.offsetTop;
    const itemBottom = itemTop + listItem.offsetHeight;

    let newScrollTop;
    if (isAbove) {
      newScrollTop = Math.max(0, itemTop - gap);
    } else {
      newScrollTop = itemBottom - container.clientHeight + gap;
    }

    container.scrollTo({
      top: newScrollTop,
      behavior: behaviorScroll,
    });
  }

  /**
   * Sets an input's value and dispatches bubbling input and change events.
   *
   * @param input - The input element to update
   * @param value - The value to set
   * @throws {Error} When the native input value setter is unavailable
   */
  static setInputValue(input: HTMLInputElement, value: string): void {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!valueSetter) throw new Error('The native input value setter was not found');
    valueSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  } /**
   * Returns a promise that resolves when an element matching the given selector exists in the DOM.
   *
   * Resolves immediately if the element already exists. Otherwise, observes the parent for child additions.
   *
   * @param selector - The CSS selector to query for
   * @param parent - Optional parent element to observe (defaults to `document.body`)
   * @param timeout - Optional maximum duration in milliseconds to wait before rejecting
   * @returns A promise that resolves with the matched element
   */
  static waitForDomElement(selector: string, parent?: Element, timeout?: number): Promise<Element> {
    const root = parent ?? document.body;
    const existing = root.querySelector(selector);
    if (existing) return Promise.resolve(existing);

    return new Promise<Element>((resolve, reject) => {
      const state = { resolved: false };
      const timeoutJob = timeout === undefined ? undefined : doTimeout(timeout);
      const observer = new MutationObserver(() => {
        if (state.resolved) return;
        const element = root.querySelector(selector);
        if (!element) return;

        state.resolved = true;
        observer.disconnect();
        timeoutJob?.cancel();
        resolve(element);
      });
      timeoutJob?.promise
        .then((result) => {
          if (result !== 'timeout' || state.resolved) return;
          state.resolved = true;
          observer.disconnect();
          reject(new Error(`waitForDomElement timed out after ${timeout}ms waiting for "${selector}"`));
        })
        .catch((error: unknown) => {
          if (state.resolved) return;
          state.resolved = true;
          observer.disconnect();
          reject(error);
        });
      observer.observe(root, { childList: true, subtree: true });
    });
  }

  /**
   * Sets up a MutationObserver to monitor when a specific DOM element (e.g., a div container)
   * is removed from the document.
   *
   * When the element is removed, it triggers a cleanup callback and disconnects the observer to prevent memory leaks.
   *
   * @param key - A unique identifier for the element, used to manage observer references
   * @param element - The DOM element to monitor for removal from the DOM tree
   * @param onHTMLElementRemoved - The callback executed once the given DOM element gets removed from the DOM tree
   */
  static watchHtmlElementRemoval(key: string, element: HTMLElement, onHTMLElementRemoved: (key: string) => void): void {
    if (!element || !element.parentNode) return;

    // Get the parent to set the MutationObserver on
    const parent = element.parentNode;

    // Disconnect prior observer if it exists
    if (observers[key]) {
      // Disconnect the observer, we're replacing it
      observers[key].disconnect();
      delete observers[key];
    }

    // Create the MutationObserver
    const observer = new MutationObserver((mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.removedNodes)) {
          if (node === element || (node instanceof HTMLElement && node.contains(element))) {
            // Callback
            onHTMLElementRemoved(key);

            // Disconnect the observer, we're done
            observer.disconnect();
            delete observers[key];
            return;
          }
        }
      }
    });

    // Store and activate the observer
    observers[key] = observer;
    observer.observe(parent, { childList: true });
  }

  /**
   * Returns a promise that resolves when the parent or one of its descendants matches the given selector.
   *
   * Observes class changes within the parent when no match exists initially.
   *
   * @param selector - The CSS selector to match
   * @param parent - Optional parent element to observe (defaults to `document.body`)
   * @param timeout - Optional maximum duration in milliseconds to wait before rejecting
   * @returns A promise that resolves with the matched element
   */
  static waitForClass(selector: string, parent?: Element, timeout?: number): Promise<Element> {
    const root = parent ?? document.body;
    const findMatch = (): Element | undefined => (root.matches(selector) ? root : (root.querySelector(selector) ?? undefined));
    const existing = findMatch();
    if (existing) return Promise.resolve(existing);

    return new Promise<Element>((resolve, reject) => {
      const state = { resolved: false };
      const timeoutJob = timeout === undefined ? undefined : doTimeout(timeout);
      const observer = new MutationObserver(() => {
        if (state.resolved) return;
        const element = findMatch();
        if (!element) return;

        state.resolved = true;
        observer.disconnect();
        timeoutJob?.cancel();
        resolve(element);
      });
      timeoutJob?.promise
        .then((result) => {
          if (result !== 'timeout' || state.resolved) return;
          state.resolved = true;
          observer.disconnect();
          reject(new Error(`waitForClass timed out after ${timeout}ms waiting for "${selector}"`));
        })
        .catch((error: unknown) => {
          if (state.resolved) return;
          state.resolved = true;
          observer.disconnect();
          reject(error);
        });
      observer.observe(root, { attributes: true, attributeFilter: ['class'], subtree: true });
    });
  }

  /**
   * Returns a promise that resolves when a DOM mutation is observed on the given element.
   *
   * When a filter is provided, the observer keeps listening until the filter returns true.
   *
   * @param element - The element to observe
   * @param filter - Optional predicate evaluated on each mutation
   * @param timeout - Optional maximum duration in milliseconds to wait before rejecting
   * @returns A promise that resolves when the DOM changes and passes the filter, or rejects on timeout
   */
  static waitForDomChange(element: Element, filter?: () => boolean, timeout?: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const state = { resolved: false };
      const timeoutJob = timeout === undefined ? undefined : doTimeout(timeout);
      const observer = new MutationObserver(() => {
        if (state.resolved || (filter && !filter())) return;

        state.resolved = true;
        observer.disconnect();
        timeoutJob?.cancel();
        resolve();
      });
      timeoutJob?.promise
        .then((result) => {
          if (result !== 'timeout' || state.resolved) return;
          state.resolved = true;
          observer.disconnect();
          reject(new Error(`waitForDomChange timed out after ${timeout}ms`));
        })
        .catch((error: unknown) => {
          if (state.resolved) return;
          state.resolved = true;
          observer.disconnect();
          reject(error);
        });
      observer.observe(element, { childList: true, subtree: true, characterData: true });
    });
  }

  /**
   * Returns a promise that resolves when the given element has non-empty text content.
   *
   * @param element - The element whose text content to await
   * @param timeout - Optional maximum duration in milliseconds to wait before rejecting
   * @returns A promise that resolves when the element has text content
   */
  static waitForDomContent(element: Element, timeout?: number): Promise<void> {
    if (element.textContent?.trim()) return Promise.resolve();
    return this.waitForDomChange(element, () => !!element.textContent?.trim(), timeout);
  }

  /**
   * Waits for React to commit, paint, and run effects after a state change.
   *
   * @returns A promise that resolves once React has rendered, painted, and executed effects
   */
  static waitForReactIdle(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          (window as unknown as { requestIdleCallback: (callback: () => void) => void }).requestIdleCallback(() => resolve());
        });
      });
    });
  }

  /**
   * Waits until the browser's main thread becomes idle using `requestIdleCallback`.
   *
   * @returns A promise that resolves when the browser reports an idle period
   */
  static waitForBrowserIdle(): Promise<void> {
    return new Promise((resolve) => {
      (window as unknown as { requestIdleCallback: (callback: () => void) => void }).requestIdleCallback(resolve);
    });
  }

  // #endregion GENERIC - PUBLIC

  // #region GENERIC - PRIVATE

  /**
   * Applies the shared page gap and stable oversized alignment to a section.
   *
   * @param element - The section to reveal
   * @param blockValue - The alignment when the section fits in the viewport
   */
  static #scrollSectionIntoView(element: HTMLElement, blockValue: 'start' | 'end'): void {
    const { top, height } = element.getBoundingClientRect();
    const isOversized = height > window.innerHeight;
    if (isOversized && Math.abs(top - PAGE_SCROLL_GAP_PX) <= 1) return;

    const offset = !isOversized && blockValue === 'start' ? Math.min(PAGE_SCROLL_GAP_PX, window.innerHeight - height) : PAGE_SCROLL_GAP_PX;
    this.scrollIfNotVisible(element, isOversized ? 'start' : blockValue, offset);
  }

  /**
   * Formats an ISO calendar date for a date-picker input, leaving other values unchanged.
   *
   * @param input - The range-filter input element
   * @param format - The date format to apply
   * @param language - The language to use for date formatting
   * @param value - The filter value to format
   * @returns The date formatted for the date picker, or the original value for other inputs
   */
  static #formatDateRangeFilterInputValue(input: HTMLInputElement, format: string, language: TypeDisplayLanguage, value: string): string {
    if (!input.closest('.MuiPickersInputBase-root') || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    return DateMgt.formatDate(value, format, language, DateMgt.TIME_UTC, 'calendar');
  }

  // #endregion GENERIC - PRIVATE

  // #region MAP SPECIFIC

  /**
   * Builds the DOM id for a map's shell container.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped shell container id
   */
  static buildShellId(mapId: string): string {
    return this.buildGVElementId(mapId, 'shell');
  }

  /**
   * Resolves a map's shell container element (the wrapper around the whole viewer chrome).
   *
   * Imperative counterpart to the React `useShellContainer` hook, for non-React callers
   * (plugins, controllers, utils) that hold a `mapId` rather than the React context.
   *
   * @param mapId - The map identifier
   * @returns The shell container element, or undefined when the map is not yet mounted
   */
  // TODO: CHECK - Should this return TypeHTMLElement without the | undefined and throw when not found?
  static getShellElement(mapId: string): TypeHTMLElement | undefined {
    return this.getGVElementById<TypeHTMLElement>(mapId, 'shell');
  }

  /**
   * Builds the DOM id for a map's container.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped map container id
   */
  static buildMapContainerId(mapId: string): string {
    return this.buildGVElementId(mapId, 'map');
  }

  /**
   * Gets the map container HTML element for the specified map.
   *
   * @param mapId - The map identifier
   * @returns The map container HTML element
   * @throws {Error} When the map container element is not found
   */
  static getMapContainer(mapId: string): HTMLElement {
    const mapContainer = this.getGVElementById(mapId, 'map');
    if (mapContainer) return mapContainer;
    throw new Error(`Map container element not found for mapId: ${mapId}`);
  }

  /**
   * Returns the currently focused element when it belongs to the specified map.
   *
   * @param mapId - The map identifier
   * @returns The active element inside the map, or undefined when focus is outside the map
   */
  static getActiveElementWithinMap(mapId: string): Element | undefined {
    const activeElement = this.getActiveElement();
    if (!activeElement || !this.getGVRootElement(mapId).contains(activeElement)) return undefined;
    return activeElement;
  }

  /**
   * Builds the DOM id for the map's footer tabs container.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped footer tabs container id
   */
  static buildTabsContainerId(mapId: string): string {
    return this.buildGVElementId(mapId, 'tabsContainer');
  }

  /**
   * Gets the footer tabs container element.
   *
   * @param mapId - The map identifier
   * @returns The footer tabs container element, if found
   */
  static getTabsContainer(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'tabsContainer');
  }

  /**
   * Builds the DOM id for the map's footer bar header.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped footer bar header id
   */
  static buildFooterBarHeaderId(mapId: string): string {
    return this.buildGVElementId(mapId, 'footerbar-header');
  }

  /**
   * Gets the footer bar header element.
   *
   * @param mapId - The map identifier
   * @returns The footer bar header element, if found
   */
  static getFooterBarHeader(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'footerbar-header');
  }

  /**
   * Builds the DOM id for a map's OpenLayers target element.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped target element id
   */
  static buildMapTargetElementId(mapId: string): string {
    return this.buildGVElementId(mapId, 'mapTargetElement');
  }

  /**
   * Resolves a map's OpenLayers map target element (the canvas container).
   *
   * Thin named getter over {@link getGVElementById} for the heavily-reused `mapTargetElement` landmark, so
   * call sites do not repeat the suffix string and get a typed result.
   *
   * @param mapId - The map identifier
   * @returns The map target element, or undefined when the map is not yet mounted
   */
  static getMapTargetElement<T extends HTMLElement = HTMLElement>(mapId: string): T | undefined {
    return this.getGVElementById<T>(mapId, 'mapTargetElement');
  }

  /**
   * Gets the footer height override from the map root, or returns the provided fallback.
   *
   * @param mapId - The map identifier
   * @param defaultHeight - The height to use (in px) when the map root has no `data-footer-height` value
   * @returns The configured footer height or the provided default
   * @throws {Error} When the root element is not found
   */
  static getDataFooterHeight(mapId: string, defaultHeight: number): string {
    return this.getGVRootElement(mapId).getAttribute('data-footer-height') ?? `${defaultHeight}px`;
  }

  /**
   * Gets the map configuration URL from the root element.
   *
   * @param mapId - The map identifier
   * @returns The configured URL, or undefined when the attribute is absent
   * @throws {Error} When the root element is not found
   */
  static getDataConfigUrl(mapId: string): string | undefined {
    return this.getGVRootElement(mapId).getAttribute('data-config-url') ?? undefined;
  }

  /**
   * Resolves a map's guide box container element.
   *
   * The guide box is portaled out of the map root when the viewer is fullscreen, so it cannot be resolved by a
   * root-scoped query. It is matched globally by its `data-map-id` attribute (which keeps the lookup map-scoped),
   * and when both an inline-hidden and a portaled-visible copy exist, the visible one is returned.
   *
   * @param mapId - The map identifier
   * @returns The visible guide box container, the first match, or undefined when none exists
   */
  static getGuidebox(mapId: string): HTMLElement | undefined {
    // Map-scoped via data-map-id; intentionally global because the guide is portaled out of the map root in fullscreen.
    const containers = Array.from(document.querySelectorAll<HTMLElement>(`.guidebox-container[data-map-id="${mapId}"]`));

    // Prefer the visible copy — the hidden inline one reports no client rects.
    return containers.find((el) => el.getClientRects().length > 0) ?? containers[0];
  }

  /**
   * Builds the DOM id for the map's north pole marker.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped north pole marker id
   */
  // TODO: CHECK - Is there 2 northpole elements in the dom-tree? This is called twice..
  static buildNorthPoleId(mapId: string): string {
    return this.buildGVElementId(mapId, 'northpole');
  }

  /**
   * Gets the north pole marker element.
   *
   * @param mapId - The map identifier
   * @returns The north pole marker HTML element, if found
   */
  static getNorthPole(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'northpole');
  }

  /**
   * Gets the north arrow SVG rendered inside a map's target element.
   *
   * @param mapId - The map identifier
   * @returns The north arrow SVG element, if found
   */
  static getNorthArrowSVG(mapId: string): SVGSVGElement | undefined {
    return this.getMapTargetElement(mapId)?.querySelector<SVGSVGElement>('[data-testid="north-arrow"] svg') ?? undefined;
  }

  /**
   * Builds the DOM id for the map's click marker.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped click marker id
   */
  static buildClickMarkerId(mapId: string): string {
    return this.buildGVElementId(mapId, 'clickmarker');
  }

  /**
   * Gets the click marker element.
   *
   * @param mapId - The map identifier
   * @returns The click marker HTML element, if found
   */
  static getClickMarker(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'clickmarker');
  }

  /**
   * Builds the DOM id for the map's info bar.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped info bar id
   */
  static buildMapInfoId(mapId: string): string {
    return this.buildGVElementId(mapId, 'mapInfo');
  }

  /**
   * Gets the map info bar element.
   *
   * @param mapId - The map identifier
   * @returns The map info bar HTML element, if found
   */
  static getMapInfo(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'mapInfo');
  }

  /**
   * Builds the DOM id for the map's navigation bar.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped navigation bar id
   */
  static buildNavBarId(mapId: string): string {
    return this.buildGVElementId(mapId, 'navBar');
  }

  /**
   * Gets the map's navigation bar element.
   *
   * @param mapId - The map identifier
   * @returns The navigation bar HTML element, if found
   */
  static getNavBar(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'navBar');
  }

  /**
   * Gets the map's overview map control elements.
   *
   * Several instances can briefly exist during a window resize; the duplicates are hidden by CSS.
   *
   * @param mapId - The map identifier
   * @returns The overview map control HTML elements (empty when the overview map is not shown)
   */
  static getOverviewMapControls(mapId: string): HTMLElement[] {
    return this.queryGVSelectorAll(mapId, '.ol-overviewmap.ol-custom-overviewmap');
  }

  /**
   * Builds the DOM id for the map's home button.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped home button id
   */
  static buildButtonHomeId(mapId: string): string {
    return this.buildGVElementId(mapId, 'button-home');
  }

  /**
   * Gets the map's home button.
   *
   * @param mapId - The map identifier
   * @returns The home button element, or undefined when it is not present
   */
  static getButtonHome(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'button-home');
  }

  /**
   * Builds the DOM id for the map's zoom-in button.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped zoom-in button id
   */
  static buildButtonZoomInId(mapId: string): string {
    return this.buildGVElementId(mapId, 'button-zoom-in');
  }

  /**
   * Gets the map's zoom-in button.
   *
   * @param mapId - The map identifier
   * @returns The zoom-in button element, or undefined when it is not present
   * @throws {Error} When the root element is not found
   */
  static getButtonZoomIn(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'button-zoom-in');
  }

  /**
   * Builds the DOM id for the map's zoom-out button.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped zoom-out button id
   */
  static buildButtonZoomOutId(mapId: string): string {
    return this.buildGVElementId(mapId, 'button-zoom-out');
  }

  /**
   * Gets the map's zoom-out button.
   *
   * @param mapId - The map identifier
   * @returns The zoom-out button element, or undefined when it is not present
   * @throws {Error} When the root element is not found
   */
  static getButtonZoomOut(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'button-zoom-out');
  }

  /**
   * Builds the DOM id for a map's measurement button.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped measurement button id
   */
  static buildButtonMeasurementId(mapId: string): string {
    return this.buildGVElementId(mapId, 'button-measurement');
  }

  /**
   * Builds the DOM id for a map's measurement button.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped measurement button id
   */
  static getButtonMeasurement(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'button-measurement');
  }

  /**
   * Builds the DOM id for the map's clear measurements button.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped clear measurements button id
   */
  static buildButtonClearMeasurementsId(mapId: string): string {
    return this.buildGVElementId(mapId, 'button-clear-measurements');
  }

  /**
   * Gets the map's clear measurements button.
   *
   * @param mapId - The map identifier
   * @returns The clear measurements button element, or undefined when it is not present
   */
  static getButtonClearMeasurements(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'button-clear-measurements');
  }

  /**
   * Gets the map info bar's height in pixels.
   *
   * Returns zero when the map info bar is not present.
   *
   * @param mapId - The map identifier
   * @returns The map info bar height in pixels, or zero when it is not present
   */
  static getMapInfoOffsetHeight(mapId: string): number {
    return this.getMapInfo(mapId)?.offsetHeight ?? 0;
  }

  /**
   * Builds the DOM id for the map's metric scale control bar.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped metric scale control bar id
   */
  static buildScaleControlBarMetricId(mapId: string): string {
    return this.buildGVElementId(mapId, 'scaleControlBarMetric');
  }

  /**
   * Gets the metric scale control bar element.
   *
   * @param mapId - The map identifier
   * @returns The metric scale control bar element, if found
   */
  static getScaleControlBarMetric(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'scaleControlBarMetric');
  }

  /**
   * Builds the DOM id for the map's imperial scale control bar.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped imperial scale control bar id
   */
  static buildScaleControlBarImperialId(mapId: string): string {
    return this.buildGVElementId(mapId, 'scaleControlBarImperial');
  }

  /**
   * Gets the imperial scale control bar element.
   *
   * @param mapId - The map identifier
   * @returns The imperial scale control bar element, if found
   */
  static getScaleControlBarImperial(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'scaleControlBarImperial');
  }

  /**
   * Gets the guide content container in a map's right panel.
   *
   * @param mapId - The map identifier
   * @returns The guide content container, if found
   */
  static getGuideContainer(mapId: string): HTMLElement | undefined {
    return this.queryGVSelector<HTMLElement>(mapId, '.guide-container');
  }

  /**
   * Builds the DOM id for the guide close button in an app bar or footer bar container.
   *
   * @param mapId - The map identifier
   * @param containerType - The container where the guide is displayed
   * @returns The map-scoped guide close button id
   */
  static buildGuideCloseButtonId(mapId: string, containerType: TypeContainerBox): string {
    return this.buildGVElementId(mapId, `${containerType}-guide-close-btn`);
  }

  /**
   * Gets the guide close button for an app bar or footer bar container.
   *
   * @param mapId - The map identifier
   * @param containerType - The container where the guide is displayed
   * @returns The guide close button element, if found
   */
  static getGuideCloseButton(mapId: string, containerType: TypeContainerBox): HTMLElement | undefined {
    return this.getGVElementById(mapId, `${containerType}-guide-close-btn`);
  }

  /**
   * Builds the DOM id for the map's app bar version button.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped app bar version button id
   */
  static buildAppBarVersionButtonId(mapId: string): string {
    return this.buildGVElementId(mapId, `${CONTAINER_TYPE.APP_BAR}-version-btn`);
  }

  /**
   * Gets the map's app bar version button.
   *
   * @param mapId - The map identifier
   * @returns The app bar version button element, or undefined when it is not present
   */
  static getAppBarVersionButton(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, `${CONTAINER_TYPE.APP_BAR}-version-btn`);
  }

  /**
   * Builds the DOM id for the map's app bar version focus trap container.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped app bar version focus trap container id
   */
  static buildAppBarVersionFocusTrapId(mapId: string): string {
    return this.buildGVElementId(mapId, `${CONTAINER_TYPE.APP_BAR}-version-ft`);
  }

  /**
   * Gets the map's app bar version focus trap container.
   *
   * @param mapId - The map identifier
   * @returns The app bar version focus trap container element, or undefined when it is not present
   */
  static getAppBarVersionFocusTrap(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, `${CONTAINER_TYPE.APP_BAR}-version-ft`);
  }

  /**
   * Builds the DOM id for an app bar tab's panel button.
   *
   * @param mapId - The map identifier
   * @param tabId - The app bar tab identifier
   * @returns The map-scoped app bar panel button id
   */
  static buildAppBarPanelButtonId(mapId: string, tabId: string): string {
    return this.buildGVElementId(mapId, `${CONTAINER_TYPE.APP_BAR}-${tabId}-panel-btn`);
  }

  /**
   * Gets an app bar tab button element.
   *
   * @param mapId - The map identifier
   * @param tabId - The app bar tab identifier
   * @returns The app bar button element, if found
   */
  static getAppBarButton(mapId: string, tabId: string): HTMLElement | undefined {
    return this.getGVElementByFullId(mapId, `${mapId}-${CONTAINER_TYPE.APP_BAR}-${tabId}-panel-btn`);
  }

  /**
   * Builds the DOM id for an app bar tab's panel.
   *
   * @param mapId - The map identifier
   * @param tabId - The app bar tab identifier
   * @returns The map-scoped app bar panel id
   */
  static buildAppBarPanelId(mapId: string, tabId: string): string {
    return this.buildGVElementId(mapId, `${CONTAINER_TYPE.APP_BAR}-${tabId}-panel`);
  }

  /**
   * Gets an app bar panel element.
   *
   * @param mapId - The map identifier
   * @param tabId - The app bar tab identifier
   * @returns The app bar panel element, if found
   */
  static getAppBarPanel(mapId: string, tabId: string): HTMLElement | undefined {
    return this.getGVElementByFullId(mapId, `${mapId}-${CONTAINER_TYPE.APP_BAR}-${tabId}-panel`);
  }

  /**
   * Gets an app bar panel close button element.
   *
   * @param mapId - The map identifier
   * @param tabId - The app bar tab identifier
   * @returns The app bar panel close button element, if found
   */
  static getAppBarPanelCloseButton(mapId: string, tabId: string): HTMLButtonElement | undefined {
    return this.getGVElementById<HTMLButtonElement>(mapId, `${CONTAINER_TYPE.APP_BAR}-${tabId}-panel-close-btn`);
  }

  /**
   * Builds the DOM id for the map's WCAG "Skip to main content - Map" link.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped WCAG skip link id
   */
  static buildWCAGLinkToMapId(mapId: string): string {
    return this.buildGVElementId(mapId, 'wcag-link-to-map');
  }

  /**
   * Gets the map's WCAG "Skip to main content - Map" link.
   *
   * @param mapId - The map identifier
   * @returns The skip link element, or undefined when it is not present
   */
  static getWCAGLinkToMap(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'wcag-link-to-map');
  }

  /**
   * Builds the DOM id for a map's top skip link.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped top skip link id
   */
  static buildWCAGTopLinkId(mapId: string): string {
    return this.buildGVElementId(mapId, 'wcag-toplink');
  }

  /**
   * Gets the map's top skip link element.
   *
   * @param mapId - The map identifier
   * @returns The top skip link element, or undefined when it is not present
   */
  static getWCAGTopLink(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'wcag-toplink');
  }

  /**
   * Builds the DOM id for a map's bottom skip link.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped bottom skip link id
   */
  static buildWCAGBottomLinkId(mapId: string): string {
    return this.buildGVElementId(mapId, 'wcag-bottomlink');
  }

  /**
   * Gets the map's WCAG bottom skip link element.
   *
   * @param mapId - The map identifier
   * @returns The bottom skip link element, or undefined when it is not present
   */
  static getWCAGBottomLink(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'wcag-bottomlink');
  }

  /**
   * Waits for the legend's panel button to render in an app bar or footer bar container.
   *
   * @param mapId - The map identifier
   * @param containerType - The container where the legend is displayed
   * @param timeout - Optional maximum duration in milliseconds to wait before rejecting
   * @returns A promise that resolves with the legend app bar button, or the legend footer bar tab
   * @throws {Error} When the root element is not found or the button is not rendered before the timeout
   */
  static waitForLegendPanelButton(mapId: string, containerType: TypeContainerBox, timeout?: number): Promise<HTMLElement> {
    // whenThisThen only resolves with a truthy value, so the element is never undefined
    return whenThisThen(
      (): HTMLElement | undefined =>
        // The footer bar renders its panel buttons as tabs
        // TODO: Refactor #3748
        containerType === CONTAINER_TYPE.APP_BAR
          ? DomHelper.getAppBarButton(mapId, TABS.LEGEND)
          : DomHelper.getGVElementById(mapId, `tab-${TABS.LEGEND}`),
      timeout
    ) as Promise<HTMLElement>;
  }

  /**
   * Waits for an app bar tab button to receive the active class.
   *
   * @param mapId - The map container identifier
   * @param tabId - The app bar tab identifier
   * @returns A promise that resolves with the active app bar tab button element
   * @throws {Error} When the root element is not found
   */
  static waitForAppbarTabSelected(mapId: string, tabId: string): Promise<Element> {
    return this.waitForClass(`#${mapId}-appBar-${tabId}-panel-btn.active`, this.getGVRootElement(mapId));
  }

  /**
   * Waits for an app bar tab button to no longer have the active class.
   *
   * @param mapId - The map container identifier
   * @param tabId - The app bar tab identifier
   * @returns A promise that resolves with the inactive app bar tab button element
   * @throws {Error} When the root element is not found
   */
  static waitForAppbarTabNotSelected(mapId: string, tabId: string): Promise<Element> {
    return this.waitForClass(`#${mapId}-appBar-${tabId}-panel-btn:not(.active)`, this.getGVRootElement(mapId));
  }

  /**
   * Waits for a footer tab to receive the selected class.
   *
   * @param mapId - The map container identifier
   * @param tabId - The footer tab identifier
   * @returns A promise that resolves with the selected footer tab element
   * @throws {Error} When the root element is not found
   */
  static waitForFooterTabSelected(mapId: string, tabId: string): Promise<Element> {
    return this.waitForClass(`#${mapId}-tab-${tabId}.Mui-selected`, this.getGVRootElement(mapId));
  }

  /**
   * Waits for a footer tab to no longer have the selected class.
   *
   * @param mapId - The map container identifier
   * @param tabId - The footer tab identifier
   * @returns A promise that resolves with the inactive footer tab element
   * @throws {Error} When the root element is not found
   */
  static waitForFooterTabNotSelected(mapId: string, tabId: string): Promise<Element> {
    return this.waitForClass(`#${mapId}-tab-${tabId}:not(.Mui-selected)`, this.getGVRootElement(mapId));
  }

  // #endregion MAP SPECIFIC

  // #region MAP DOM FUNCTIONS

  /** Map-specific DOM functions (measurements and layout) built on the map element getters. */
  static readonly Map = class Map {
    /**
     * Gets the default fixed fit padding shared by the feature zoom (Details, Data Table) and the STAC browser zoom.
     *
     * @returns Padding in map pixels ordered as top, right, bottom, left
     */
    static getDefaultFitPadding(): TypeMapFitPadding {
      return [OL_ZOOM_PIXEL_PADDING, OL_ZOOM_PIXEL_PADDING, OL_ZOOM_PIXEL_PADDING, OL_ZOOM_PIXEL_PADDING];
    }

    /**
     * Gets the bounding rectangle of the map target element, when the map has a usable size.
     *
     * @param mapTarget - The map target element, if any
     * @param mapSize - The OpenLayers map size in pixels
     * @returns The map target bounding rectangle, or undefined when the map or its size is unavailable
     */
    static getUsableMapRect(mapTarget: HTMLElement | undefined, mapSize: number[] | undefined): DOMRect | undefined {
      if (!mapSize || mapSize[0] <= 0 || mapSize[1] <= 0) return undefined;

      const mapRect = mapTarget?.getBoundingClientRect();
      return mapRect && mapRect.width > 0 ? mapRect : undefined;
    }

    /**
     * Gets how far, in CSS pixels, an element covers the map from one of its sides.
     *
     * @param element - The element covering the map, if any
     * @param mapRect - The map target bounding rectangle
     * @param side - The map side the element is anchored to
     * @returns The covered width in CSS pixels, or 0 when the element is missing, hidden or does not overlap the map
     */
    static getMapCoveredWidth(element: HTMLElement | undefined, mapRect: DOMRect, side: 'left' | 'right'): number {
      const rect = element?.getBoundingClientRect();
      if (
        !rect ||
        rect.width <= 0 ||
        rect.bottom <= mapRect.top ||
        rect.top >= mapRect.bottom ||
        rect.left >= mapRect.right ||
        rect.right <= mapRect.left
      ) {
        return 0;
      }

      return Math.min(mapRect.width, side === 'left' ? rect.right - mapRect.left : mapRect.right - rect.left);
    }

    /**
     * Gets the default fit padding with the area covered by the right-side map controls (navigation bar and
     * overview map) added to the right side.
     *
     * The overlap between the controls and the map is measured from their actual positions and converted to map pixels
     * (so it keeps working with CSS scaling). The default padding is returned unchanged when no control is shown or
     * when the controls leave no room for the extent.
     *
     * @param mapId - The map identifier
     * @param mapSize - The OpenLayers map size in pixels
     * @returns Padding in map pixels ordered as top, right, bottom, left
     */
    static getMapControlsFitPadding(mapId: string, mapSize: number[] | undefined): TypeMapFitPadding {
      const padding = Map.getDefaultFitPadding();
      const mapRect = Map.getUsableMapRect(DomHelper.getMapTargetElement(mapId), mapSize);
      if (!mapSize || !mapRect) return padding;

      // The navigation bar and the overview map are both anchored to the right edge of the map
      const controls = [DomHelper.getNavBar(mapId), ...DomHelper.getOverviewMapControls(mapId)];
      const overlap =
        Math.max(0, ...controls.map((control) => Map.getMapCoveredWidth(control, mapRect, 'right'))) * (mapSize[0] / mapRect.width);
      if (mapSize[0] <= padding[3] + overlap + padding[1]) return padding;

      padding[1] += overlap;
      return padding;
    }

    /**
     * Gets the map controls fit padding with the area covered by an app-bar panel added to the left side.
     *
     * The overlap between the panel and the map is measured from their actual positions and converted to map pixels
     * (so it keeps working with CSS scaling). The map controls padding is returned unchanged when the panel is missing,
     * hidden, does not overlap the map (e.g. footer-bar panel) or leaves no room for the extent.
     *
     * The caller is responsible for knowing the panel is the open one.
     *
     * @param mapId - The map identifier
     * @param tabId - The app-bar tab identifier whose panel is measured
     * @param mapSize - The OpenLayers map size in pixels
     * @returns Padding in map pixels ordered as top, right, bottom, left
     */
    static getAppBarPanelFitPadding(mapId: string, tabId: string, mapSize: number[] | undefined): TypeMapFitPadding {
      const padding = Map.getMapControlsFitPadding(mapId, mapSize);
      const [top, right, bottom, left] = padding;
      const mapRect = Map.getUsableMapRect(DomHelper.getMapTargetElement(mapId), mapSize);
      if (!mapSize || !mapRect) return padding;

      const panel = DomHelper.getAppBarPanel(mapId, tabId);
      if (!panel || panel.getAttribute('aria-hidden') === 'true') return padding;

      // Convert CSS overlap into map pixels, including when the host applies CSS scaling.
      const overlap = Map.getMapCoveredWidth(panel, mapRect, 'left') * (mapSize[0] / mapRect.width);
      if (overlap <= 0 || mapSize[0] <= left + overlap + right || mapSize[1] <= top + bottom) return padding;

      padding[3] += overlap;
      return padding;
    }
  };

  // #endregion MAP DOM FUNCTIONS

  // #region DATA-TABLE SPECIFIC

  static readonly DataTable = class DataTable {
    /**
     * Gets the data table panel in a map's root element.
     *
     * @param mapId - The ID of the map containing the data panel
     * @returns The data table panel, if found
     * @throws {Error} When the root element is not found
     */
    static getDataTablePanel(mapId: string): HTMLElement | undefined {
      return DomHelper.getGVRootElement(mapId).querySelector('.data-table-panel') ?? undefined;
    }

    /**
     * Gets the data table content container element.
     *
     * @param mapId - The ID of the map containing the data table
     * @returns The data table container element, if found
     */
    static getDataTableContainer(mapId: string): HTMLElement | undefined {
      return this.getDataTablePanel(mapId)?.querySelector('.data-table-container') ?? undefined;
    }

    /**
     * Gets the first enabled row zoom button in the data table.
     *
     * @param mapId - The ID of the map containing the data table
     * @returns The first enabled row zoom button, if found
     */
    static getFirstRowZoomButton(mapId: string): HTMLButtonElement | undefined {
      return Array.from(this.getDataTableContainer(mapId)?.querySelectorAll<HTMLButtonElement>('button[data-feature-index]') ?? []).find(
        (button) => !button.disabled
      );
    }

    /**
     * Waits for the data table element to render inside this map's data table container.
     *
     * @param mapId - The map identifier
     * @returns A promise that resolves with the rendered table element
     * @throws {Error} When the root element is not found
     */
    static waitForDataTable(mapId: string): Promise<Element> {
      return DomHelper.waitForDomElement('.data-table-container table', DomHelper.getGVRootElement(mapId));
    }

    /**
     * Waits for the data table filter results summary to render within this map.
     *
     * @param mapId - The map identifier
     * @returns A promise that resolves with the filter results summary element
     * @throws {Error} When the root element is not found
     */
    static waitForFilterResultsSummary(mapId: string): Promise<Element> {
      return DomHelper.waitForDomElement('.filter-results-summary', DomHelper.getGVRootElement(mapId));
    }

    /**
     * Gets the header cell for a data table column, matching its column id without regard to case.
     *
     * @param mapId - The ID of the map containing the data table
     * @param columnName - The column name to find
     * @returns The matching column header cell, if found
     */
    static getDataTableColumnHeaderCell(mapId: string, columnName: string): HTMLTableCellElement | undefined {
      return Array.from(this.getDataTableContainer(mapId)?.querySelectorAll('[data-column-id]') ?? []).find((hc) => {
        return hc.getAttribute('data-column-id')?.toLowerCase() === columnName.toLowerCase();
      }) as HTMLTableCellElement | undefined;
    }

    /**
     * Gets the first filter input in a data table column header.
     *
     * @param mapId - The ID of the map containing the data table
     * @param columnName - The column name whose filter input to get
     * @returns The column filter input element
     */
    static getDataTableColumnFilterInput(mapId: string, columnName: string): HTMLInputElement {
      return Array.from(this.getDataTableColumnHeaderCell(mapId, columnName)?.querySelectorAll('input') ?? [])[0] ?? undefined;
    }

    /**
     * Gets a bound input for a data table column range filter.
     *
     * @param mapId - The ID of the map containing the data table
     * @param columnName - The column name whose range filter to inspect
     * @param bound - The range-filter bound to get
     * @returns The matching bound input, if found
     */
    static getDataTableColumnRangeFilterInput(mapId: string, columnName: string, bound: 'Min' | 'Max'): HTMLInputElement | undefined {
      const columnHeaderCell = this.getDataTableColumnHeaderCell(mapId, columnName);
      if (!columnHeaderCell) return undefined;

      return Array.from(columnHeaderCell.querySelectorAll<HTMLInputElement>(`input[aria-label="${bound}"]`) ?? []).find(
        (input) => input.closest<HTMLTableCellElement>('th')?.cellIndex === columnHeaderCell.cellIndex
      );
    }

    /**
     * Shows the data table column filters when they are hidden.
     *
     * @param mapId - The ID of the map containing the data table
     * @param columnName - The column whose filter should be shown
     * @throws {Error} When the filter visibility control is not found
     */
    static showColumnFilter(mapId: string, columnName: string): Promise<void> {
      return this.setColumnFilterVisibility(mapId, columnName, true);
    }

    /**
     * Hides the data table column filters when they are shown.
     *
     * @param mapId - The ID of the map containing the data table
     * @param columnName - The column whose filter should be hidden
     * @throws {Error} When the filter visibility control is not found
     */
    static hideColumnFilter(mapId: string, columnName: string): Promise<void> {
      return this.setColumnFilterVisibility(mapId, columnName, false);
    }

    /**
     * Toggles the visibility of the data table column filters.
     *
     * @param mapId - The ID of the map containing the data table
     * @param columnName - The column whose filter visibility determines the toggle state
     * @throws {Error} When the filter visibility control is not found
     */
    static toggleColumnFilter(mapId: string, columnName: string): Promise<void> {
      const columnHeaderCell = this.getDataTableColumnHeaderCell(mapId, columnName);
      const shouldShowFilter = !columnHeaderCell?.querySelector('input');
      return this.setColumnFilterVisibility(mapId, columnName, shouldShowFilter);
    }

    /**
     * Shows a column filter if needed and sets its input value.
     *
     * @param mapId - The ID of the map containing the data table
     * @param columnName - The column name whose filter input should be updated
     * @param value - The value to enter in the filter input
     * @throws {Error} When the filter visibility control cannot be found
     */
    static async setDataTableColumnFilterInput(mapId: string, columnName: string, value: string): Promise<void> {
      // Make sure the column filter is shown
      await this.showColumnFilter(mapId, columnName);
      const input = this.getDataTableColumnFilterInput(mapId, columnName);

      // Add a test step indicating that we are setting the data table column filter input for the specified column
      DomHelper.setInputValue(input, value);
    }

    /**
     * Sets one bound of a column's range filter in the data table.
     *
     * @param mapId - The ID of the map containing the data table
     * @param columnName - The column name whose range filter should be updated
     * @param value - The value to enter in the bound input
     * @param format - The date format to use for date-picker inputs
     * @param language - The language to use when formatting date-picker values
     * @param bound - The range-filter bound to update
     * @throws {Error} When the requested bound input cannot be found
     */
    static async setDataTableColumnFilterInputRange(
      mapId: string,
      columnName: string,
      value: string,
      format: string,
      language: TypeDisplayLanguage,
      bound: 'Min' | 'Max'
    ): Promise<void> {
      // Find the input filter html component
      const input = await this.findDataTableColumnRangeFilterInput(mapId, columnName, bound);

      // Set the value
      DomHelper.setInputValue(input, DomHelper.#formatDateRangeFilterInputValue(input, format, language, value));
    }

    /**
     * Clears the data table filters using the table's clear-filters control.
     *
     * @param mapId - The ID of the map containing the data table
     * @throws {Error} When the data table toolbar or clear-filters button is not found
     */
    static clearDataTableFilters(mapId: string): void {
      const toolbar = this.getDataTablePanel(mapId)?.querySelector('.data-table-top-toolbar');
      if (!toolbar) throw new Error('The data table top toolbar was not found');

      // The accessible name is localized, so match the English and French labels.
      const clearFiltersButton = Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button[aria-label]')).find((button) => {
        const accessibleName = button.getAttribute('aria-label')?.toLowerCase() ?? '';
        return (
          (accessibleName.includes('clear') && accessibleName.includes('filter')) ||
          (accessibleName.includes('effacer') && accessibleName.includes('filtre'))
        );
      });
      if (!clearFiltersButton) throw new Error('The data table clear-filters button was not found');

      // Use the table control so its internal filter state is cleared along with the store.
      clearFiltersButton.click();
    }

    /**
     * Checks whether a data table column's filter input is visible.
     *
     * @param mapId - The ID of the map containing the data table
     * @param columnName - The column whose filter visibility to check
     * @returns Whether the filter input is visible
     */
    static isFilterVisible(mapId: string, columnName: string): boolean {
      return !!this.getDataTableColumnHeaderCell(mapId, columnName)?.querySelector('input');
    }

    /**
     * Finds a range-filter input for a specific column in the data table.
     *
     * @param mapId - The ID of the map containing the data table
     * @param columnName - The column name whose range filter should be found
     * @param bound - The range-filter bound to find
     * @returns The range-filter input element
     * @throws {Error} When the range-filter input is not found
     */
    static async findDataTableColumnRangeFilterInput(mapId: string, columnName: string, bound: 'Min' | 'Max'): Promise<HTMLInputElement> {
      await this.showColumnFilter(mapId, columnName);
      const rangeFilterInput = this.getDataTableColumnRangeFilterInput(mapId, columnName, bound);

      // If not found, throw an error indicating the filter input could not be found
      if (!rangeFilterInput) throw new Error(`The ${bound.toLowerCase()} filter input was not found for column ${columnName}`);

      // Return it
      return rangeFilterInput;
    }

    /**
     * Sets the visibility of the data table column filters.
     *
     * @param mapId - The ID of the map containing the data table
     * @param columnName - The column whose filter visibility should be changed
     * @param shouldShowFilter - Whether the column filters should be shown
     * @throws {Error} When the root element is not found
     * @throws {Error} When the column-filter toggle is not found
     */
    static async setColumnFilterVisibility(mapId: string, columnName: string, shouldShowFilter: boolean): Promise<void> {
      if (this.isFilterVisible(mapId, columnName) === shouldShowFilter) return;

      const filterToggle = Array.from(
        DomHelper.getGVRootElement(mapId).querySelectorAll<HTMLLabelElement>('label.MuiFormControlLabel-root')
      ).find((label) => {
        const labelText = label.textContent?.toLowerCase() ?? '';
        return labelText.includes('filter') && (labelText.includes('show') || labelText.includes('hide'));
      });
      if (!filterToggle) throw new Error('The data table column-filter toggle was not found');

      filterToggle.click();
      await whenThisThen(() => this.isFilterVisible(mapId, columnName) === shouldShowFilter);
    }
  };

  // #endregion DATA-TABLE SPECIFIC

  // #region DRAWER SPECIFIC

  /**
   * Builds the DOM id for a map's drawer draw button.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped drawer draw button id
   */
  static buildDrawerDrawButtonId(mapId: string): string {
    return this.buildGVElementId(mapId, 'drawer-draw');
  }

  /**
   * Gets the map's drawer draw button.
   *
   * @param mapId - The map identifier
   * @returns The drawer draw button element, or undefined when it is not present
   */
  static getDrawerDrawButton(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'drawer-draw');
  }

  /**
   * Builds the DOM id for a map's drawer edit button.
   *
   * @param mapId - The map identifier
   * @returns The map-scoped drawer edit button id
   */
  static buildDrawerEditButtonId(mapId: string): string {
    return this.buildGVElementId(mapId, 'drawer-edit');
  }

  /**
   * Gets the map's drawer edit button.
   *
   * @param mapId - The map identifier
   * @returns The drawer edit button element, or undefined when it is not present
   */
  static getDrawerEditButton(mapId: string): HTMLElement | undefined {
    return this.getGVElementById(mapId, 'drawer-edit');
  }

  // #endregion DRAWER SPECIFIC

  // #region SWIPER SPECIFIC

  static readonly Swiper = class Swiper {
    /**
     * Waits for this map's layer settings button to appear and clicks it.
     *
     * @param mapId - The ID of the map containing the layer settings button
     * @returns The clicked layer settings button
     * @throws {Error} When the root element is not found
     * @throws {Error} When the matched settings control is not a button
     */
    static async waitAndClickLayerSettingsButton(mapId: string): Promise<HTMLButtonElement> {
      const settingsButton = await DomHelper.waitForDomElement('button[aria-label="Layer settings"]', DomHelper.getGVRootElement(mapId));
      if (!(settingsButton instanceof HTMLButtonElement)) throw new Error('The layer settings control is not a button');

      settingsButton.click();
      return settingsButton;
    }

    /**
     * Waits for the Swiper bar option to appear in this map's layer settings.
     *
     * @param mapId - The ID of the map containing the layer settings
     * @returns A promise that resolves when the option is rendered
     * @throws {Error} When the root element is not found
     */
    static async waitForSwiperBarOption(mapId: string): Promise<void> {
      await DomHelper.waitForDomElement('[data-testid="swiper-bar-option"]', DomHelper.getGVRootElement(mapId));
    }
  };

  // #endregion SWIPER SPECIFIC
}
