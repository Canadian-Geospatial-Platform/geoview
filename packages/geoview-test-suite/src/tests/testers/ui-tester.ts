import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { CONTAINER_TYPE, MAP_SECTION_SCROLL_GAP_PX, TIMEOUT } from 'geoview-core/core/utils/constant';
import { delay, generateId, whenThisThen } from 'geoview-core/core/utils/utilities';
import { getStoreAppHeight, getStoreAppIsCrosshairsActive } from 'geoview-core/core/stores/states/app-state';
import { getStoreUIActiveAppBarTab, getStoreUIActiveTrapGeoView } from 'geoview-core/core/stores/states/ui-state';
import { TestSkippedError } from '../core/exceptions';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';

/**
 * Main UI testing class.
 */
export class UITester extends GVAbstractTester {
  // #region OVERRIDES

  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'UITester';
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS - UI TESTS

  /**
   * Test selecting details panel and finding "Top" anchor tag in the DOM for guide container.
   *
   * @returns A promise that resolves when the test completes
   */
  testGuideDetailsPanelTopAnchor(): Promise<Test> {
    const mapId = this.getMapId();

    return this.test(
      'Test Details Panel - Select and Find Top Anchor',
      async (test) => {
        // Step 1: Select the details tab in footer bar
        test.addStep('Selecting details panel and wait for the UI to refresh...');
        this.getControllersRegistry().uiController.setActiveAppBarTab('details', true, false);
        await DomHelper.waitForAppbarTabSelected(mapId, 'details');

        // Find the guide-container div
        test.addStep('Finding guide-container div...');
        const guideContainer = DomHelper.getGuideContainer(mapId);

        if (!guideContainer) {
          throw new Error('guide-container div not found');
        }

        // Search for anchor tag with text "Top" within guide-container
        test.addStep('Searching for "Top" anchor tag within guide-container...');
        const anchorElements = guideContainer.querySelectorAll('a');
        let foundTopAnchor: HTMLAnchorElement | null = null;

        for (let i = 0; i < anchorElements.length; i++) {
          const anchor = anchorElements[i];
          if (anchor.textContent?.trim() === 'Top') {
            foundTopAnchor = anchor;
            break;
          }
        }

        return foundTopAnchor;
      },
      (test, result) => {
        // Verify the anchor was found
        test.addStep('Verifying "Top" anchor tag was not found...');
        Test.assertIsEqual(result, null);
      }
    );
  }

  /**
   * Test that a non-React consumer can read the footer height through the UI controller.
   *
   * Proves the combined store + DOM getter (`getFooterHeight`) is reachable via the controller registry from
   * non-React code and returns a CSS length string.
   *
   * @returns A promise that resolves when the test completes
   */
  testControllerGetFooterHeight(): Promise<Test<string>> {
    return this.test(
      'Test UIController.getFooterHeight (non-React consumer)',
      (test) => {
        // Call the controller getter through the registry — the non-React access path
        test.addStep('Calling getFooterHeight via the controller registry (non-React path)...');
        return DomHelper.getDataFooterHeight(this.getMapId(), getStoreAppHeight(this.getMapId()));
      },
      (test, result) => {
        test.addStep('Verifying a CSS length string was returned...');
        Test.assertIsDefined('footerHeight', result);
        // Fallback path yields `${appHeight}px`; a consumer attribute could yield a % value
        Test.assertIsEqual(/(px|%)$/.test(result), true);
      }
    );
  }

