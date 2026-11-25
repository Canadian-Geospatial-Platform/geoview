import { getStoreAppIsCrosshairsActive } from 'geoview-core/core/stores/states/app-state';
import { getStoreMapInteraction } from 'geoview-core/core/stores/states/map-state';
import { getStoreUIActiveTrapGeoView } from 'geoview-core/core/stores/states/ui-state';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { whenThisThen } from 'geoview-core/core/utils/utilities';
import { TestError, TestSkippedError } from '../core/exceptions';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';

/** Map-relative IDs that must exist only while the entry prompt is open. */
const PROMPT_IDS = ['wcag-dialog-title', 'wcag-dialog-description', 'enable-focus', 'skip-focus'];
/** Map-relative IDs checked for uniqueness and viewer ownership. */
const VIEWER_IDS = ['wcag-toplink', 'wcag-bottomlink', 'wcag-link-to-map', 'mapTargetElement', 'appBar-settings-btn'];
/** The map-relative ID of the Settings keyboard-navigation switch. */
const SETTINGS_SWITCH = 'appBar-settings-panel-keyboard-navigation';

/** Exercises keyboard entry handlers on the two Group 6 viewers. */
export class A11yEntryTester extends GVAbstractTester {
  /** The companion viewer used by Group 6. */
  static readonly COMPANION_ID = 'map14';

  // #region OVERRIDES

