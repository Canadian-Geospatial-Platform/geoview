import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { TypeContainerBox, TypeHTMLElement } from '@/core/types/global-types';
/**
 * Provides stateless, map-scoped DOM utilities.
 */
export declare abstract class DomHelper {
    #private;
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
    static buildGVElementId(mapId: string, suffix: string): string;
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
    static getGVRootElement(mapId: string): HTMLElement;
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
    static getGVElementById<T extends HTMLElement = HTMLElement>(mapId: string, suffix: string): T | undefined;
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
    static getGVElementByFullId<T extends HTMLElement = HTMLElement>(mapId: string, fullId: string): T | undefined;
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
    static queryGVSelector<T extends Element = HTMLElement>(mapId: string, selector: string): T | undefined;
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
    static queryGVSelectorAll<T extends Element = HTMLElement>(mapId: string, selector: string): T[];
    /**
     * Gets the layer list item button in the specified Layers panel.
     *
     * @param mapId - The map identifier
     * @param layerPath - The full layer path
     * @param containerType - The app bar or footer bar containing the Layers panel
     * @returns The layer list item button element, or undefined when it is not rendered
     */
    static getLayerBoxInLayersPanel(mapId: string, layerPath: string, containerType: TypeContainerBox): HTMLElement | undefined;
    /**
     * Gets the visibility toggle button for a layer in a map's layer panel.
     *
     * @param mapId - The map identifier
     * @param layerPath - The full layer path
     * @param containerType - The app bar or footer bar containing the Layers panel
     * @returns The visibility button, or undefined when the layer row or button is not rendered
     */
    static getVisibleButton(mapId: string, layerPath: string, containerType: TypeContainerBox): HTMLButtonElement | undefined;
    /**
     * Checks whether a layer's visibility button displays the visible eye icon.
     *
     * @param mapId - The map identifier
     * @param layerPath - The full layer path
     * @param containerType - The app bar or footer bar containing the Layers panel
     * @returns True for the visible eye icon, or false for the hidden eye icon
     * @throws {Error} When the visibility button is missing or its eye icon state is ambiguous
     */
    static getVisibleButtonVisibility(mapId: string, layerPath: string, containerType: TypeContainerBox): boolean;
    /**
     * Returns visible tabbable elements in keyboard order within a map's focus trap.
     *
     * MUI's default list includes elements hidden by panels, which can leave Shift+Tab on the first skip link with nowhere visible to go.
     *
     * @param mapId - The map containing the focus trap
     * @param root - The viewer shell containing the focusable elements
     * @returns The currently visible and enabled elements in tab order
     */
    static getGVVisibleTabbable(mapId: string, root: HTMLElement): HTMLElement[];
    /**
     * Returns the currently focused element in the document.
     *
     * @returns The active element, or undefined when the document has no active element
     */
    static getActiveElement(): Element | undefined;
    /**
     * Checks whether an element is an input, textarea, select, or contenteditable element.
     *
     * @param element - The element to check, or undefined when there is no active element
     * @returns Whether the element is an input, textarea, select, or contenteditable element
     */
    static isInputOrContentEditableElement(element: Element | null | undefined): boolean;
    /**
     * Checks whether the currently focused element is an input, textarea, select, or contenteditable element.
     *
     * @returns Whether the active element is an input, textarea, select, or contenteditable element
     */
    static isActiveElementInputOrContentEditableElement(): boolean;
    /**
     * Checks whether an element is contenteditable.
     *
     * @param element - The element to check, or undefined when there is no active element
     * @returns Whether the element is contenteditable
     */
    static isContentEditableElement(element: Element | null | undefined): boolean;
    /**
     * Checks whether an element is fully visible in the viewport.
     *
     * @param element - The element to check
     * @returns Whether the element is visible within the viewport
     */
    static isElementInViewport(element: Element): boolean;
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
    static scrollIfNotVisible(element: HTMLElement, blockValue: ScrollLogicalPosition, offset?: number): void;
    /**
     * Scrolls a list item into view within its scrollable container only, without scrolling the page.
     *
     * Adds a 20px gap for better visibility when scrolling.
     *
     * @param listItem - The list item element to scroll into view
     */
    static scrollListItemIntoView(listItem: HTMLElement): void;
    /**
     * Sets an input's value and dispatches bubbling input and change events.
     *
     * @param input - The input element to update
     * @param value - The value to set
     * @throws {Error} When the native input value setter is unavailable
     */
    static setInputValue(input: HTMLInputElement, value: string): void; /**
     * Returns a promise that resolves when an element matching the given selector exists in the DOM.
     *
     * Resolves immediately if the element already exists. Otherwise, observes the parent for child additions.
     *
     * @param selector - The CSS selector to query for
     * @param parent - Optional parent element to observe (defaults to `document.body`)
     * @param timeout - Optional maximum duration in milliseconds to wait before rejecting
     * @returns A promise that resolves with the matched element
     */
    static waitForDomElement(selector: string, parent?: Element, timeout?: number): Promise<Element>;
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
    static watchHtmlElementRemoval(key: string, element: HTMLElement, onHTMLElementRemoved: (key: string) => void): void;
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
    static waitForClass(selector: string, parent?: Element, timeout?: number): Promise<Element>;
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
    static waitForDomChange(element: Element, filter?: () => boolean, timeout?: number): Promise<void>;
    /**
     * Returns a promise that resolves when the given element has non-empty text content.
     *
     * @param element - The element whose text content to await
     * @param timeout - Optional maximum duration in milliseconds to wait before rejecting
     * @returns A promise that resolves when the element has text content
     */
    static waitForDomContent(element: Element, timeout?: number): Promise<void>;
    /**
     * Waits for React to commit, paint, and run effects after a state change.
     *
     * @returns A promise that resolves once React has rendered, painted, and executed effects
     */
    static waitForReactIdle(): Promise<void>;
    /**
     * Waits until the browser's main thread becomes idle using `requestIdleCallback`.
     *
     * @returns A promise that resolves when the browser reports an idle period
     */
    static waitForBrowserIdle(): Promise<void>;
    /**
     * Builds the DOM id for a map's shell container.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped shell container id
     */
    static buildShellId(mapId: string): string;
    /**
     * Resolves a map's shell container element (the wrapper around the whole viewer chrome).
     *
     * Imperative counterpart to the React `useShellContainer` hook, for non-React callers
     * (plugins, controllers, utils) that hold a `mapId` rather than the React context.
     *
     * @param mapId - The map identifier
     * @returns The shell container element, or undefined when the map is not yet mounted
     */
    static getShellElement(mapId: string): TypeHTMLElement | undefined;
    /**
     * Builds the DOM id for a map's container.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped map container id
     */
    static buildMapContainerId(mapId: string): string;
    /**
     * Gets the map container HTML element for the specified map.
     *
     * @param mapId - The map identifier
     * @returns The map container HTML element
     * @throws {Error} When the map container element is not found
     */
    static getMapContainer(mapId: string): HTMLElement;
    /**
     * Returns the currently focused element when it belongs to the specified map.
     *
     * @param mapId - The map identifier
     * @returns The active element inside the map, or undefined when focus is outside the map
     */
    static getActiveElementWithinMap(mapId: string): Element | undefined;
    /**
     * Builds the DOM id for the map's footer tabs container.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped footer tabs container id
     */
    static buildTabsContainerId(mapId: string): string;
    /**
     * Gets the footer tabs container element.
     *
     * @param mapId - The map identifier
     * @returns The footer tabs container element, if found
     */
    static getTabsContainer(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for the map's footer bar header.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped footer bar header id
     */
    static buildFooterBarHeaderId(mapId: string): string;
    /**
     * Gets the footer bar header element.
     *
     * @param mapId - The map identifier
     * @returns The footer bar header element, if found
     */
    static getFooterBarHeader(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for a map's OpenLayers target element.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped target element id
     */
    static buildMapTargetElementId(mapId: string): string;
    /**
     * Resolves a map's OpenLayers map target element (the canvas container).
     *
     * Thin named getter over {@link getGVElementById} for the heavily-reused `mapTargetElement` landmark, so
     * call sites do not repeat the suffix string and get a typed result.
     *
     * @param mapId - The map identifier
     * @returns The map target element, or undefined when the map is not yet mounted
     */
    static getMapTargetElement<T extends HTMLElement = HTMLElement>(mapId: string): T | undefined;
    /**
     * Gets the footer height override from the map root, or returns the provided fallback.
     *
     * @param mapId - The map identifier
     * @param defaultHeight - The height to use (in px) when the map root has no `data-footer-height` value
     * @returns The configured footer height or the provided default
     * @throws {Error} When the root element is not found
     */
    static getDataFooterHeight(mapId: string, defaultHeight: number): string;
    /**
     * Gets the map configuration URL from the root element.
     *
     * @param mapId - The map identifier
     * @returns The configured URL, or undefined when the attribute is absent
     * @throws {Error} When the root element is not found
     */
    static getDataConfigUrl(mapId: string): string | undefined;
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
    static getGuidebox(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for the map's north pole marker.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped north pole marker id
     */
    static buildNorthPoleId(mapId: string): string;
    /**
     * Gets the north pole marker element.
     *
     * @param mapId - The map identifier
     * @returns The north pole marker HTML element, if found
     */
    static getNorthPole(mapId: string): HTMLElement | undefined;
    /**
     * Gets the north arrow SVG rendered inside a map's target element.
     *
     * @param mapId - The map identifier
     * @returns The north arrow SVG element, if found
     */
    static getNorthArrowSVG(mapId: string): SVGSVGElement | undefined;
    /**
     * Builds the DOM id for the map's click marker.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped click marker id
     */
    static buildClickMarkerId(mapId: string): string;
    /**
     * Gets the click marker element.
     *
     * @param mapId - The map identifier
     * @returns The click marker HTML element, if found
     */
    static getClickMarker(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for the map's info bar.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped info bar id
     */
    static buildMapInfoId(mapId: string): string;
    /**
     * Gets the map info bar element.
     *
     * @param mapId - The map identifier
     * @returns The map info bar HTML element, if found
     */
    static getMapInfo(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for the map's home button.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped home button id
     */
    static buildButtonHomeId(mapId: string): string;
    /**
     * Gets the map's home button.
     *
     * @param mapId - The map identifier
     * @returns The home button element, or undefined when it is not present
     */
    static getButtonHome(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for the map's zoom-in button.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped zoom-in button id
     */
    static buildButtonZoomInId(mapId: string): string;
    /**
     * Gets the map's zoom-in button.
     *
     * @param mapId - The map identifier
     * @returns The zoom-in button element, or undefined when it is not present
     * @throws {Error} When the root element is not found
     */
    static getButtonZoomIn(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for the map's zoom-out button.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped zoom-out button id
     */
    static buildButtonZoomOutId(mapId: string): string;
    /**
     * Gets the map's zoom-out button.
     *
     * @param mapId - The map identifier
     * @returns The zoom-out button element, or undefined when it is not present
     * @throws {Error} When the root element is not found
     */
    static getButtonZoomOut(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for a map's measurement button.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped measurement button id
     */
    static buildButtonMeasurementId(mapId: string): string;
    /**
     * Builds the DOM id for a map's measurement button.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped measurement button id
     */
    static getButtonMeasurement(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for the map's clear measurements button.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped clear measurements button id
     */
    static buildButtonClearMeasurements(mapId: string): string;
    /**
     * Gets the map's clear measurements button.
     *
     * @param mapId - The map identifier
     * @returns The clear measurements button element, or undefined when it is not present
     */
    static getButtonClearMeasurements(mapId: string): HTMLElement | undefined;
    /**
     * Gets the map info bar's height in pixels.
     *
     * Returns zero when the map info bar is not present.
     *
     * @param mapId - The map identifier
     * @returns The map info bar height in pixels, or zero when it is not present
     */
    static getMapInfoOffsetHeight(mapId: string): number;
    /**
     * Builds the DOM id for the map's metric scale control bar.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped metric scale control bar id
     */
    static buildScaleControlBarMetricId(mapId: string): string;
    /**
     * Gets the metric scale control bar element.
     *
     * @param mapId - The map identifier
     * @returns The metric scale control bar element, if found
     */
    static getScaleControlBarMetric(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for the map's imperial scale control bar.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped imperial scale control bar id
     */
    static buildScaleControlBarImperialId(mapId: string): string;
    /**
     * Gets the imperial scale control bar element.
     *
     * @param mapId - The map identifier
     * @returns The imperial scale control bar element, if found
     */
    static getScaleControlBarImperial(mapId: string): HTMLElement | undefined;
    /**
     * Gets the guide content container in a map's right panel.
     *
     * @param mapId - The map identifier
     * @returns The guide content container, if found
     */
    static getGuideContainer(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for the guide close button in an app bar or footer bar container.
     *
     * @param mapId - The map identifier
     * @param containerType - The container where the guide is displayed
     * @returns The map-scoped guide close button id
     */
    static buildGuideCloseButtonId(mapId: string, containerType: TypeContainerBox): string;
    /**
     * Gets the guide close button for an app bar or footer bar container.
     *
     * @param mapId - The map identifier
     * @param containerType - The container where the guide is displayed
     * @returns The guide close button element, if found
     */
    static getGuideCloseButton(mapId: string, containerType: TypeContainerBox): HTMLElement | undefined;
    /**
     * Builds the DOM id for the map's app bar version button.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped app bar version button id
     */
    static buildAppBarVersionButtonId(mapId: string): string;
    /**
     * Gets the map's app bar version button.
     *
     * @param mapId - The map identifier
     * @returns The app bar version button element, or undefined when it is not present
     */
    static getAppBarVersionButton(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for the map's app bar version focus trap container.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped app bar version focus trap container id
     */
    static buildAppBarVersionFocusTrapId(mapId: string): string;
    /**
     * Gets the map's app bar version focus trap container.
     *
     * @param mapId - The map identifier
     * @returns The app bar version focus trap container element, or undefined when it is not present
     */
    static getAppBarVersionFocusTrap(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for an app bar tab's panel button.
     *
     * @param mapId - The map identifier
     * @param tabId - The app bar tab identifier
     * @returns The map-scoped app bar panel button id
     */
    static buildAppBarPanelButtonId(mapId: string, tabId: string): string;
    /**
     * Gets an app bar tab button element.
     *
     * @param mapId - The map identifier
     * @param tabId - The app bar tab identifier
     * @returns The app bar button element, if found
     */
    static getAppBarButton(mapId: string, tabId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for an app bar tab's panel.
     *
     * @param mapId - The map identifier
     * @param tabId - The app bar tab identifier
     * @returns The map-scoped app bar panel id
     */
    static buildAppBarPanelId(mapId: string, tabId: string): string;
    /**
     * Gets an app bar panel element.
     *
     * @param mapId - The map identifier
     * @param tabId - The app bar tab identifier
     * @returns The app bar panel element, if found
     */
    static getAppBarPanel(mapId: string, tabId: string): HTMLElement | undefined;
    /**
     * Gets an app bar panel close button element.
     *
     * @param mapId - The map identifier
     * @param tabId - The app bar tab identifier
     * @returns The app bar panel close button element, if found
     */
    static getAppBarPanelCloseButton(mapId: string, tabId: string): HTMLButtonElement | undefined;
    /**
     * Builds the DOM id for the map's WCAG "Skip to main content - Map" link.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped WCAG skip link id
     */
    static buildWCAGLinkToMapId(mapId: string): string;
    /**
     * Gets the map's WCAG "Skip to main content - Map" link.
     *
     * @param mapId - The map identifier
     * @returns The skip link element, or undefined when it is not present
     */
    static getWCAGLinkToMap(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for a map's top skip link.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped top skip link id
     */
    static buildWCAGTopLinkId(mapId: string): string;
    /**
     * Gets the map's top skip link element.
     *
     * @param mapId - The map identifier
     * @returns The top skip link element, or undefined when it is not present
     */
    static getWCAGTopLink(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for a map's bottom skip link.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped bottom skip link id
     */
    static buildWCAGBottomLinkId(mapId: string): string;
    /**
     * Gets the map's WCAG bottom skip link element.
     *
     * @param mapId - The map identifier
     * @returns The bottom skip link element, or undefined when it is not present
     */
    static getWCAGBottomLink(mapId: string): HTMLElement | undefined;
    /**
     * Waits for the legend's panel button to render in an app bar or footer bar container.
     *
     * @param mapId - The map identifier
     * @param containerType - The container where the legend is displayed
     * @param timeout - Optional maximum duration in milliseconds to wait before rejecting
     * @returns A promise that resolves with the legend app bar button, or the legend footer bar tab
     * @throws {Error} When the root element is not found or the button is not rendered before the timeout
     */
    static waitForLegendPanelButton(mapId: string, containerType: TypeContainerBox, timeout?: number): Promise<HTMLElement>;
    /**
     * Waits for an app bar tab button to receive the active class.
     *
     * @param mapId - The map container identifier
     * @param tabId - The app bar tab identifier
     * @returns A promise that resolves with the active app bar tab button element
     * @throws {Error} When the root element is not found
     */
    static waitForAppbarTabSelected(mapId: string, tabId: string): Promise<Element>;
    /**
     * Waits for an app bar tab button to no longer have the active class.
     *
     * @param mapId - The map container identifier
     * @param tabId - The app bar tab identifier
     * @returns A promise that resolves with the inactive app bar tab button element
     * @throws {Error} When the root element is not found
     */
    static waitForAppbarTabNotSelected(mapId: string, tabId: string): Promise<Element>;
    /**
     * Waits for a footer tab to receive the selected class.
     *
     * @param mapId - The map container identifier
     * @param tabId - The footer tab identifier
     * @returns A promise that resolves with the selected footer tab element
     * @throws {Error} When the root element is not found
     */
    static waitForFooterTabSelected(mapId: string, tabId: string): Promise<Element>;
    /**
     * Waits for a footer tab to no longer have the selected class.
     *
     * @param mapId - The map container identifier
     * @param tabId - The footer tab identifier
     * @returns A promise that resolves with the inactive footer tab element
     * @throws {Error} When the root element is not found
     */
    static waitForFooterTabNotSelected(mapId: string, tabId: string): Promise<Element>;
    static readonly DataTable: {
        new (): {};
        /**
         * Gets the data table panel in a map's root element.
         *
         * @param mapId - The ID of the map containing the data panel
         * @returns The data table panel, if found
         * @throws {Error} When the root element is not found
         */
        getDataTablePanel(mapId: string): HTMLElement | undefined;
        /**
         * Gets the data table content container element.
         *
         * @param mapId - The ID of the map containing the data table
         * @returns The data table container element, if found
         */
        getDataTableContainer(mapId: string): HTMLElement | undefined;
        /**
         * Gets the first enabled row zoom button in the data table.
         *
         * @param mapId - The ID of the map containing the data table
         * @returns The first enabled row zoom button, if found
         */
        getFirstRowZoomButton(mapId: string): HTMLButtonElement | undefined;
        /**
         * Waits for the data table element to render inside this map's data table container.
         *
         * @param mapId - The map identifier
         * @returns A promise that resolves with the rendered table element
         * @throws {Error} When the root element is not found
         */
        waitForDataTable(mapId: string): Promise<Element>;
        /**
         * Waits for the data table filter results summary to render within this map.
         *
         * @param mapId - The map identifier
         * @returns A promise that resolves with the filter results summary element
         * @throws {Error} When the root element is not found
         */
        waitForFilterResultsSummary(mapId: string): Promise<Element>;
        /**
         * Gets the header cell for a data table column, matching its column id without regard to case.
         *
         * @param mapId - The ID of the map containing the data table
         * @param columnName - The column name to find
         * @returns The matching column header cell, if found
         */
        getDataTableColumnHeaderCell(mapId: string, columnName: string): HTMLTableCellElement | undefined;
        /**
         * Gets the first filter input in a data table column header.
         *
         * @param mapId - The ID of the map containing the data table
         * @param columnName - The column name whose filter input to get
         * @returns The column filter input element
         */
        getDataTableColumnFilterInput(mapId: string, columnName: string): HTMLInputElement;
        /**
         * Gets a bound input for a data table column range filter.
         *
         * @param mapId - The ID of the map containing the data table
         * @param columnName - The column name whose range filter to inspect
         * @param bound - The range-filter bound to get
         * @returns The matching bound input, if found
         */
        getDataTableColumnRangeFilterInput(mapId: string, columnName: string, bound: "Min" | "Max"): HTMLInputElement | undefined;
        /**
         * Shows the data table column filters when they are hidden.
         *
         * @param mapId - The ID of the map containing the data table
         * @param columnName - The column whose filter should be shown
         * @throws {Error} When the filter visibility control is not found
         */
        showColumnFilter(mapId: string, columnName: string): Promise<void>;
        /**
         * Hides the data table column filters when they are shown.
         *
         * @param mapId - The ID of the map containing the data table
         * @param columnName - The column whose filter should be hidden
         * @throws {Error} When the filter visibility control is not found
         */
        hideColumnFilter(mapId: string, columnName: string): Promise<void>;
        /**
         * Toggles the visibility of the data table column filters.
         *
         * @param mapId - The ID of the map containing the data table
         * @param columnName - The column whose filter visibility determines the toggle state
         * @throws {Error} When the filter visibility control is not found
         */
        toggleColumnFilter(mapId: string, columnName: string): Promise<void>;
        /**
         * Shows a column filter if needed and sets its input value.
         *
         * @param mapId - The ID of the map containing the data table
         * @param columnName - The column name whose filter input should be updated
         * @param value - The value to enter in the filter input
         * @throws {Error} When the filter visibility control cannot be found
         */
        setDataTableColumnFilterInput(mapId: string, columnName: string, value: string): Promise<void>;
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
        setDataTableColumnFilterInputRange(mapId: string, columnName: string, value: string, format: string, language: TypeDisplayLanguage, bound: "Min" | "Max"): Promise<void>;
        /**
         * Clears the data table filters using the table's clear-filters control.
         *
         * @param mapId - The ID of the map containing the data table
         * @throws {Error} When the data table toolbar or clear-filters button is not found
         */
        clearDataTableFilters(mapId: string): void;
        /**
         * Checks whether a data table column's filter input is visible.
         *
         * @param mapId - The ID of the map containing the data table
         * @param columnName - The column whose filter visibility to check
         * @returns Whether the filter input is visible
         */
        isFilterVisible(mapId: string, columnName: string): boolean;
        /**
         * Finds a range-filter input for a specific column in the data table.
         *
         * @param mapId - The ID of the map containing the data table
         * @param columnName - The column name whose range filter should be found
         * @param bound - The range-filter bound to find
         * @returns The range-filter input element
         * @throws {Error} When the range-filter input is not found
         */
        findDataTableColumnRangeFilterInput(mapId: string, columnName: string, bound: "Min" | "Max"): Promise<HTMLInputElement>;
        /**
         * Sets the visibility of the data table column filters.
         *
         * @param mapId - The ID of the map containing the data table
         * @param columnName - The column whose filter visibility should be changed
         * @param shouldShowFilter - Whether the column filters should be shown
         * @throws {Error} When the root element is not found
         * @throws {Error} When the column-filter toggle is not found
         */
        setColumnFilterVisibility(mapId: string, columnName: string, shouldShowFilter: boolean): Promise<void>;
    };
    /**
     * Builds the DOM id for a map's drawer draw button.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped drawer draw button id
     */
    static buildDrawerDrawButtonId(mapId: string): string;
    /**
     * Gets the map's drawer draw button.
     *
     * @param mapId - The map identifier
     * @returns The drawer draw button element, or undefined when it is not present
     */
    static getDrawerDrawButton(mapId: string): HTMLElement | undefined;
    /**
     * Builds the DOM id for a map's drawer edit button.
     *
     * @param mapId - The map identifier
     * @returns The map-scoped drawer edit button id
     */
    static buildDrawerEditButtonId(mapId: string): string;
    /**
     * Gets the map's drawer edit button.
     *
     * @param mapId - The map identifier
     * @returns The drawer edit button element, or undefined when it is not present
     */
    static getDrawerEditButton(mapId: string): HTMLElement | undefined;
    static readonly Swiper: {
        new (): {};
        /**
         * Waits for this map's layer settings button to appear and clicks it.
         *
         * @param mapId - The ID of the map containing the layer settings button
         * @returns The clicked layer settings button
         * @throws {Error} When the root element is not found
         * @throws {Error} When the matched settings control is not a button
         */
        waitAndClickLayerSettingsButton(mapId: string): Promise<HTMLButtonElement>;
        /**
         * Waits for the Swiper bar option to appear in this map's layer settings.
         *
         * @param mapId - The ID of the map containing the layer settings
         * @returns A promise that resolves when the option is rendered
         * @throws {Error} When the root element is not found
         */
        waitForSwiperBarOption(mapId: string): Promise<void>;
    };
}
//# sourceMappingURL=dom-helper.d.ts.map