  /**
   * Verifies AppBar focus restoration preserves a newer focus target and still returns focus after an ordinary close.
   *
   * @returns A promise that resolves when the test completes
   */
  testAppBarFocusRestoreYieldsToNewerFocus(): Promise<Test<TypeAppBarFocusRestoreResult>> {
    const mapId = this.getMapId();
    const { uiController } = this.getControllersRegistry();
    const originalKeyboardMode = getStoreUIActiveTrapGeoView(mapId);
    const originalCrosshairActive = getStoreAppIsCrosshairsActive(mapId);
    const originalAppBarTab = getStoreUIActiveAppBarTab(mapId);
    const originalFocus = DomHelper.getActiveElement();

    return this.test(
      'Test AppBar focus restoration preserves newer focus',
      async (test): Promise<TypeAppBarFocusRestoreResult> => {
        const testPanel = DomHelper.getGVRootElement(mapId).closest('.tab-content');
        if (testPanel && (testPanel.getClientRects().length === 0 || window.getComputedStyle(testPanel).visibility !== 'visible')) {
          throw new TestSkippedError('The UI test map is hidden; run the UI Tests tab directly');
        }

        const detailsButton = DomHelper.getAppBarButton(mapId, 'details');
        const getSettingsButton = (): HTMLButtonElement | undefined =>
          DomHelper.getGVElementById<HTMLButtonElement>(mapId, `${CONTAINER_TYPE.APP_BAR}-settings-btn`);
        const settingsButton = getSettingsButton();
        if (!detailsButton || !settingsButton) throw new Error(`AppBar focus test controls were not found for map '${mapId}'`);

        test.addStep('Enabling keyboard navigation and opening the Details panel...');
        uiController.setActiveTrapGeoView(true);
        uiController.setActiveAppBarTab('details', true, true, true);
        await DomHelper.waitForAppbarTabSelected(mapId, 'details');

        const detailsCloseButton = await whenThisThen(
          (): HTMLButtonElement | undefined => DomHelper.getAppBarPanelCloseButton(mapId, 'details'),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!detailsCloseButton) throw new Error('Details panel close button was not rendered');

        test.addStep('Closing Details and opening Settings before restoration completes...');
        detailsCloseButton.click();
        settingsButton.focus();
        settingsButton.click();
        await DomHelper.waitForAppbarTabNotSelected(mapId, 'details');
        await whenThisThen(
          (): boolean => getSettingsButton()?.getAttribute('aria-expanded') === 'true',
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        const crosshairBeforeNewOwnerRestore = getStoreAppIsCrosshairsActive(mapId);
        await delay(TIMEOUT.dataPanelLoading + GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        const focusAfterNewOwner = DomHelper.getActiveElement();
        const crosshairAfterNewOwnerRestore = getStoreAppIsCrosshairsActive(mapId);

        test.addStep('Closing Settings, then closing Details without moving focus to verify normal restoration...');
        const currentSettingsButton = getSettingsButton();
        if (!currentSettingsButton) throw new Error(`Settings button was not found for map '${mapId}'`);
        currentSettingsButton.click();
        await whenThisThen(
          (): boolean => getSettingsButton()?.getAttribute('aria-expanded') === 'false',
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        uiController.setActiveAppBarTab('details', true, true, false);
        await DomHelper.waitForAppbarTabSelected(mapId, 'details');
        const secondCloseButton = await whenThisThen(
          (): HTMLButtonElement | undefined => DomHelper.getAppBarPanelCloseButton(mapId, 'details'),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!secondCloseButton) throw new Error('Details panel close button was not rendered');
        secondCloseButton.focus();
        secondCloseButton.click();
        await DomHelper.waitForAppbarTabNotSelected(mapId, 'details');
        await whenThisThen(
          (): boolean => DomHelper.getActiveElement() === detailsButton,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        await delay(TIMEOUT.dataPanelLoading + GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        const focusAfterOrdinaryClose = DomHelper.getActiveElement();

        return {
          expectedNewFocusId: settingsButton.id,
          actualNewFocusId: focusAfterNewOwner?.id ?? '',
          crosshairBeforeNewOwnerRestore,
          crosshairAfterNewOwnerRestore,
          expectedReturnFocusId: detailsButton.id,
          actualReturnFocusId: focusAfterOrdinaryClose?.id ?? '',
        };
      },
      (test, result): void => {
        test.addStep('Verifying newer focus is preserved and ordinary focus restoration still works...');
        Test.assertIsEqual(result.actualNewFocusId, result.expectedNewFocusId);
        Test.assertIsEqual(result.crosshairAfterNewOwnerRestore, result.crosshairBeforeNewOwnerRestore);
        Test.assertIsEqual(result.actualReturnFocusId, result.expectedReturnFocusId);
      },
      async (): Promise<void> => {
        uiController.setActiveAppBarTab(
          originalAppBarTab.tabId || undefined,
          originalAppBarTab.isOpen,
          originalAppBarTab.isFocusTrapped ?? false,
          originalAppBarTab.returnFocusToMap ?? false
        );
        await delay(GVAbstractTester.UI_SCROLL_SETTLE_MS);
        uiController.setActiveTrapGeoView(originalKeyboardMode);
        uiController.setCrosshairActive(originalCrosshairActive);
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus();
      }
    );
  }

  /**
   * Verifies Skip returns focus to this map's WCAG links in both directions.
   *
   * @returns A promise that resolves when the test completes
   */
  testSkipFocusReturnsToMapLinks(): Promise<Test<TypeSkipFocusResult>> {
    const mapId = this.getMapId();
    const { uiController } = this.getControllersRegistry();
    const originalKeyboardMode = getStoreUIActiveTrapGeoView(mapId);
    const originalCrosshairActive = getStoreAppIsCrosshairsActive(mapId);
    const originalFocus = DomHelper.getActiveElement();

    return this.test(
      'Test WCAG Skip returns focus to the same map',
      async (test): Promise<TypeSkipFocusResult> => {
        test.addStep('Preparing the map entry prompt and its map-scoped skip links...');
        if (originalKeyboardMode) uiController.setActiveTrapGeoView(false);

        const topLink = DomHelper.getWCAGTopLink(mapId);
        const bottomLink = DomHelper.getWCAGBottomLink(mapId);
        if (!topLink || !bottomLink) throw new Error(`WCAG skip-link elements were not found for map '${mapId}'`);

        test.addStep('Opening the entry prompt through the map skip-link keyboard sequence...');
        topLink.focus();
        topLink.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true }));

        await whenThisThen(
          (): boolean => DomHelper.getGVElementById(mapId, 'skip-focus') !== undefined,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );

        test.addStep('Activating Skip and waiting for the prompt to close...');
        const skipButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'skip-focus');
        if (!skipButton) throw new Error(`WCAG Skip button was not found for map '${mapId}'`);
        skipButton.focus();
        skipButton.click();
        await whenThisThen(
          (): boolean => DomHelper.getGVElementById(mapId, 'skip-focus') === undefined,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        await whenThisThen(
          (): boolean => DomHelper.getActiveElement() === bottomLink,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        const bottomFocusedElement = DomHelper.getActiveElement();
        const isBottomLinkFocused = bottomFocusedElement === bottomLink;
        const actualBottomFocusId = bottomFocusedElement?.id ?? '';

        test.addStep("Opening the entry prompt in reverse from this map's bottom link...");
        bottomLink.focus();
        bottomLink.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
        );
        await whenThisThen(
          (): boolean => DomHelper.getGVElementById(mapId, 'skip-focus') !== undefined,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );

        test.addStep('Activating Skip and verifying the reverse destination...');
        const reverseSkipButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'skip-focus');
        if (!reverseSkipButton) throw new Error(`WCAG Skip button was not found for map '${mapId}'`);
        reverseSkipButton.focus();
        reverseSkipButton.click();
        await whenThisThen(
          (): boolean => DomHelper.getGVElementById(mapId, 'skip-focus') === undefined,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        await whenThisThen(
          (): boolean => DomHelper.getActiveElement() === topLink,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        const topFocusedElement = DomHelper.getActiveElement();

        return {
          expectedBottomFocusId: bottomLink.id,
          actualBottomFocusId,
          isBottomLinkFocused,
          expectedTopFocusId: topLink.id,
          actualTopFocusId: topFocusedElement?.id ?? '',
          isTopLinkFocused: topFocusedElement === topLink,
        };
      },
      (test, result): void => {
        test.addStep('Verifying both Skip directions focus links in this map...');
        Test.assertIsEqual(result.isBottomLinkFocused, true);
        Test.assertIsEqual(result.actualBottomFocusId, result.expectedBottomFocusId);
        Test.assertIsEqual(result.isTopLinkFocused, true);
        Test.assertIsEqual(result.actualTopFocusId, result.expectedTopFocusId);
      },
      async (): Promise<void> => {
        const skipButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'skip-focus');
        if (skipButton) {
          skipButton.click();
          await whenThisThen(
            (): boolean => DomHelper.getGVElementById(mapId, 'skip-focus') === undefined,
            GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
            GVAbstractTester.UI_POLL_INTERVAL_MS
          );
        }

        uiController.setActiveTrapGeoView(originalKeyboardMode);
        uiController.setCrosshairActive(originalCrosshairActive);
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus();
      }
    );
  }

  /**
   * Exercises delegated scrolling through real controls in an isolated, scrollable viewer.
   *
   * @param scenario - The viewport regression to exercise
   * @returns The test with preconditions and final browser geometry
   */
  testMapSectionScroll(scenario: TypeScrollScenario): Promise<Test<TypeScrollResult>> {
    // Unique ID so the fixture never collides with the suite map or another scroll test
    const mapId = `scroll-${generateId(8)}`;

    // Captured up front so cleanup can leave the page where the next test expects it
    const originalScroll = { x: window.scrollX, y: window.scrollY };

    // Built now but only mounted when the test runs, and always removed in cleanup
    const fixture = UITester.#createScrollFixture(mapId);

    return this.test(
      `Test map-section scroll - ${scenario}`,
      async (test): Promise<TypeScrollResult> => {
        // Mount the host in the page, then render the viewer into it
        test.addStep('Creating an isolated viewer with app-bar, map-info and footer controls...');
        document.body.appendChild(fixture);
        await this.#createScrollViewer(mapId, scenario);

        // Locate the rendered controls and let the initial layout settle before touching anything
        const context = await UITester.#createScrollContext(test, mapId);

        // Drive the scenario; it records preconditions and measurements on the context
        await UITester.#runScrollScenario(context, scenario);

        // Return evidence only; every assertion lives in the verification callback
        return { preconditions: context.preconditions, measurements: context.measurements, viewportHeight: window.innerHeight };
      },
      (test, result): void => UITester.#verifyScroll(test, scenario, result),
      (): Promise<void> => this.#cleanupScrollFixture(mapId, fixture, originalScroll)
    );
  }

  // #endregion PUBLIC METHODS - UI TESTS

  // #region PRIVATE METHODS - MAP SECTION SCROLL

  /**
   * Renders the isolated viewer with app-bar, map-info and footer controls.
   *
   * @param mapId - The isolated viewer ID
   * @param scenario - The viewport regression, which selects the viewer height
   * @returns A promise that resolves once the viewer is created
   */
  async #createScrollViewer(mapId: string, scenario: TypeScrollScenario): Promise<void> {
    // The oversized scenario needs a map taller than the viewport; the others must fit inside it
    const height = Math.round(window.innerHeight * (scenario === 'oversized' ? 1.5 : 0.7));

    // Layer-free map with one app-bar tab and two footer tabs: just enough controls to drive the delegated scrolling
    await this.getApi().createMapFromConfigFast(
      mapId,
      JSON.stringify({
        map: {
          interaction: 'dynamic',
          viewSettings: { projection: 3978, initialView: { zoomAndCenter: [4, [-90, 60]] } },
          basemapOptions: { basemapId: 'nogeom', shaded: false, labeled: false },
          listOfGeoviewLayerConfig: [],
        },
        appBar: { tabs: { core: ['legend'] } },
        footerBar: { tabs: { core: ['layers', 'details'] } },
        navBar: ['fullscreen'],
        corePackages: [],
      }),
      height
    );
  }

  /**
   * Deletes the isolated viewer, removes its host and restores the page scroll position.
   *
   * @param mapId - The isolated viewer ID
   * @param fixture - The host element mounted in the page
   * @param originalScroll - The page scroll position captured before the test
   * @returns A promise that resolves once the page is back to its original state
   */
  async #cleanupScrollFixture(mapId: string, fixture: HTMLElement, originalScroll: { x: number; y: number }): Promise<void> {
    try {
      // The viewer may not exist when setup failed early, so check before deleting
      if (this.getApi().hasMapViewer(mapId)) await this.getApi().deleteMapViewer(mapId, true);
    } finally {
      // Runs even if deleting the viewer throws, so a failure never leaves the page scrolled or the host mounted
      fixture.remove();
      window.scrollTo({ left: originalScroll.x, top: originalScroll.y, behavior: 'instant' });
    }
  }

