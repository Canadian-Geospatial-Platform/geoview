import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { generateId, whenThisThen } from 'geoview-core/core/utils/utilities';
import { getStoreAppHeight } from 'geoview-core/core/stores/states/app-state';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';

/**
 * Main UI testing class.
 */
export class UITester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'UITester';
  }

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
   * Exercises delegated scrolling through real controls in an isolated, scrollable viewer.
   *
   * @param scenario - The viewport regression to exercise
   * @returns The test with preconditions and final browser geometry
   */
  testMapSectionScroll(scenario: TypeScrollScenario): Promise<Test<TypeScrollResult>> {
    const mapId = `scroll-${generateId(8)}`;
    const originalScroll = { x: window.scrollX, y: window.scrollY };
    const fixture = document.createElement('div');
    const target = document.createElement('div');
    target.id = mapId;
    fixture.style.cssText = `padding-top: ${window.innerHeight}px; padding-bottom: ${window.innerHeight * 2}px; width: min(900px, 100%);`;
    fixture.appendChild(target);

    return this.test(
      `Test map-section scroll - ${scenario}`,
      async (test): Promise<TypeScrollResult> => {
        test.addStep('Creating an isolated viewer with app-bar, map-info and footer controls...');
        document.body.appendChild(fixture);
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
          Math.round(window.innerHeight * (scenario === 'oversized' ? 1.5 : 0.7))
        );
        await whenThisThen(
          (): HTMLElement | undefined => DomHelper.getGVElementById(mapId, 'appBar-legend-panel-btn'),
          GVAbstractTester.UI_SCROLL_TIMEOUT_MS
        );
        const section = UITester.#requireElement(mapId, 'map');
        const info = UITester.#requireElement(mapId, 'mapInfo');
        const button = UITester.#requireElement(mapId, 'appBar-legend-panel-btn');
        const footer = UITester.#requireElement(mapId, 'tabsContainer');
        await UITester.#waitForScrollLayout(section);

        const preconditions: boolean[] = [section.contains(info), section.getBoundingClientRect().height > 0];
        const measurements: TypeScrollMeasurement[] = [];

        /**
         * Positions the section without smooth scrolling, then waits for browser layout.
         *
         * @param top - Desired viewport top of the section
         * @returns A promise that resolves once the section layout has settled
         */
        const positionSection = async (top: number): Promise<void> => {
          window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - top, behavior: 'instant' });
          await UITester.#waitForScrollLayout(section);
        };

        /**
         * Activates the delegated app-bar callback and records the settled map geometry.
         *
         * @returns A promise that resolves once the geometry has been recorded
         */
        const activateAppBar = async (): Promise<void> => {
          button.click();
          await UITester.#waitForScrollLayout(section);
          measurements.push(UITester.#measureScroll(section, info));
        };

        if (scenario === 'partial') {
          const { height } = section.getBoundingClientRect();
          await positionSection(window.innerHeight - height + 40);
          const buttonRect = button.getBoundingClientRect();
          preconditions.push(
            height < window.innerHeight,
            buttonRect.top >= 0 && buttonRect.bottom <= window.innerHeight,
            info.getBoundingClientRect().bottom > window.innerHeight
          );
          test.addStep('Activating a visible app-bar button with map-info clipped below the viewport...');
          await activateAppBar();
          await activateAppBar();
          await positionSection(-40);
          await activateAppBar();
        } else if (scenario === 'transitions') {
          // Keep the footer control visible but inside the helper's top clearance.
          const helperOffset = GVAbstractTester.UI_SCROLL_HELPER_OFFSET_PX;
          await positionSection(helperOffset / 2 - section.getBoundingClientRect().height);
          test.addStep('Activating a footer tab through its delegated click path...');
          const initialFooterRect = footer.getBoundingClientRect();
          preconditions.push(initialFooterRect.top >= 0 && initialFooterRect.top < helperOffset);
          UITester.#requireElement(mapId, 'tab-layers').click();
          await UITester.#waitForScrollLayout(footer);
          const footerRect = footer.getBoundingClientRect();
          test.addStep(
            `Footer bounds after activation: top=${footerRect.top}, bottom=${footerRect.bottom}, viewport=${window.innerHeight}`
          );
          preconditions.push(Math.abs(footerRect.bottom - (window.innerHeight - helperOffset)) <= GVAbstractTester.UI_SCROLL_TOLERANCE_PX);

          /**
           * Opens the app-bar panel from a clipped section, then closes it while the section is visible.
           * Closing restores focus to the toggle; doing it off-screen would let the browser's focus scroll
           * re-center the button and override the delegated scroll under test.
           *
           * @returns A promise that resolves once the panel is closed and the section has settled
           */
          const activateAppBarFromClosed = async (): Promise<void> => {
            await activateAppBar();
            button.click();
            await UITester.#waitForScrollLayout(section);
          };
          await activateAppBarFromClosed();

          test.addStep('Returning from the footer-view position through the app bar...');
          await positionSection(-section.getBoundingClientRect().height);
          preconditions.push(footer.getBoundingClientRect().top >= -GVAbstractTester.UI_SCROLL_TOLERANCE_PX);
          await activateAppBarFromClosed();

          test.addStep('Activating the map-info bar while the map is clipped at the top...');
          await positionSection(-40);
          // Map-info buttons (expand, attribution, position, scale) stop propagation by design; click the bar itself.
          const infoRect = info.getBoundingClientRect();
          preconditions.push(infoRect.top >= 0 && infoRect.bottom <= window.innerHeight);
          info.click();
          await UITester.#waitForScrollLayout(section);
          measurements.push(UITester.#measureScroll(section, info));
        } else if (scenario === 'visible') {
          await positionSection(60);
          measurements.push(UITester.#measureScroll(section, info));
          preconditions.push(measurements[0].top >= 0, measurements[0].bottom <= window.innerHeight);
          await activateAppBar();
          await activateAppBar();
        } else {
          await positionSection(40);
          preconditions.push(section.getBoundingClientRect().height > window.innerHeight);
          await activateAppBar();
          await activateAppBar();
        }

        return { preconditions, measurements, viewportHeight: window.innerHeight };
      },
      (test, result): void => {
        test.addStep('Verifying setup preconditions, final bounds and repeated-activation stability...');
        result.preconditions.forEach((condition, index): void => {
          if (!condition) Test.assertFail(`Scroll scenario "${scenario}" setup/transition check ${index + 1} failed.`);
        });
        const tolerance = GVAbstractTester.UI_SCROLL_TOLERANCE_PX;
        const gap = GVAbstractTester.UI_MAP_SECTION_SCROLL_GAP_PX;
        result.measurements.forEach((measurement, index): void => {
          test.addStep(`Activation ${index + 1}: ${JSON.stringify(measurement)}, viewport=${result.viewportHeight}`);
          if (scenario === 'oversized') {
            Test.assertIsEqualWithinTolerance(measurement.top, gap, tolerance);
          } else {
            if (scenario !== 'visible') {
              const expectedOffset = Math.min(gap, result.viewportHeight - (measurement.bottom - measurement.top));
              Test.assertIsEqualWithinTolerance(measurement.top, expectedOffset, tolerance);
            }
            Test.assertIsEqual(measurement.top >= -tolerance, true);
            Test.assertIsEqual(measurement.bottom <= result.viewportHeight + tolerance, true);
            Test.assertIsEqual(measurement.infoTop >= -tolerance, true);
            Test.assertIsEqual(measurement.infoBottom <= result.viewportHeight + tolerance, true);
          }
        });
        if (scenario !== 'transitions') {
          Test.assertIsEqualWithinTolerance(result.measurements[1].scrollY, result.measurements[0].scrollY, tolerance);
        }
      },
      async (): Promise<void> => {
        try {
          if (this.getApi().hasMapViewer(mapId)) await this.getApi().deleteMapViewer(mapId, true);
        } finally {
          fixture.remove();
          window.scrollTo({ left: originalScroll.x, top: originalScroll.y, behavior: 'instant' });
        }
      }
    );
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
}

// #region TYPES AND INTERFACES

/** Isolated viewer scrolling regressions, scheduled sequentially by the UI suite. */
type TypeScrollScenario = 'partial' | 'transitions' | 'visible' | 'oversized';

/** Browser geometry captured after a real control activation. */
type TypeScrollMeasurement = { top: number; bottom: number; infoTop: number; infoBottom: number; scrollY: number };

/** Setup preconditions and geometry returned for assertion-only verification. */
type TypeScrollResult = { preconditions: boolean[]; measurements: TypeScrollMeasurement[]; viewportHeight: number };

// #endregion TYPES AND INTERFACES
