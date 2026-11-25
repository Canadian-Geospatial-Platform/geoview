import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { TestSuiteCannotExecuteError } from '../core/exceptions';
import { A11yEntryTester } from '../testers/a11y-entry-tester';
import { A11yUxTester } from '../testers/a11y-ux-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';

/**
 * Tests keyboard accessibility and user interactions across the map and panels.
 */
export class GVTestSuiteA11yUx extends GVAbstractTestSuite {
  /** The accessibility and UX tester for this map. */
  #a11yUxTester: A11yUxTester;

  /** The tester for keyboard entry across the two visible fixtures. */
  #a11yEntryTester: A11yEntryTester;

  /**
   * Constructs the test suite.
   *
   * @param api - The shared API
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The map's controller registry
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);
    this.#a11yUxTester = new A11yUxTester(api, mapViewer, controllerRegistry);
    this.#a11yEntryTester = new A11yEntryTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#a11yUxTester);
    this.addTester(this.#a11yEntryTester);
  }

  // #region OVERRIDES

  /**
   * Returns the name of the test suite.
   *
   * @returns The suite name
   */
  override getName(): string {
    return 'A11Y and UX Test Suite';
  }

  /**
   * Returns the suite description.
   *
   * @returns The description as HTML
   */
  override getDescriptionAsHtml(): string {
    return `Tests keyboard accessibility and cross-panel user interactions:<br/>
      <b>Keyboard query</b> — Ctrl+M focuses the map, activates the crosshair, and closes Details;
      Enter queries again and reopens and focuses Details<br/>
      <b>Focus ownership</b> — Ctrl+M closes app-bar panels and map popovers but preserves footer panels;
      Escape returns from query-opened Details to the map only while focus ownership remains there<br/>
      <b>Modal shortcut</b> — Ctrl+M is ignored while dialogs are open<br/>
      <b>Two-map entry</b> — entry prompt actions, Settings, and shortcut isolation with Group 6 visible in the foreground`;
  }

  /**
   * Gets the number of active tests launched by the full suite.
   *
   * @returns The full-suite test count
   */
  override getTestsTotalFinal(): number {
    return 30;
  }

  /**
   * Checks that Details and the ready companion viewer are available.
   *
   * @returns A promise that resolves when the suite can run
   */
  protected override onCanExecuteTestSuite(): Promise<boolean> {
    if (!this.getMapViewer().hasAppbarTab('details')) {
      throw new TestSuiteCannotExecuteError('The A11Y and UX suite requires Details in the app bar.');
    }
    if (!this.getApi().hasMapViewer(A11yEntryTester.COMPANION_ID) || !this.getApi().getMapViewer(A11yEntryTester.COMPANION_ID).mapReady) {
      throw new TestSuiteCannotExecuteError('The A11Y and UX suite requires the map14 companion viewer to be ready.');
    }
    return Promise.resolve(true);
  }

  /**
   * Runs the keyboard-query regression on this suite's map.
   *
   * @returns A promise that resolves when the test finishes
   */
  protected override async onLaunchTestSuite(): Promise<void> {
    await this.#a11yUxTester.testFullscreenPopoverFocusReturn();
    await this.#a11yUxTester.testSettingsDoesNotScrollPage();
    await this.#a11yUxTester.testSettingsPointerClickAway();
    await this.#a11yUxTester.testLayersSubPanelYieldsToSettings();
    await this.#a11yUxTester.testKeyboardShortcutIgnoredForOverlay('fullscreen');
    await this.#a11yUxTester.testKeyboardShortcutIgnoredForOverlay('legend fullscreen');
    await this.#a11yUxTester.testKeyboardShortcutIgnoredForOverlay('lightbox');
    await this.#a11yUxTester.testKeyboardShortcutIgnoredForOverlay('export');
    await this.#a11yUxTester.testKeyboardShortcutIgnoredForOverlay('basic table');
    await this.#a11yUxTester.testKeyboardShortcutIgnoredForOverlay('feature detail');
    await this.#a11yUxTester.testModalShortcutViewerIsolation();
    await this.#a11yUxTester.testKeyboardQueryMapFocusReturn();
    await this.#a11yUxTester.testKeyboardShortcutClosesPanelsAndPreservesFooter();
    await this.#a11yUxTester.testNavbarPanelFocusOwnership();
    await this.#a11yUxTester.testCrosshairDetailsEscapeReturnsToMap();
    await this.#a11yUxTester.testDetailsEscapeOwnershipCancellation();
    await this.#a11yUxTester.testDetailsEscapeFocusLeaveCancellation();
    await this.#a11yUxTester.testKeyboardShortcutIgnoredForExportModal();
    await this.#a11yUxTester.testKeyboardShortcutIgnoredForShareModal();
    await this.#a11yUxTester.testKeyboardShortcutIgnoredForExportModal(true);
    await this.#a11yUxTester.testDetailsSubPanelReopensAfterDismissal();
    await this.#a11yEntryTester.testSettingsEntryGuard();
    await this.#a11yEntryTester.testForwardEntryEnable();
    await this.#a11yEntryTester.testStaticEntryEnable();
    await this.#a11yEntryTester.testForwardAndReverseEntrySkip();
    await this.#a11yEntryTester.testSkipKeepsFocusUnderStationaryPointer();

    // Tab activation schedules upstream's uncancellable delayed footer scroll; run after scroll-sensitive tests.
    await this.#a11yUxTester.testFooterPanelReopensWithFocus('keyboard');
    await this.#a11yUxTester.testFooterPanelReopensWithFocus('pointer');
    await this.#a11yEntryTester.testTwoMapKeyboardShortcuts();
    await this.#a11yEntryTester.testUnansweredPromptStaysOpenOnMouseMove();
  }

  // #endregion OVERRIDES
}