  // #endregion PRIVATE METHODS - MAP SECTION SCROLL

  // #region STATIC PRIVATE METHODS - MAP SECTION SCROLL

  /**
   * Creates the host element that makes the page scrollable around the isolated viewer.
   *
   * @param mapId - The ID given to the viewer's target element
   * @returns The host element, not yet attached to the page
   */
  static #createScrollFixture(mapId: string): HTMLElement {
    const fixture = document.createElement('div');
    const target = document.createElement('div');
    target.id = mapId;

    // One viewport of padding above and two below lets the section be scrolled to any position, including clipped at either edge
    fixture.style.cssText = `padding-top: ${window.innerHeight}px; padding-bottom: ${window.innerHeight * 2}px; width: min(900px, 100%);`;
    fixture.appendChild(target);
    return fixture;
  }

  /**
   * Resolves the rendered controls once the viewer shell is ready.
   *
   * @param test - The running test, used to record steps
   * @param mapId - The isolated viewer ID
   * @returns A promise that resolves with the controls and empty evidence collections
   */
  static async #createScrollContext(test: Test, mapId: string): Promise<TypeScrollContext> {
    // The app-bar button only exists once the shell has rendered, so it doubles as the readiness signal
    const button = await DomHelper.waitForLegendPanelButton(mapId, CONTAINER_TYPE.APP_BAR, GVAbstractTester.UI_SCROLL_TIMEOUT_MS);

    // Fail fast with a clear message if any control is missing, rather than a null error mid-scenario
    const section = UITester.#requireElement(mapId, 'map');
    const info = UITester.#requireElement(mapId, 'mapInfo');
    const footer = UITester.#requireElement(mapId, 'tabsContainer');

    // Measurements taken before the initial layout settles would be unstable
    await UITester.#waitForScrollLayout(section);

    // Baseline preconditions: the map-info bar belongs to the section and the section is actually rendered
    const preconditions: boolean[] = [section.contains(info), section.getBoundingClientRect().height > 0];
    return { test, mapId, section, info, button, footer, preconditions, measurements: [] };
  }

  /**
   * Runs the scroll sequence matching the scenario.
   *
   * @param context - The rendered controls and evidence collections
   * @param scenario - The viewport regression to exercise
   * @returns A promise that resolves once the sequence has finished
   */
  static async #runScrollScenario(context: TypeScrollContext, scenario: TypeScrollScenario): Promise<void> {
    switch (scenario) {
      case 'partial':
        await UITester.#runPartialScroll(context);
        break;
      case 'transitions':
        await UITester.#runTransitionsScroll(context);
        break;
      case 'visible':
        await UITester.#runVisibleScroll(context);
        break;
      default:
        // 'oversized'
        await UITester.#runOversizedScroll(context);
    }
  }

  /**
   * Runs the partial scenario: a section shorter than the viewport with its map-info bar clipped below the fold.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the sequence has finished
   */
  static async #runPartialScroll(context: TypeScrollContext): Promise<void> {
    const { test, section, info, button, preconditions } = context;
    const { height } = section.getBoundingClientRect();

    // Push the section down so its top is on screen while the map-info bar at its bottom falls below the viewport
    await UITester.#positionSection(context, window.innerHeight - height + 40);
    const buttonRect = button.getBoundingClientRect();
    preconditions.push(
      // The section must fit the viewport, otherwise this would be the oversized case
      height < window.innerHeight,
      // The app-bar button must be on screen so the click is a plausible user action
      buttonRect.top >= 0 && buttonRect.bottom <= window.innerHeight,
      // The map-info bar must be clipped, which is the condition the delegated scroll has to repair
      info.getBoundingClientRect().bottom > window.innerHeight
    );

    test.addStep('Activating a visible app-bar button with map-info clipped below the viewport...');

    // First click opens the panel and second closes it; the page must not move between the two activations
    await UITester.#activateAppBar(context);
    await UITester.#activateAppBar(context);

    // Clip the top of the section instead and activate again to cover the opposite edge
    await UITester.#positionSection(context, -40);
    await UITester.#activateAppBar(context);
  }

  /**
   * Runs the transitions scenario: footer tab, app bar from the footer view, then the map-info bar.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the sequence has finished
   */
  static async #runTransitionsScroll(context: TypeScrollContext): Promise<void> {
    const { test, section, footer, preconditions } = context;

    // Footer first: its tab scrolls the footer into view and leaves the map section clipped above
    await UITester.#activateFooterTab(context);

    // Activate the app bar from that clipped position, which the delegated scroll must repair
    await UITester.#activateAppBarFromClosed(context);

    test.addStep('Returning from the footer-view position through the app bar...');

    // Scroll until the section's bottom edge reaches the viewport top, i.e. the footer-view position
    await UITester.#positionSection(context, -section.getBoundingClientRect().height);

    // The footer must still be on screen, otherwise this is not the footer-view position
    preconditions.push(footer.getBoundingClientRect().top >= -GVAbstractTester.UI_SCROLL_TOLERANCE_PX);
    await UITester.#activateAppBarFromClosed(context);

    // Last transition: the map-info bar while the map is clipped at the top
    await UITester.#activateMapInfo(context);
  }

  /**
   * Runs the visible scenario: a section already fully on screen must not be moved.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the sequence has finished
   */
  static async #runVisibleScroll(context: TypeScrollContext): Promise<void> {
    const { section, info, preconditions, measurements } = context;

    // Place the whole section comfortably inside the viewport
    await UITester.#positionSection(context, 60);

    // Baseline taken before any activation so the later measurements can be compared with an untouched page
    measurements.push(UITester.#measureScroll(section, info));

    // Both edges of the section must be on screen, otherwise nothing proves the "no unnecessary scroll" behavior
    preconditions.push(measurements[0].top >= 0, measurements[0].bottom <= window.innerHeight);

    // Open then close the panel; the page must stay where it is
    await UITester.#activateAppBar(context);
    await UITester.#activateAppBar(context);
  }

  /**
   * Runs the oversized scenario: a section taller than the viewport is aligned to its top edge.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the sequence has finished
   */
  static async #runOversizedScroll(context: TypeScrollContext): Promise<void> {
    const { section, preconditions } = context;

    // Start slightly below the top so the delegated scroll has something to correct
    await UITester.#positionSection(context, 40);

    // The section must really be taller than the viewport, otherwise it could not exercise the oversized path
    preconditions.push(section.getBoundingClientRect().height > window.innerHeight);

    // Open then close the panel; the top alignment must be stable across both activations
    await UITester.#activateAppBar(context);
    await UITester.#activateAppBar(context);
  }

  /**
   * Activates the layers footer tab while the footer sits inside the scroll helper's top clearance.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the footer has settled
   */
  static async #activateFooterTab(context: TypeScrollContext): Promise<void> {
    const { test, mapId, section, footer, preconditions } = context;
    const helperOffset = GVAbstractTester.UI_SCROLL_HELPER_OFFSET_PX;

    // Keep the footer control visible but inside the helper's top clearance
    await UITester.#positionSection(context, helperOffset / 2 - section.getBoundingClientRect().height);
    test.addStep('Activating a footer tab through its delegated click path...');
    const initialFooterRect = footer.getBoundingClientRect();

    // The footer must start inside the clearance zone, otherwise the activation would have nothing to scroll
    preconditions.push(initialFooterRect.top >= 0 && initialFooterRect.top < helperOffset);

    // Click the real tab so the delegated click handler, not a direct scroll call, performs the scroll
    UITester.#requireElement(mapId, 'tab-layers').click();
    await UITester.#waitForScrollLayout(footer);

    // Log the final footer bounds so a failed alignment check can be diagnosed from the report
    const footerRect = footer.getBoundingClientRect();
    test.addStep(`Footer bounds after activation: top=${footerRect.top}, bottom=${footerRect.bottom}, viewport=${window.innerHeight}`);

    // The helper must leave the footer's bottom edge at the viewport bottom minus its clearance
    preconditions.push(Math.abs(footerRect.bottom - (window.innerHeight - helperOffset)) <= GVAbstractTester.UI_SCROLL_TOLERANCE_PX);
  }

  /**
   * Activates the map-info bar while the map is clipped at the top.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the geometry has been recorded
   */
  static async #activateMapInfo(context: TypeScrollContext): Promise<void> {
    const { test, section, info, preconditions, measurements } = context;

    test.addStep('Activating the map-info bar while the map is clipped at the top...');

    // Clip the top of the section; the bar itself stays on screen below it
    await UITester.#positionSection(context, -40);

    // The bar must be fully visible, otherwise the click would not be the on-screen user action under test
    const infoRect = info.getBoundingClientRect();
    preconditions.push(infoRect.top >= 0 && infoRect.bottom <= window.innerHeight);

    // Map-info buttons (expand, attribution, position, scale) stop propagation by design; click the bar itself
    info.click();
    await UITester.#waitForScrollLayout(section);
    measurements.push(UITester.#measureScroll(section, info));
  }

  /**
   * Positions the section without smooth scrolling, then waits for browser layout.
   *
   * @param context - The rendered controls and evidence collections
   * @param top - Desired viewport top of the section
   * @returns A promise that resolves once the section layout has settled
   */
  static async #positionSection(context: TypeScrollContext, top: number): Promise<void> {
    const { section } = context;

    // Instant rather than smooth, so the next measurement is never taken mid-animation
    window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - top, behavior: 'instant' });
    await UITester.#waitForScrollLayout(section);
  }

  /**
   * Activates the delegated app-bar callback and records the settled map geometry.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the geometry has been recorded
   */
  static async #activateAppBar(context: TypeScrollContext): Promise<void> {
    const { section, info, button, measurements } = context;

    // A real click exercises the delegated handler exactly as a user would
    button.click();

    // Measure only after scrolling and layout have settled, or the reading would be transient
    await UITester.#waitForScrollLayout(section);
    measurements.push(UITester.#measureScroll(section, info));
  }

  /**
   * Opens the app-bar panel from a clipped section, then closes it while the section is visible.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the panel is closed and the section has settled
   */
  static async #activateAppBarFromClosed(context: TypeScrollContext): Promise<void> {
    const { section, button } = context;

    // Open the panel and record the geometry the delegated scroll produced
    await UITester.#activateAppBar(context);

    // Close it again while the section is visible: closing restores focus to the toggle, and doing it
    // off-screen would let the browser's focus scroll re-center the button and override the scroll under test
    button.click();
    await UITester.#waitForScrollLayout(section);
  }

  /**
   * Asserts the scenario preconditions, every recorded measurement and repeated-activation stability.
   *
   * @param test - The running test, used to record steps
   * @param scenario - The viewport regression that was exercised
   * @param result - The evidence returned by the scenario
   */
  static #verifyScroll(test: Test, scenario: TypeScrollScenario, result: TypeScrollResult): void {
    test.addStep('Verifying setup preconditions, final bounds and repeated-activation stability...');

    // A failed precondition means the fixture was not in the intended state, so fail before judging the geometry
    result.preconditions.forEach((condition, index): void => {
      if (!condition) Test.assertFail(`Scroll scenario "${scenario}" setup/transition check ${index + 1} failed.`);
    });

    // Every recorded measurement must satisfy the scenario's geometry rules
    result.measurements.forEach((measurement, index): void => {
      test.addStep(`Activation ${index + 1}: ${JSON.stringify(measurement)}, viewport=${result.viewportHeight}`);
      UITester.#assertScrollMeasurement(scenario, measurement, result.viewportHeight);
    });

    // The second activation must not move the page; the transitions scenario scrolls between activations on purpose
    if (scenario !== 'transitions') {
      Test.assertIsEqualWithinTolerance(
        result.measurements[1].scrollY,
        result.measurements[0].scrollY,
        GVAbstractTester.UI_SCROLL_TOLERANCE_PX
      );
    }
  }

  /**
   * Asserts one measurement against the geometry expected for the scenario.
   *
   * @param scenario - The viewport regression that was exercised
   * @param measurement - The geometry captured after an activation
   * @param viewportHeight - The viewport height when the test ran
   */
  static #assertScrollMeasurement(scenario: TypeScrollScenario, measurement: TypeScrollMeasurement, viewportHeight: number): void {
    const tolerance = GVAbstractTester.UI_SCROLL_TOLERANCE_PX;
    const gap = MAP_SECTION_SCROLL_GAP_PX;

    // A section taller than the viewport cannot fit, so it is aligned with its top at the standard gap and nothing else applies
    if (scenario === 'oversized') {
      Test.assertIsEqualWithinTolerance(measurement.top, gap, tolerance);
      return;
    }

    // A section that was already visible keeps its position, so only the clipped scenarios assert an exact top offset
    if (scenario !== 'visible') {
      // The top lands at the standard gap, or at the remaining space when gap plus section height would overflow the viewport
      const expectedOffset = Math.min(gap, viewportHeight - (measurement.bottom - measurement.top));
      Test.assertIsEqualWithinTolerance(measurement.top, expectedOffset, tolerance);
    }

    // The whole section must end up inside the viewport...
    Test.assertIsEqual(measurement.top >= -tolerance, true);
    Test.assertIsEqual(measurement.bottom <= viewportHeight + tolerance, true);

    // ...and so must the map-info bar, which is the control that used to be clipped
    Test.assertIsEqual(measurement.infoTop >= -tolerance, true);
    Test.assertIsEqual(measurement.infoBottom <= viewportHeight + tolerance, true);
  }

  /**
   * Gets a required fixture element or fails explicitly when setup is incomplete.
   *
   * @param mapId - The isolated viewer ID
   * @param suffix - The element ID suffix
   * @returns The rendered element
   */
  static #requireElement(mapId: string, suffix: string): HTMLElement {
    const element = DomHelper.getGVElementById(mapId, suffix);
    if (!element) throw new Error(`Scroll fixture element not found: ${mapId}-${suffix}`);
    return element;
  }

  /**
   * Waits for page scrolling and the measured element's layout to remain stable, with a bounded timeout.
   *
   * @param element - The element whose geometry must settle
   * @returns A promise resolving after scrolling and layout settle
   */
  static async #waitForScrollLayout(element: HTMLElement): Promise<void> {
    let previous = '';
    let stableSince = performance.now();
    await whenThisThen(
      (): boolean => {
        const rect = element.getBoundingClientRect();
        const current = `${window.scrollY},${rect.top},${rect.height}`;
        if (current !== previous) {
          previous = current;
          stableSince = performance.now();
        }
        return performance.now() - stableSince >= GVAbstractTester.UI_SCROLL_SETTLE_MS;
      },
      GVAbstractTester.UI_SCROLL_TIMEOUT_MS,
      50
    );
  }

  /**
   * Captures the map section and map-info viewport bounds after an activation.
   *
   * @param section - The complete map section
   * @param info - The map-info bar contained in the section
   * @returns Geometry and page scroll measurements
   */
  static #measureScroll(section: HTMLElement, info: HTMLElement): TypeScrollMeasurement {
    const rect = section.getBoundingClientRect();
    const infoRect = info.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, infoTop: infoRect.top, infoBottom: infoRect.bottom, scrollY: window.scrollY };
  }

  // #endregion STATIC PRIVATE METHODS - MAP SECTION SCROLL
}

