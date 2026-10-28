import type { TypeDisplayLanguage, TypeScaleInfo } from '@/api/types/map-schema-types';
import { getGVElementById, getGVRootElement, setInputValue, waitForClass, waitForDomElement } from '@/core/utils/dom-helper';
import { whenThisThen } from '@/core/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';

export class MapDOMAdapter {
  mapId: string;

  /**
   * Creates a new instance of the MapDOMAdapter for the specified map container element.
   *
   * @param mapId The ID of the map container element
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  // #region PUBLIC METHODS

  /**
   * Gets the root HTML element of the map container.
   *
   * @returns The root HTML element of the map container
   * @throws Error if the root element is not found
   */
  getHTMLElementRoot(): HTMLElement {
    const rootElement = getGVRootElement(this.mapId);
    if (rootElement) return rootElement;
    throw new Error(`Root element not found for mapId: ${this.mapId}`);
  }

  /**
   * Gets the map keyboard event target element.
   *
   * @returns The map container HTML element, if found
   */
  getHTMLElementMapContainer(): HTMLElement | undefined {
    return getGVElementById(this.mapId, 'map');
  }

  /**
   * Gets the scale control bar metric element.
   *
   * @returns The scale control bar metric HTML element, if found
   */
  getHTMLElementScaleControlBarMetric(): HTMLElement | undefined {
    return getGVElementById(this.mapId, 'scaleControlBarMetric');
  }

  /**
   * Gets the scale control bar imperial element.
   *
   * @returns The scale control bar imperial HTML element, if found
   */
  getHTMLElementScaleControlBarImperial(): HTMLElement | undefined {
    return getGVElementById(this.mapId, 'scaleControlBarImperial');
  }

  /**
   * Gets the north pole marker element.
   *
   * @returns The north pole marker HTML element, if found
   */
  getHTMLElementNorthPole(): HTMLElement | undefined {
    return getGVElementById(this.mapId, 'northpole');
  }

  /**
   * Gets the click marker element.
   *
   * @returns The click marker HTML element, if found
   */
  getHTMLElementClickMarker(): HTMLElement | undefined {
    return getGVElementById(this.mapId, 'clickmarker');
  }

  /**
   * Waits for this map's layer settings button to appear and clicks it.
   *
   * @returns The clicked layer settings button
   */
  async waitAndClickLayerSettingsButton(): Promise<HTMLButtonElement> {
    const settingsButton = await waitForDomElement('button[aria-label="Layer settings"]', this.getHTMLElementRoot());
    if (!(settingsButton instanceof HTMLButtonElement)) throw new Error('The layer settings control is not a button');

    settingsButton.click();
    return settingsButton;
  }

  /**
   * Waits for the Swiper bar option to appear in this map's layer settings.
   *
   * @returns A promise that resolves when the option is rendered
   */
  async waitForSwiperBarOption(): Promise<void> {
    await waitForDomElement('[data-testid="swiper-bar-option"]', this.getHTMLElementRoot());
  }

  /**
   * Waits for an app bar tab button to receive the active class.
   *
   * @param tabId - The app bar tab identifier
   * @returns A promise that resolves with the active app bar tab button element
   */
  waitForAppbarTabSelected(tabId: string): Promise<Element> {
    return waitForClass(`#${this.mapId}-appBar-${tabId}-panel-btn.active`, this.getHTMLElementRoot());
  }

  /**
   * Waits for an app bar tab button to no longer have the active class.
   *
   * @param tabId - The app bar tab identifier
   * @returns A promise that resolves with the inactive app bar tab button element
   */
  waitForAppbarTabNotSelected(tabId: string): Promise<Element> {
    return waitForClass(`#${this.mapId}-appBar-${tabId}-panel-btn:not(.active)`, this.getHTMLElementRoot());
  }

  /**
   * Waits for a footer tab to receive the selected class.
   *
   * @param tabId - The footer tab identifier
   * @returns A promise that resolves with the selected footer tab element
   */
  waitForFooterTabSelected(tabId: string): Promise<Element> {
    return waitForClass(`#${this.mapId}-tab-${tabId}.Mui-selected`, this.getHTMLElementRoot());
  }

