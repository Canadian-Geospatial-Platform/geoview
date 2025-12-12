import { delay } from 'geoview-core/index';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { UIEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/ui-event-processor';
import { AppEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/app-event-processor';

/**
 * Main UI testing class.
 * @extends {GVAbstractTester}
 */
export class UITester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   * @returns {string} The name of the Tester.
   */
  override getName(): string {
    return 'UITester';
  }

  /**
   * Test selecting details panel and finding "Top" anchor tag in the DOM for guide container.
   * @returns {Promise<Test>} A Promise that resolves when the test completes successfully.
   */
  testGuideDetailsPanelTopAnchor(): Promise<Test> {
    const mapId = this.getMapId();

    return this.test(
      'Test Details Panel - Select and Find Top Anchor',
      async (test) => {
        // Step 1: Select the details tab in footer bar
        test.addStep('Selecting details panel...');
        UIEventProcessor.setActiveFooterBarTab(mapId, 'details');

        // Wait a bit for the UI to update
        await delay(500);

        // Get the GeoView HTML element
        test.addStep('Getting GeoView HTML element...');
        const geoviewElement = AppEventProcessor.getGeoviewHTMLElement(mapId);

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
}
