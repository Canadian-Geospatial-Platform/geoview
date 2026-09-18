import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { getStoreAppGeoviewHTMLElement } from 'geoview-core/core/stores/states/app-state';

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
        this.getControllersRegistry().uiController.setActiveFooterBarTab('details');
        await this.waitForFooterTabSelected('details');

        // Get the GeoView HTML element
        test.addStep('Getting GeoView HTML element...');
        const geoviewElement = getStoreAppGeoviewHTMLElement(mapId);

        // Find the guide-container div
        test.addStep('Finding guide-container div...');
        const guideContainer = geoviewElement.querySelector('.guide-container');

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
        return this.getControllersRegistry().uiController.getFooterHeight();
      },
      (test, result) => {
        test.addStep('Verifying a CSS length string was returned...');
        Test.assertIsDefined('footerHeight', result);
        // Fallback path yields `${appHeight}px`; a consumer attribute could yield a % value
        Test.assertIsEqual(/(px|%)$/.test(result), true);
      }
    );
  }
}