  /**
   * Waits for a footer tab to no longer have the selected class.
   *
   * @param tabId - The footer tab identifier
   * @returns A promise that resolves with the inactive footer tab element
   */
  waitForFooterTabNotSelected(tabId: string): Promise<Element> {
    return waitForClass(`#${this.mapId}-tab-${tabId}:not(.Mui-selected)`, this.getHTMLElementRoot());
  }

  /**
   * Gets the map info bar element.
   *
   * @returns The map info bar HTML element, if found
   */
  getHTMLElementMapInfo(): HTMLElement | undefined {
    return getGVElementById(this.mapId, 'mapInfo');
  }

  /**
   * Retrieves the scale information from the DOM elements.
   *
   * @returns The scale information object
   */
  getScaleInfoFromDomElement(): TypeScaleInfo {
    // Get metric values
    const scaleControlBarMetric = this.getHTMLElementScaleControlBarMetric();
    const lineWidthMetric = (scaleControlBarMetric?.querySelector('.ol-scale-bar-inner') as HTMLElement)?.style.width;
    const labelGraphicMetric = (scaleControlBarMetric?.querySelector('.ol-scale-bar-inner')?.lastChild as HTMLElement)?.innerHTML;

    // Get imperial values
    const scaleControlBarImperial = this.getHTMLElementScaleControlBarImperial();
    const lineWidthImperial = (scaleControlBarImperial?.querySelector('.ol-scale-bar-inner') as HTMLElement)?.style.width;
    const labelGraphicImperial = (scaleControlBarImperial?.querySelector('.ol-scale-bar-inner')?.lastChild as HTMLElement)?.innerHTML;

    // get resolution value (same for metric and imperial)
    const labelNumeric = (scaleControlBarMetric?.querySelector('.ol-scale-text') as HTMLElement)?.innerHTML;

    return { lineWidthMetric, labelGraphicMetric, lineWidthImperial, labelGraphicImperial, labelNumeric };
  }

  getHTMLDataTablePanel(): HTMLElement | undefined {
    return this.getHTMLElementMapContainer()?.querySelector('.data-table-panel') ?? undefined;
  }

  getHTMLDataTableContainer(): HTMLElement | undefined {
    return this.getHTMLDataTablePanel()?.querySelector('.data-table-container') ?? undefined;
  }

  getDataTableColumnHeaderCell(columnName: string): HTMLTableCellElement | undefined {
    return Array.from(this.getHTMLDataTableContainer()?.querySelectorAll('[data-column-id]') ?? []).find((hc) => {
      return hc.getAttribute('data-column-id')?.toLowerCase() === columnName.toLowerCase();
    }) as HTMLTableCellElement | undefined;
  }

  getDataTableColumnFilterInput(columnName: string): HTMLInputElement {
    return Array.from(this.getDataTableColumnHeaderCell(columnName)?.querySelectorAll('input') ?? [])[0] ?? undefined;
  }

  getDataTableColumnRangeFilterInput(columnName: string, bound: 'Min' | 'Max'): HTMLInputElement | undefined {
    const columnHeaderCell = this.getDataTableColumnHeaderCell(columnName);
    if (!columnHeaderCell) return undefined;

    return Array.from(columnHeaderCell.querySelectorAll<HTMLInputElement>(`input[aria-label="${bound}"]`) ?? []).find(
      (input) => input.closest<HTMLTableCellElement>('th')?.cellIndex === columnHeaderCell.cellIndex
    );
  }

  /**
   * Shows the data table column filters when they are hidden.
   *
   * @param columnName - The column whose filter should be shown
   */
  async showColumnFilter(columnName: string): Promise<void> {
    await this.#setColumnFilterVisibility(columnName, true);
  }

  /**
   * Hides the data table column filters when they are shown.
   *
   * @param columnName - The column whose filter should be hidden
   */
  async hideColumnFilter(columnName: string): Promise<void> {
    await this.#setColumnFilterVisibility(columnName, false);
  }

  /**
   * Toggles the visibility of the data table column filters.
   *
   * @param columnName - The column whose filter visibility determines the toggle state
   */
  async toggleColumnFilter(columnName: string): Promise<void> {
    const columnHeaderCell = this.getDataTableColumnHeaderCell(columnName);
    const shouldShowFilter = !columnHeaderCell?.querySelector('input');
    await this.#setColumnFilterVisibility(columnName, shouldShowFilter);
  }

