/* eslint-disable max-classes-per-file */
import { doTimeout, whenThisThen } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { DateMgt } from './date-mgt';

/**
 * Canonical map-relative id suffixes for well-known GeoView landmark elements.
 *
 * Centralizing the suffix strings here keeps them out of scattered string literals, so both the
 * imperative getters (this file) and the reactive store hooks resolve the same element by one source of truth.
 */
export const GV_DOM_SUFFIX = {
  /** The shell container that wraps the whole viewer chrome. */
  shell: 'shell',
  /** The OpenLayers map target element (the canvas container). */
  mapTarget: 'mapTargetElement',
} as const;

/** CSS class marking the guide's scrollable content container. */
const GUIDEBOX_CONTAINER_CLASS = 'guidebox-container';

/** Selectors for elements that can participate in a viewer's keyboard focus cycle. */
const TABBABLE_SELECTOR = 'input, select, textarea, a[href], button, [tabindex], [contenteditable]:not([contenteditable="false"])';

/**
 * Provides stateless, map-scoped DOM utilities.
 */
export abstract class DomHelper {
  // #region GENERIC (id & root helpers - prefix is getGV)

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
   * Reads a `data-*` attribute from a map's root GeoView element.
   *
   * The root element is the host-provided `geoview-map` div, so consumers can set declarative hints on it
   * (e.g. `data-footer-height`). Centralizing the read here keeps every consumer using the same map-scoped
   * root lookup instead of composing `document`/`getAttribute` calls by hand.
   *
   * @param mapId - The map identifier
   * @param dataAttribute - The full attribute name, including the `data-` prefix (e.g. 'data-footer-height')
   * @returns The attribute value, or undefined when the root is not mounted or the attribute is absent
   */
  static getGVRootDataAttribute(mapId: string, dataAttribute: string): string | undefined {
    return DomHelper.getGVRootElement(mapId)?.getAttribute(dataAttribute) ?? undefined;
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
   */
  static getGVElementById<T extends HTMLElement = HTMLElement>(mapId: string, suffix: string): T | undefined {
    const fullId = DomHelper.buildGVElementId(mapId, suffix);
    const root = DomHelper.getGVRootElement(mapId);

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
   */
  static getGVElementByFullId<T extends HTMLElement = HTMLElement>(mapId: string, fullId: string): T | undefined {
    const root = DomHelper.getGVRootElement(mapId);

    // Scoped lookup within the map root (preferred).
    if (root) return root.querySelector<T>(`#${CSS.escape(fullId)}`) ?? undefined;

    // Fallback: not map-scoped — warn because it can resolve an element from another map.
    logger.logWarning(`getGVElementByFullId: root element for map '${mapId}' not found, falling back to global document lookup`, fullId);
    return (document.getElementById(fullId) as T | null) ?? undefined;
  }

  // #endregion GENERIC (id & root helpers)

  // #region CSS (scoped selector queries - prefix is queryGV)

  /**
   * Runs a CSS selector scoped inside a map's root element.
   *
   * When the root is not mounted yet, it falls back to a global `document.querySelector` and logs a
   * warning, because a global query is not map-scoped and can resolve an element from another map.
   *
   * @param mapId - The map identifier
   * @param selector - Any valid CSS selector, evaluated within the map's root element
   * @returns The first matching element, or undefined when none is found
   */
  static queryGVSelector<T extends Element = HTMLElement>(mapId: string, selector: string): T | undefined {
    const root = DomHelper.getGVRootElement(mapId);

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
   */
  static queryGVSelectorAll<T extends Element = HTMLElement>(mapId: string, selector: string): T[] {
    const root = DomHelper.getGVRootElement(mapId);

    // Scoped query within the map root (preferred).
    if (root) return Array.from(root.querySelectorAll<T>(selector));

    // Fallback: not map-scoped — warn because it can resolve elements from another map.
    logger.logWarning(`queryGVSelectorAll: root element for map '${mapId}' not found, falling back to global document query`, selector);
    return Array.from(document.querySelectorAll<T>(selector));
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
    const elements = DomHelper.queryGVSelectorAll<HTMLElement>(mapId, `#${CSS.escape(root.id)} :is(${TABBABLE_SELECTOR})`);
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

  // #endregion CSS (scoped selector queries)

  // #region MAP SPECIFIC

  /**
   * Gets the map container HTML element for the specified map.
   *
   * @param mapId - The map identifier
   * @returns The map container HTML element
   * @throws {Error} When the map container element is not found
   */
  static getMapContainer(mapId: string): HTMLElement {
    const mapContainer = DomHelper.getGVElementById(mapId, 'map');
    if (mapContainer) return mapContainer;
    throw new Error(`Map container element not found for mapId: ${mapId}`);
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
    return DomHelper.getGVElementById<T>(mapId, GV_DOM_SUFFIX.mapTarget);
  }

  /**
   * Resolves a map's shell container element (the wrapper around the whole viewer chrome).
   *
   * Imperative counterpart to the reactive `useStoreAppShellContainer` hook, for non-React callers
   * (plugins, controllers, utils) that hold a `mapId` rather than the React context.
   *
   * @param mapId - The map identifier
   * @returns The shell container element, or undefined when the map is not yet mounted
   */
  static getShellElement<T extends HTMLElement = HTMLElement>(mapId: string): T | undefined {
    return DomHelper.getGVElementById<T>(mapId, GV_DOM_SUFFIX.shell);
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
    const containers = Array.from(document.querySelectorAll<HTMLElement>(`.${GUIDEBOX_CONTAINER_CLASS}[data-map-id="${mapId}"]`));

    // Prefer the visible copy — the hidden inline one reports no client rects.
    return containers.find((el) => el.getClientRects().length > 0) ?? containers[0];
  }

  /**
   * Gets the north pole marker element.
   *
   * @param mapId - The map identifier
   * @returns The north pole marker HTML element, if found
   */
  static getNorthPole(mapId: string): HTMLElement | undefined {
    return DomHelper.getGVElementById(mapId, 'northpole');
  }

  /**
   * Gets the click marker element.
   *
   * @param mapId - The map identifier
   * @returns The click marker HTML element, if found
   */
  static getClickMarker(mapId: string): HTMLElement | undefined {
    return DomHelper.getGVElementById(mapId, 'clickmarker');
  }

  /**
   * Gets the map info bar element.
   *
   * @param mapId - The map identifier
   * @returns The map info bar HTML element, if found
   */
  static getMapInfo(mapId: string): HTMLElement | undefined {
    return DomHelper.getGVElementById(mapId, 'mapInfo');
  }

  /**
   * Gets the metric scale control bar element.
   *
   * @param mapId - The map identifier
   * @returns The metric scale control bar element, if found
   */
  static getScaleControlBarMetric(mapId: string): HTMLElement | undefined {
    return DomHelper.getGVElementById(mapId, 'scaleControlBarMetric');
  }

  /**
   * Gets the imperial scale control bar element.
   *
   * @param mapId - The map identifier
   * @returns The imperial scale control bar element, if found
   */
  static getScaleControlBarImperial(mapId: string): HTMLElement | undefined {
    return DomHelper.getGVElementById(mapId, 'scaleControlBarImperial');
  }

  // #endregion MAP SPECIFIC

  // #region DATA-TABLE SPECIFIC

  static readonly DataTable = class DataTable {
    /**
     * Gets the data table panel in a map's root element.
     *
     * @param mapId - The ID of the map containing the data panel
     * @returns The data table panel, if found
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

  // #region SWIPER SPECIFIC

  static readonly Swiper = class Swiper {
    /**
     * Waits for this map's layer settings button to appear and clicks it.
     *
     * @param mapId - The ID of the map containing the layer settings button
     * @returns The clicked layer settings button
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
     */
    static async waitForSwiperBarOption(mapId: string): Promise<void> {
      await DomHelper.waitForDomElement('[data-testid="swiper-bar-option"]', DomHelper.getGVRootElement(mapId));
    }
  };

  // #endregion SWIPER SPECIFIC

  // #region SETTERS

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

  // #endregion SETTERS

  // #region WAIT HELPERS GENERIC

  /**
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
    return DomHelper.waitForDomChange(element, () => !!element.textContent?.trim(), timeout);
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

  // #endregion WAIT HELPERS GENERIC

  // #region WAIT HELPERS SPECIFIC

  /**
   * Waits for an app bar tab button to receive the active class.
   *
   * @param mapId - The map container identifier
   * @param tabId - The app bar tab identifier
   * @returns A promise that resolves with the active app bar tab button element
   */
  static waitForAppbarTabSelected(mapId: string, tabId: string): Promise<Element> {
    return DomHelper.waitForClass(`#${mapId}-appBar-${tabId}-panel-btn.active`, this.getGVRootElement(mapId));
  }

  /**
   * Waits for an app bar tab button to no longer have the active class.
   *
   * @param mapId - The map container identifier
   * @param tabId - The app bar tab identifier
   * @returns A promise that resolves with the inactive app bar tab button element
   */
  static waitForAppbarTabNotSelected(mapId: string, tabId: string): Promise<Element> {
    return DomHelper.waitForClass(`#${mapId}-appBar-${tabId}-panel-btn:not(.active)`, this.getGVRootElement(mapId));
  }

  /**
   * Waits for a footer tab to receive the selected class.
   *
   * @param mapId - The map container identifier
   * @param tabId - The footer tab identifier
   * @returns A promise that resolves with the selected footer tab element
   */
  static waitForFooterTabSelected(mapId: string, tabId: string): Promise<Element> {
    return DomHelper.waitForClass(`#${mapId}-tab-${tabId}.Mui-selected`, this.getGVRootElement(mapId));
  }

  /**
   * Waits for a footer tab to no longer have the selected class.
   *
   * @param mapId - The map container identifier
   * @param tabId - The footer tab identifier
   * @returns A promise that resolves with the inactive footer tab element
   */
  static waitForFooterTabNotSelected(mapId: string, tabId: string): Promise<Element> {
    return DomHelper.waitForClass(`#${mapId}-tab-${tabId}:not(.Mui-selected)`, this.getGVRootElement(mapId));
  }

  // #endregion WAIT HELPERS SPECIFIC
}