  /**
   * Returns the entry tester name.
   *
   * @returns The tester name shown in Group 6 results
   */
  override getName(): string {
    return 'A11yEntryTester';
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Tests Settings transitions and the first-entry guard on a fresh companion viewer.
   *
   * @returns A promise that resolves with the first-entry guard and Settings switch observations
   */
  testSettingsEntryGuard(): Promise<Test<EntryCheck[]>> {
    return this.#runEntryTest(
      'Test Settings and the first-entry guard on a fresh companion viewer',
      async (entry): Promise<void> => {
        const b = A11yEntryTester.COMPANION_ID;
        const a = this.getMapId();

        // The companion was reloaded for this case, so its first-entry guard has not been consumed yet.
        const trigger = A11yEntryTester.#requireControl(b, 'appBar-settings-btn');
        await entry.activate(trigger, 'Open Settings in the companion viewer');
        const toggle = A11yEntryTester.#requireControl(b, SETTINGS_SWITCH);
        await whenThisThen(() => DomHelper.getActiveElement() === toggle, GVAbstractTester.KEYBOARD_QUERY_TIMEOUT_MS);
        entry.focus(b, SETTINGS_SWITCH);
        entry.ids(b, SETTINGS_SWITCH);
        entry.mode(b, false);
        entry.prompt();

        // Compare Tab handling before and after enabling keyboard navigation.
        entry.check(
          'The off switch Tab was intercepted',
          await entry.pressKey('Tab', 'Check the first-entry guard from the off switch'),
          true
        );
        entry.focus(b, 'wcag-toplink');
        await entry.activate(toggle, 'Enable the companion mode via Settings');
        entry.focus(b, SETTINGS_SWITCH);
        entry.mode(b, true);
        entry.mode(a, false);
        entry.prompt();
        entry.check(
          'Reverse Tab was not intercepted while the mode was on',
          await entry.pressKey('Tab', 'Check the guard while the mode is on', { shiftKey: true }),
          false
        );

        await entry.activate(toggle, 'Turn the companion mode off before showing the prompt');
        entry.focus(b, SETTINGS_SWITCH);
        entry.mode(b, false);
        entry.check(
          'Reverse Tab was intercepted after turning the mode off',
          await entry.pressKey('Tab', 'Check that reverse Tab redirects to the top link', { shiftKey: true }),
          true
        );
        entry.focus(b, 'wcag-toplink');

        // Showing the prompt consumes the guard, even after keyboard navigation is turned off.
        await A11yEntryTester.#openPrompt(entry, b);
        await entry.activate(A11yEntryTester.#requireControl(b, 'enable-focus'), 'Enable from the prompt');
        entry.focus(b, 'wcag-link-to-map');
        await entry.pressKey('q', 'Turn the mode off and close Settings', { ctrlKey: true });
        entry.focus(b, 'wcag-toplink');
        entry.mode(b, false);
        A11yEntryTester.#requireControl(b, 'mapTargetElement').focus({ preventScroll: true });
        entry.check(
          'The first-entry guard did not intercept Tab after showing the prompt',
          await entry.pressKey('Tab', 'Check the guard after the prompt has been shown'),
          false
        );
        entry.focus(b, 'mapTargetElement');
        entry.prompt();

        await A11yEntryTester.#openPrompt(entry, b);
      },
      true
    );
  }

  /**
   * Tests forward entry, enabling keyboard navigation, and the inner map skip link.
   *
   * @returns A promise that resolves with the forward entry, Enable and inner skip link observations
   */
  testForwardEntryEnable(): Promise<Test<EntryCheck[]>> {
    return this.#runEntryTest('Test opening the prompt from the top link, Enable, and focus the map', async (entry): Promise<void> => {
      const a = this.getMapId();

      // Enable navigation in one viewer before following its inner map link.
      entry.prompt();
      await A11yEntryTester.#openPrompt(entry, a);
      await entry.activate(A11yEntryTester.#requireControl(a, 'enable-focus'), 'Enable keyboard navigation');
      entry.focus(a, 'wcag-link-to-map');
      entry.mode(a, true);
      entry.mode(A11yEntryTester.COMPANION_ID, false);
      entry.crosshair(a, false);

      // Focusing the map activates only this viewer's crosshair.
      await entry.activate(A11yEntryTester.#requireControl(a, 'wcag-link-to-map'), 'Activate the inner map skip link');
      entry.focus(a, 'mapTargetElement');
      entry.crosshair(a, true);
      entry.crosshair(A11yEntryTester.COMPANION_ID, false);
      entry.prompt();
    });
  }

  /**
   * Tests that enabling keyboard navigation on a static viewer focuses its shell.
   *
   * @returns A promise that resolves with the static viewer's Enable focus destination and keyboard-mode observations
   */
  testStaticEntryEnable(): Promise<Test<EntryCheck[]>> {
    return this.#runEntryTest(
      'Test Enable focuses the static viewer shell without activating the crosshair',
      async (entry): Promise<void> => {
        const b = A11yEntryTester.COMPANION_ID;

        // A static viewer has no interactive map link or Settings button to receive focus.
        this.getApi().getMapViewer(b).setInteraction('static');
        await DomHelper.waitForReactIdle();
        entry.ids(b, 'wcag-link-to-map', false);
        entry.ids(b, 'appBar-settings-btn', false);
        await A11yEntryTester.#openPrompt(entry, b);
        await entry.activate(A11yEntryTester.#requireControl(b, 'enable-focus'), 'Enable keyboard navigation on the static viewer');
        entry.focus(b, 'shell');
        entry.mode(b, true);
        entry.mode(this.getMapId(), false);
        entry.crosshair(b, false);
        entry.prompt();
      }
    );
  }

  /**
   * Tests that Skip hands focus to the opposite outer link in both entry directions, and that reverse Enable reveals the map skip link.
   *
   * @returns A promise that resolves with the reverse and forward Skip destinations and the reverse Enable destination
   */
  testForwardAndReverseEntrySkip(): Promise<Test<EntryCheck[]>> {
    return this.#runEntryTest(
      'Test Skip returns to the opposite outer link for reverse and forward entry, and reverse Enable reveals the map skip link',
      async (entry): Promise<void> => {
        const b = A11yEntryTester.COMPANION_ID;

        // Exercise both boundary links before checking reverse entry's Enable destination.
        await this.#skipPrompt(entry, b, true);
        await this.#skipPrompt(entry, this.getMapId(), false);

        // Park the bottom link at the top edge so the viewer's top, and its map skip link, are off-screen.
        const mapLink = A11yEntryTester.#requireControl(b, 'wcag-link-to-map');
        A11yEntryTester.#requireControl(b, 'wcag-bottomlink').scrollIntoView({ block: 'start', inline: 'nearest' });
        entry.check(`wcag-link-to-map off-screen before reverse Enable ${b}`, A11yEntryTester.#isWithinViewport(mapLink), false);
        await A11yEntryTester.#openPrompt(entry, b, true);
        await entry.activate(A11yEntryTester.#requireControl(b, 'enable-focus'), `Enable ${b} after reverse entry`);
        entry.focus(b, 'wcag-link-to-map');
        entry.mode(b, true);
        entry.check(`wcag-link-to-map within the viewport after reverse Enable ${b}`, A11yEntryTester.#isWithinViewport(mapLink), true);
        entry.prompt();
      }
    );
  }

  /**
   * Tests that boundary events under a stationary pointer keep Skip's keyboard-placed focus, while genuine movement, or a stationary
   * enter without keyboard-placed focus, focuses the map so ArrowRight pans it.
   *
   * @returns A promise that resolves with the Skip destination, hover focus and pan observations
   */
  testSkipKeepsFocusUnderStationaryPointer(): Promise<Test<EntryCheck[]>> {
    return this.#runEntryTest(
      'Test Skip keeps focus on the bottom outer link under a stationary pointer, and hover focus still lets arrow keys pan the map',
      async (entry): Promise<void> => {
        const a = this.getMapId();
        await this.#skipPrompt(entry, a, false);

        // Emulate the boundary events a browser sends when content unmounts or scrolls under a stationary pointer.
        const target = A11yEntryTester.#requireControl(a, 'mapTargetElement');
        const rect = target.getBoundingClientRect();
        const point = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
        const view = this.getApi().getMapViewer(a).map.getView();
        const originalCenter = view.getCenter();
        try {
          target.dispatchEvent(new MouseEvent('mouseenter', point));
          target.dispatchEvent(new MouseEvent('mousemove', { ...point, bubbles: true }));
          await DomHelper.waitForReactIdle();
          entry.focus(a, 'wcag-bottomlink');

          // Genuine pointer movement (not a layout shift under a still pointer) lets hover focus the map.
          target.dispatchEvent(new MouseEvent('mousemove', { ...point, bubbles: true, movementX: 4 }));
          await DomHelper.waitForReactIdle();
          entry.focus(a, 'mapTargetElement');
          await this.#checkArrowPans(entry, a, 'genuine hover');

          // Leaving blurs the map, which turns keyboard pan/zoom off; the next hover focus must turn them back on.
          target.dispatchEvent(new MouseEvent('mouseleave', point));
          await DomHelper.waitForReactIdle();
          target.dispatchEvent(new MouseEvent('mouseenter', point));
          target.dispatchEvent(new MouseEvent('mousemove', { ...point, bubbles: true, movementX: 4 }));
          await DomHelper.waitForReactIdle();
          entry.focus(a, 'mapTargetElement');
          await this.#checkArrowPans(entry, a, 'a second genuine hover');

          // Without keyboard-placed focus, a stationary-pointer enter (e.g. wheel-scrolling the page) focuses the map at once.
          target.dispatchEvent(new MouseEvent('mouseleave', point));
          await DomHelper.waitForReactIdle();
          target.dispatchEvent(new MouseEvent('mouseenter', point));
          await DomHelper.waitForReactIdle();
          entry.focus(a, 'mapTargetElement');
          await this.#checkArrowPans(entry, a, 'a stationary-pointer enter');
        } finally {
          // Leave the map so the mouse-inside state does not persist into later cases.
          target.dispatchEvent(new MouseEvent('mouseleave', point));
          view.cancelAnimations();
          if (originalCenter) view.setCenter(originalCenter);
        }
      }
    );
  }

  /**
   * Tests keyboard-shortcut and crosshair isolation between viewers and the host page.
   *
   * @returns A promise that resolves with the crosshair and Ctrl+M / Ctrl+Q isolation observations
   */
  testTwoMapKeyboardShortcuts(): Promise<Test<EntryCheck[]>> {
    return this.#runEntryTest(
      'Test the crosshair and keyboard shortcuts are scoped to the focused viewer',
      async (entry): Promise<void> => {
        const a = this.getMapId();
        const b = A11yEntryTester.COMPANION_ID;

        // The viewers share browser focus, so finish entry in each before exercising shortcuts.
        for (const id of [a, b]) {
          // eslint-disable-next-line no-await-in-loop -- The two viewers share browser focus.
          await A11yEntryTester.#openPrompt(entry, id);
          // eslint-disable-next-line no-await-in-loop -- Finish the current prompt before opening the next one.
          await entry.activate(A11yEntryTester.#requireControl(id, 'enable-focus'), `Enable keyboard navigation on ${id}`);
          entry.focus(id, 'wcag-link-to-map');
        }
        entry.mode(a, true);
        entry.mode(b, true);

        // Transfer map focus between viewers and check that crosshairs follow the focused viewer.
        await entry.activate(A11yEntryTester.#requireControl(a, 'wcag-link-to-map'), 'Focus the first map and activate its crosshair');
        entry.focus(a, 'mapTargetElement');
        entry.crosshair(a, true);
        entry.crosshair(b, false);
        A11yEntryTester.#requireControl(b, 'wcag-link-to-map').focus();
        entry.crosshair(a, false);
        entry.mode(a, true);
        await entry.pressKey('m', 'Activate Ctrl+M in the companion viewer', { ctrlKey: true });
        entry.focus(b, 'mapTargetElement');
        entry.crosshair(b, true);
        entry.crosshair(a, false);
        await entry.pressKey('m', 'Repeat Ctrl+M without toggling the crosshair off', { ctrlKey: true });
        entry.focus(b, 'mapTargetElement');
        entry.crosshair(b, true);
        await entry.pressKey('q', 'Exit keyboard navigation in the companion viewer', { ctrlKey: true });
        entry.focus(b, 'wcag-toplink');
        entry.mode(b, false);
        entry.mode(a, true);
        entry.crosshair(b, false);

        // Shortcuts from the surrounding page must not act on either viewer.
        entry.before.focus();
        await entry.pressKey('m', 'Verify Ctrl+M does nothing from the host page', { ctrlKey: true });
        entry.check('Host control retained focus', DomHelper.getActiveElement()?.id, entry.before.id);
        entry.crosshair(a, false);
        entry.crosshair(b, false);
        entry.prompt();
      }
    );
  }

  /**
   * Tests that mouse movement over an unanswered entry prompt leaves it open.
   *
   * @returns A promise that resolves with the prompt and focus observations after mouse movement
   */
  testUnansweredPromptStaysOpenOnMouseMove(): Promise<Test<EntryCheck[]>> {
    return this.#runEntryTest('Test mouse movement on the unanswered prompt overlay leaves it open', async (entry): Promise<void> => {
      const b = A11yEntryTester.COMPANION_ID;
      const a = this.getMapId();
      await A11yEntryTester.#openPrompt(entry, b);
      const dialog = A11yEntryTester.#requireControl(b, 'wcag-dialog-title').closest('[role="dialog"]');
      const overlay = dialog?.parentElement;
      if (!overlay || !DomHelper.getGVRootElement(b).contains(overlay)) throw new TestError('Missing companion prompt overlay');

      // Target the overlay surrounding the dialog, not the map underneath it.
      overlay.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, movementX: 10 }));
      await DomHelper.waitForReactIdle();
      entry.prompt(b);
      entry.focus(b, 'enable-focus');
      entry.mode(b, false);
      entry.mode(a, false);

      // The unanswered prompt must still accept Enable after the pointer moves.
      await entry.activate(A11yEntryTester.#requireControl(b, 'enable-focus'), 'Enable after mouse movement');
      entry.focus(b, 'wcag-link-to-map');
      entry.mode(b, true);
    });
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Presses ArrowRight on the focused map target and records whether the view pans.
   *
   * @param entry - The observation and interaction helpers for this case
   * @param mapId - The viewer whose map should pan
   * @param label - The interaction that placed focus, shown in the step and check labels
   * @returns A promise that resolves after recording the pan observation
   */
  async #checkArrowPans(entry: EntryTestContext, mapId: string, label: string): Promise<void> {
    const view = this.getApi().getMapViewer(mapId).map.getView();
    const startX = view.getCenter()?.[0];
    let isPanned = false;
    if (DomHelper.getActiveElement() === DomHelper.getGVElementById(mapId, 'mapTargetElement')) {
      await entry.pressKey('ArrowRight', `Press ArrowRight after ${label}`);
      try {
        await whenThisThen(() => view.getCenter()?.[0] !== startX, GVAbstractTester.KEYBOARD_QUERY_TIMEOUT_MS);
        isPanned = true;
      } catch {
        isPanned = false;
      }
    }
    entry.check(`ArrowRight pans ${mapId} after ${label}`, isPanned, true);
  }

  /**
   * Opens the prompt from an outer link at the far viewport edge, skips it, and records the handoff and its visibility.
   *
   * @param entry - The observation and interaction helpers for this case
   * @param mapId - The viewer whose prompt should be skipped
   * @param reverse - Whether to enter through the bottom link, so Skip targets the top link
   * @returns A promise that resolves after recording the Skip observations
   */
  async #skipPrompt(entry: EntryTestContext, mapId: string, reverse: boolean): Promise<void> {
    const suffix = reverse ? 'wcag-toplink' : 'wcag-bottomlink';
    const destination = A11yEntryTester.#requireControl(mapId, suffix);

    // Park the entry link at the far edge so the opposite outer link is off-screen at any viewport size.
    A11yEntryTester.#requireControl(mapId, reverse ? 'wcag-bottomlink' : 'wcag-toplink').scrollIntoView({
      block: reverse ? 'start' : 'end',
      inline: 'nearest',
    });
    entry.check(`${suffix} off-screen before Skip ${mapId}`, A11yEntryTester.#isWithinViewport(destination), false);
    await A11yEntryTester.#openPrompt(entry, mapId, reverse);
    await entry.activate(A11yEntryTester.#requireControl(mapId, 'skip-focus'), `Skip ${mapId}`);
    entry.focus(mapId, suffix);
    entry.check(`${suffix} within the viewport after Skip ${mapId}`, A11yEntryTester.#isWithinViewport(destination), true);
    entry.mode(this.getMapId(), false);
    entry.mode(A11yEntryTester.COMPANION_ID, false);
    entry.prompt();
  }

  /**
   * Runs a case and restores both viewers and host focus afterward.
   *
   * @param title - The test title shown in the results
   * @param exercise - The interactions that record observations for assertion
   * @param freshCompanion - Optional flag to reload the companion before exercising its first-entry guard
   * @returns A promise that resolves with the completed entry test
   */
  #runEntryTest(title: string, exercise: (entry: EntryTestContext) => Promise<void>, freshCompanion = false): Promise<Test<EntryCheck[]>> {
    const ownerId = this.getMapId();
    const mapIds = [ownerId, A11yEntryTester.COMPANION_ID];
    const doc = DomHelper.getGVRootElement(ownerId).ownerDocument;
    let restore: (() => Promise<void>) | undefined;

    return this.test(
      title,
      async (test): Promise<EntryCheck[]> => {
        const before = doc.querySelector<HTMLElement>('#a11y-entry-before');
        if (!before || !this.getApi().hasMapViewer(A11yEntryTester.COMPANION_ID)) {
          throw new TestSkippedError('Two-map entry tests require the Group 6 companion fixture');
        }
        A11yEntryTester.requireVisibleViewers(ownerId);

        // Save both viewers and host-page focus before the case changes shared state.
        const originalFocus = DomHelper.getActiveElement();
        const view = doc.defaultView;
        const originalScroll = { x: view?.scrollX ?? 0, y: view?.scrollY ?? 0 };
        const originalState = mapIds.map((id) => ({
          id,
          mode: getStoreUIActiveTrapGeoView(id),
          crosshair: getStoreAppIsCrosshairsActive(id),
          interaction: getStoreMapInteraction(id),
          interactions: this.getApi()
            .getMapViewer(id)
            .map.getInteractions()
            .getArray()
            .map((interaction) => ({ interaction, active: interaction.getActive() })),
        }));
        restore = async (): Promise<void> => {
          for (const { id, mode, crosshair, interaction, interactions } of originalState) {
            const enable = DomHelper.getGVElementById(id, 'enable-focus');
            if (enable) {
              enable.click();
              // eslint-disable-next-line no-await-in-loop -- The next case must not observe a closing modal from this case.
              await whenThisThen(() => !enable.isConnected, GVAbstractTester.KEYBOARD_QUERY_TIMEOUT_MS);
            }
            const viewer = this.getApi().getMapViewer(id);
            if (getStoreMapInteraction(id) !== interaction) {
              viewer.setInteraction(interaction);
              interactions.forEach((state) => state.interaction.setActive(state.active));
            }
            const { uiController } = viewer.controllers;
            uiController.closeMapPopovers();
            uiController.setActiveTrapGeoView(mode);
            uiController.setCrosshairActive(crosshair);
          }
          await DomHelper.waitForReactIdle();
          if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
          view?.scrollTo(originalScroll.x, originalScroll.y);
        };

        // Reload only when the case needs the companion's untouched first-entry guard.
        if (freshCompanion) {
          const companion = await this.getApi().reload(A11yEntryTester.COMPANION_ID);
          await companion.waitForMapReady();
        }
        mapIds.forEach((id) => {
          const { uiController } = this.getApi().getMapViewer(id).controllers;
          uiController.setActiveTrapGeoView(false);
          uiController.setCrosshairActive(false);
        });
        await DomHelper.waitForReactIdle();

        const checks: EntryCheck[] = [];
        /** Records a named observation for the assertion callback. */
        const check: EntryTestContext['check'] = (label, actual, expected): void => {
          checks.push({ label, actual, expected });
        };
        /** Counts ID matches page-wide and verifies their ownership. */
        const ids = (id: string, suffix: string, present = true): void => {
          const fullId = DomHelper.buildGVElementId(id, suffix);
          // A scoped lookup alone cannot detect an ID duplicated in another viewer or in the host page.
          const matches = Array.from(doc.querySelectorAll(`#${CSS.escape(fullId)}`));
          check(`${fullId} count`, matches.length, present ? 1 : 0);
          if (present)
            check(`${fullId} belongs to ${id}`, matches.length === 1 && DomHelper.getGVRootElement(id).contains(matches[0]), true);
        };
        /** Records the actual focus ID and the expected target’s ownership. */
        const focus = (id: string, suffix: string): void => {
          check(
            `Focus destination for ${id}`,
            DomHelper.getActiveElement()?.id || DomHelper.getActiveElement()?.tagName,
            DomHelper.buildGVElementId(id, suffix)
          );
          ids(id, suffix);
        };
        mapIds.forEach((id) => VIEWER_IDS.forEach((suffix) => ids(id, suffix)));
        await exercise({
          before,
          check,
          ids,
          focus,
          pressKey: async (key, label, modifiers): Promise<boolean> => {
            test.addStep(label);
            const active = DomHelper.getActiveElement();
            if (!active || active === doc.body) throw new TestError(`Cannot press ${key} without a focused control`);
            const event = new KeyboardEvent('keydown', {
              key,
              code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
              bubbles: true,
              cancelable: true,
              ...modifiers,
            });
            active.dispatchEvent(event);
            await DomHelper.waitForReactIdle();
            return event.defaultPrevented;
          },
          activate: async (control, label): Promise<void> => {
            test.addStep(label);
            control.focus({ preventScroll: true });
            control.click();
            await DomHelper.waitForReactIdle();
            if (/-(enable|skip)-focus$/.test(control.id)) {
              await whenThisThen(() => !control.isConnected, GVAbstractTester.KEYBOARD_QUERY_TIMEOUT_MS);
            }
          },
          prompt: (id): void => {
            mapIds.forEach((viewerId) => PROMPT_IDS.forEach((suffix) => ids(viewerId, suffix, viewerId === id)));
            if (id) focus(id, 'enable-focus');
          },
          mode: (id, expected): void => check(`${id} keyboard navigation mode`, getStoreUIActiveTrapGeoView(id), expected),
          crosshair: (id, expected): void => check(`${id} crosshair`, getStoreAppIsCrosshairsActive(id), expected),
        });

        // Defer all assertions until the complete interaction has been observed.
        return checks;
      },
      (test, checks): void => {
        const mismatches = checks.filter(({ actual, expected }) => actual !== expected);
        const diagnostics = mismatches.map(({ label, actual, expected }) => `${label}: expected ${expected}, observed ${actual}`);
        diagnostics.forEach((message) => test.addStep(message));
        Test.assertIsEqual(diagnostics.join('; '), '');
      },
      async (): Promise<void> => {
        if (restore) await restore();
      }
    );
  }

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

  /**
   * Requires both Group 6 viewers to be visible in the foreground document.
   *
   * @param mapId - The main Group 6 viewer
   * @throws {TestSkippedError} When the viewers are hidden or the document is not in the foreground
   */
  static requireVisibleViewers(mapId: string): void {
    const doc = DomHelper.getGVRootElement(mapId).ownerDocument;
    if (
      [mapId, A11yEntryTester.COMPANION_ID].some((id) => !DomHelper.getGVRootElement(id).checkVisibility({ visibilityProperty: true })) ||
      doc.visibilityState !== 'visible' ||
      !doc.hasFocus()
    ) {
      throw new TestSkippedError('Group 6 tests require both viewers visible and the document in the foreground');
    }
  }

  /**
   * Invokes the boundary link's key handler without depending on native Tab traversal.
   *
   * @param entry - The observation and interaction helpers for this case
   * @param mapId - The viewer whose entry prompt should open
   * @param reverse - Optional flag to enter through the bottom link
   * @returns A promise that resolves after recording the prompt observations
   */
  static async #openPrompt(entry: EntryTestContext, mapId: string, reverse = false): Promise<void> {
    const suffix = reverse ? 'wcag-bottomlink' : 'wcag-toplink';
    A11yEntryTester.#requireControl(mapId, suffix).focus({ preventScroll: true });
    entry.focus(mapId, suffix);
    const intercepted = await entry.pressKey('Tab', `Open ${mapId} prompt from the ${reverse ? 'bottom' : 'top'} link`, {
      shiftKey: reverse,
    });
    entry.check(`${mapId} boundary intercepted the entry key`, intercepted, true);
    entry.prompt(mapId);
  }

  /**
   * Checks whether an element is fully inside its window's viewport, horizontally and vertically.
   *
   * @param element - The element to measure
   * @returns True when the element's bounding box lies entirely within the viewport
   */
  static #isWithinViewport(element: HTMLElement): boolean {
    const view = element.ownerDocument.defaultView;
    if (!view) return false;
    const { top, bottom, left, right } = element.getBoundingClientRect();
    return top >= 0 && bottom <= view.innerHeight && left >= 0 && right <= view.innerWidth;
  }

  /**
   * Resolves a fixture element without ever borrowing another map's control.
   *
   * @param mapId - The viewer that owns the control
   * @param suffix - The control's map-relative ID
   * @returns The required fixture control
   * @throws {TestError} When the control is missing
   */
  static #requireControl(mapId: string, suffix: string): HTMLElement {
    const control = DomHelper.getGVElementById(mapId, suffix);
    if (!control) throw new TestError(`Missing ${mapId}-${suffix}`);
    return control;
  }

  // #endregion STATIC METHODS
}