  /**
   * Sets a column filter input to a value and waits for the filter state and React rendering to settle.
   *
   * @param columnName - The column name whose filter input should be updated
   * @param value - The filter value to enter
   */
  async setDataTableColumnFilterInput(columnName: string, value: string): Promise<void> {
    // Make sure the column filter is shown
    await this.showColumnFilter(columnName);
    const input = this.getDataTableColumnFilterInput(columnName);

    // Add a test step indicating that we are setting the data table column filter input for the specified column
    setInputValue(input, value);
  }

  /**
   * Sets one bound of a column's range filter in the data table.
   *
   * @param test - The test currently being executed
   * @param layerPath - The layer path whose data table filter should be updated
   * @param columnName - The column name to filter
   * @param value - The bound value to enter
   * @param bound - The range-filter bound to update
   */
  async setDataTableColumnFilterInputRange(
    columnName: string,
    value: string,
    format: string,
    language: TypeDisplayLanguage,
    bound: 'Min' | 'Max'
  ): Promise<void> {
    // Find the input filter html component
    const input = await this.#findDataTableColumnRangeFilterInput(columnName, bound);

    // Set the value
    setInputValue(input, MapDOMAdapter.#formatDateRangeFilterInputValue(input, format, language, value));
  }

  clearDataTableFilters(): void {
    const toolbar = this.getHTMLDataTablePanel()?.querySelector('.data-table-top-toolbar');
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

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Finds a range-filter input for a specific column in the data table.
   *
   * @param test - The test currently being executed
   * @param columnName - The column name whose range filter should be found
   * @param bound - The range-filter bound to find
   * @returns The range-filter input element
   * @throws {Error} When the range-filter input is not found
   */
  async #findDataTableColumnRangeFilterInput(columnName: string, bound: 'Min' | 'Max'): Promise<HTMLInputElement> {
    await this.showColumnFilter(columnName);
    const rangeFilterInput = this.getDataTableColumnRangeFilterInput(columnName, bound);

    // If not found, throw an error indicating the filter input could not be found
    if (!rangeFilterInput) throw new Error(`The ${bound.toLowerCase()} filter input was not found for column ${columnName}`);

    // Return it
    return rangeFilterInput;
  }

  /**
   * Sets the visibility of the data table column filters.
   *
   * @param test - The test currently being executed
   * @param columnName - The column whose filter visibility should be changed
   * @param shouldShowFilter - Whether the column filters should be shown
   * @throws {TestError} When the column-filter toggle is not found
   */
  async #setColumnFilterVisibility(columnName: string, shouldShowFilter: boolean): Promise<void> {
    const columnHeaderCell = this.getDataTableColumnHeaderCell(columnName);
    const isFilterVisible = (): boolean => !!columnHeaderCell?.querySelector('input');
    if (isFilterVisible() === shouldShowFilter) return;

    const filterToggle = Array.from(this.getHTMLElementRoot().querySelectorAll<HTMLLabelElement>('label.MuiFormControlLabel-root')).find(
      (label) => {
        const labelText = label.textContent?.toLowerCase() ?? '';
        return labelText.includes('filter') && (labelText.includes('show') || labelText.includes('hide'));
      }
    );
    if (!filterToggle) throw new Error('The data table column-filter toggle was not found');

    filterToggle.click();
    await whenThisThen(() => isFilterVisible() === shouldShowFilter);
  }

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

  /**
   * Formats an ISO calendar date for the configured date-picker field.
   *
   * @param input - The range-filter input element
   * @param layerPath - The layer path whose date format should be used
   * @param value - The filter value to format
   * @returns The date formatted for the date picker, or the original value for other inputs
   */
  static #formatDateRangeFilterInputValue(input: HTMLInputElement, format: string, language: TypeDisplayLanguage, value: string): string {
    if (!input.closest('.MuiPickersInputBase-root') || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    return DateMgt.formatDate(value, format, language, DateMgt.TIME_UTC, 'calendar');
  }

  // #endregion STATIC METHODS
}