// #region TYPES AND INTERFACES

/** Isolated viewer scrolling regressions, scheduled sequentially by the UI suite. */
type TypeScrollScenario = 'partial' | 'transitions' | 'visible' | 'oversized';

/** Browser geometry captured after a real control activation. */
type TypeScrollMeasurement = { top: number; bottom: number; infoTop: number; infoBottom: number; scrollY: number };

/** Setup preconditions and geometry returned for assertion-only verification. */
type TypeScrollResult = { preconditions: boolean[]; measurements: TypeScrollMeasurement[]; viewportHeight: number };

/** Expected and actual focus targets after activating Skip in both navigation directions. */
type TypeSkipFocusResult = {
  /** DOM id of the expected destination for forward Skip. */
  expectedBottomFocusId: string;
  /** DOM id focused after forward Skip. */
  actualBottomFocusId: string;
  /** Whether forward Skip focused this map's bottom link. */
  isBottomLinkFocused: boolean;
  /** DOM id of the expected destination for reverse Skip. */
  expectedTopFocusId: string;
  /** DOM id focused after reverse Skip. */
  actualTopFocusId: string;
  /** Whether reverse Skip focused this map's top link. */
  isTopLinkFocused: boolean;
};

/** Expected and actual focus targets for AppBar focus restoration. */
type TypeAppBarFocusRestoreResult = {
  /** DOM id expected to retain focus after another control takes focus. */
  expectedNewFocusId: string;
  /** DOM id focused after delayed restoration completes. */
  actualNewFocusId: string;
  /** Crosshair state before the delayed restoration after Settings takes focus ownership. */
  crosshairBeforeNewOwnerRestore: boolean;
  /** Crosshair state after the delayed restoration after Settings takes focus ownership. */
  crosshairAfterNewOwnerRestore: boolean;
  /** DOM id of the closed panel button used for normal focus return. */
  expectedReturnFocusId: string;
  /** DOM id focused after closing the panel without changing focus. */
  actualReturnFocusId: string;
};

/** Rendered fixture controls plus the evidence a scroll scenario accumulates while it runs. */
type TypeScrollContext = {
  test: Test;
  mapId: string;
  section: HTMLElement;
  info: HTMLElement;
  button: HTMLElement;
  footer: HTMLElement;
  preconditions: boolean[];
  measurements: TypeScrollMeasurement[];
};

// #endregion TYPES AND INTERFACES