// #region TYPES AND INTERFACES

/** A primitive observation accepted by an entry check. */
type EntryValue = string | number | boolean | undefined;

/** A named observation and its expected value. */
interface EntryCheck {
  /** The behavior described by this check. */
  label: string;
  /** The value observed during execution. */
  actual: EntryValue;
  /** The value required by the entry contract. */
  expected: EntryValue;
}

/** Interaction and observation helpers shared by entry test cases. */
interface EntryTestContext {
  /** The host-page control before the Group 6 viewers. */
  before: HTMLElement;
  /** Dispatches a key from the focused control and reports whether it was intercepted. */
  pressKey: (key: string, label: string, modifiers?: Pick<KeyboardEventInit, 'shiftKey' | 'ctrlKey'>) => Promise<boolean>;
  /** Focuses and clicks a control, then waits for React and any prompt closure. */
  activate: (control: HTMLElement, label: string) => Promise<void>;
  /** Records a named observation for the assertion callback. */
  check: (label: string, actual: EntryValue, expected: EntryValue) => void;
  /** Checks an ID's page-wide uniqueness and viewer ownership, or its absence. */
  ids: (id: string, suffix: string, present?: boolean) => void;
  /** Records the active focus destination and verifies its viewer ownership. */
  focus: (id: string, suffix: string) => void;
  /** Records prompt ownership and Enable focus, or that all prompts are closed. */
  prompt: (id?: string) => void;
  /** Records a viewer's keyboard-navigation mode. */
  mode: (id: string, expected: boolean) => void;
  /** Records a viewer's crosshair state. */
  crosshair: (id: string, expected: boolean) => void;
}

// #endregion TYPES AND INTERFACES
