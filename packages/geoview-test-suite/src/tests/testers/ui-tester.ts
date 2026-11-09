import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { Popper } from 'geoview-core/ui/popper/popper';
import { CONTAINER_TYPE, MAP_SECTION_SCROLL_GAP_PX, TIMEOUT } from 'geoview-core/core/utils/constant';
import { delay, generateId, whenThisThen } from 'geoview-core/core/utils/utilities';
import { getStoreAppHeight, getStoreAppIsCrosshairsActive, setStoreAppFullScreenActive } from 'geoview-core/core/stores/states/app-state';
import { getStoreUIActiveAppBarTab, getStoreUIActiveTrapGeoView, getStoreUIFocusItem } from 'geoview-core/core/stores/states/ui-state';
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
   * Verifies Resize returns focus only for explicit dismissal, without overriding newer focus.
   *
   * @returns Dismissal and focus-restoration evidence with isolated viewer cleanup
   */
  testResizePopoverFocusRestoration(): Promise<Test<boolean[]>> {
    const mapId = `resize-${generateId(8)}`;
    const fixture = UITester.#createScrollFixture(mapId);
    const originalScroll = { x: window.scrollX, y: window.scrollY };
    const originalFocus = DomHelper.getActiveElement();

    return this.test(
      'Test Resize popover explicit dismissal and focus preservation',
      async (test): Promise<boolean[]> => {
        test.addStep('Creating an isolated keyboard-mode viewer with fullscreen footer state...');
        document.body.appendChild(fixture);
        await this.#createScrollViewer(mapId, 'visible');
        const { uiController } = this.getApi().getMapViewer(mapId).controllers;
        uiController.setActiveTrapGeoView(true);
        uiController.setActiveFooterBarTab('layers');
        uiController.setFooterBarIsOpen(true);
        setStoreAppFullScreenActive(mapId, true);
        const button = await whenThisThen(
          (): HTMLButtonElement | undefined =>
            DomHelper.queryGVSelector<HTMLButtonElement>(mapId, '[id$="-tabsContainer"] button[aria-haspopup="dialog"]'),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!button) throw new Error('Fullscreen footer Resize trigger was not rendered');
        await delay(TIMEOUT.dataPanelLoading);
        const unrelated = document.createElement('button');
        unrelated.textContent = 'Newer focus target';
        fixture.appendChild(unrelated);
        const evidence: boolean[] = [];

        /** Dispatches a keyboard action through the real control handlers. */
        const keyDown = (target: HTMLElement, key: string): void => {
          target.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
        };
        const scenarios = ['close', 'escape', 'enter', 'slider-escape', 'click-away', 'newer-focus', 'pointer-commit'] as const;
        // These scenarios share one popover and must finish restoration before the next opens.
        for (const scenario of scenarios) {
          test.addStep(`Checking Resize dismissal: ${scenario}...`);
          button.focus();
          button.click();
          // eslint-disable-next-line no-await-in-loop
          const close = await whenThisThen(
            (): HTMLButtonElement | undefined => DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'resize-close-button'),
            GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
            GVAbstractTester.UI_POLL_INTERVAL_MS
          );
          if (!close) throw new Error('Resize Close button was not rendered');
          // Wait for the application's own opening focus job, rather than masking it with test focus.
          // eslint-disable-next-line no-await-in-loop
          await whenThisThen(
            (): boolean => DomHelper.getActiveElement() === close,
            GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
            GVAbstractTester.UI_POLL_INTERVAL_MS
          );
          const panel = close.closest('section');
          const slider = panel?.querySelector<HTMLInputElement>('input[type="range"]');
          if (!slider) throw new Error('Resize slider was not rendered');
          if (scenario === 'close' || scenario === 'newer-focus') {
            close.click();
          } else if (scenario === 'escape') {
            keyDown(close, 'Escape');
          } else if (scenario === 'enter' || scenario === 'slider-escape') {
            slider.focus();
            keyDown(slider, 'ArrowUp');
            keyDown(slider, scenario === 'enter' ? 'Enter' : 'Escape');
          } else if (scenario === 'click-away') {
            unrelated.focus();
            unrelated.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
          } else {
            const track = slider.closest<HTMLElement>('.MuiSlider-root');
            if (!track) throw new Error('Resize slider track was not rendered');
            const rect = track.getBoundingClientRect();
            const pointer = {
              bubbles: true,
              pointerType: 'mouse',
              pointerId: 1,
              button: 0,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
            };
            track.dispatchEvent(new PointerEvent('pointerdown', { ...pointer, buttons: 1 }));
            document.dispatchEvent(new PointerEvent('pointerup', { ...pointer, buttons: 0 }));
          }
          // eslint-disable-next-line no-await-in-loop
          await whenThisThen(
            (): boolean => button.getAttribute('aria-expanded') === 'false',
            GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
            GVAbstractTester.UI_POLL_INTERVAL_MS
          );
          if (scenario === 'newer-focus') unrelated.focus();
          // eslint-disable-next-line no-await-in-loop
          await delay(TIMEOUT.resizeButtonFocusRestore + GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
          const focus = DomHelper.getActiveElement();
          if (scenario === 'click-away' || scenario === 'newer-focus') evidence.push(focus === unrelated);
          else if (scenario === 'pointer-commit') evidence.push(focus !== button);
          else evidence.push(focus === button);
        }
        return evidence;
      },
      (test, evidence): void => {
        test.addStep('Verifying explicit restoration, click-away, pointer commit, and newer-focus preservation...');
        Test.assertIsEqual(evidence.length, 7);
        evidence.forEach((passed): void => Test.assertIsEqual(passed, true));
      },
      async (): Promise<void> => {
        await this.#cleanupScrollFixture(mapId, fixture, originalScroll);
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus();
      }
    );
  }

  /**
   * Verifies Escape handling stays within a popover and its owning DOM anchor.
   *
   * @returns Keyboard-boundary evidence and isolated fixture cleanup
   */
  testPopperKeyboardBoundary(): Promise<Test<boolean[]>> {
    const mapId = `popper-${generateId(8)}`;
    const fixture = UITester.#createScrollFixture(mapId);
    const originalScroll = { x: window.scrollX, y: window.scrollY };
    const originalFocus = DomHelper.getActiveElement();
    let unmount: (() => void) | undefined;

    return this.test(
      'Test Popper keyboard boundary and Attribution Escape',
      async (test): Promise<boolean[]> => {
        test.addStep('Opening Attribution with focus retained on its trigger...');
        document.body.appendChild(fixture);
        await this.#createScrollViewer(mapId, 'visible');
        const attribution = await whenThisThen(
          (): HTMLButtonElement | undefined => DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'attribution'),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!attribution) throw new Error('Attribution trigger was not rendered');
        attribution.focus();
        attribution.click();
        await whenThisThen(
          (): boolean => attribution.getAttribute('aria-expanded') === 'true',
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        const evidence = [DomHelper.getActiveElement() === attribution];

        /** Dispatches Escape without changing focus, so blur-to-close cannot mask a boundary failure. */
        const escape = (target: EventTarget, prevented = false): void => {
          const event = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true });
          if (prevented) event.preventDefault();
          target.dispatchEvent(event);
        };
        escape(DomHelper.getGVRootElement(this.getMapId()));
        await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        evidence.push(attribution.getAttribute('aria-expanded') === 'true');
        escape(attribution);
        await whenThisThen(
          (): boolean => attribution.getAttribute('aria-expanded') === 'false',
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        evidence.push(DomHelper.getActiveElement() === attribution);

        test.addStep('Checking DOM, callback, and virtual anchors with two independent popovers...');
        const host = document.createElement('div');
        const anchor = document.createElement('button');
        const child = document.createElement('span');
        child.textContent = 'Keyboard boundary probe';
        anchor.appendChild(child);
        const unrelated = document.createElement('button');
        unrelated.textContent = 'Unrelated control';
        fixture.append(anchor, unrelated, host);
        const { createRoot, createElement, react } = window.cgpv.reactUtilities;
        const root = createRoot(host);
        unmount = (): void => root.unmount();
        let closeCount = 0;
        let otherCloseCount = 0;

        /** Renders the wrapper with the supplied anchor type and waits for effect registration. */
        const renderProbe = async (probeAnchor: Parameters<typeof Popper>[0]['anchorEl']): Promise<void> => {
          root.render(
            createElement(
              react.Fragment,
              {},
              createElement(Popper, {
                open: true,
                anchorEl: probeAnchor,
                container: host,
                onClose: (): void => {
                  closeCount += 1;
                },
                handleKeyDown: (key, close): void => {
                  if (key === 'Escape') close();
                },
                children: createElement('button', { id: `${mapId}-content` }, 'Popover content'),
              }),
              createElement(Popper, {
                open: true,
                anchorEl: unrelated,
                container: host,
                onClose: (): void => {
                  otherCloseCount += 1;
                },
                handleKeyDown: (key, close): void => {
                  if (key === 'Escape') close();
                },
                children: createElement('span', {}, 'Other popover'),
              })
            )
          );
          await whenThisThen(
            (): boolean => host.querySelector(`#${mapId}-content`) !== null,
            GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
            GVAbstractTester.UI_POLL_INTERVAL_MS
          );
          await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        };
        await renderProbe(anchor);
        escape(child, true);
        escape(document.body);
        escape(document);
        evidence.push(closeCount === 0 && otherCloseCount === 0);
        escape(child);
        evidence.push(closeCount === 1 && otherCloseCount === 0);
        const content = host.querySelector<HTMLButtonElement>(`#${mapId}-content`);
        if (!content) throw new Error('Popover probe content was not rendered');
        escape(content);
        evidence.push(closeCount === 2 && otherCloseCount === 0);
        escape(unrelated);
        evidence.push(closeCount === 2 && otherCloseCount === 1);
        await renderProbe((): HTMLElement => anchor);
        escape(child);
        evidence.push(closeCount === 3);
        await renderProbe({ getBoundingClientRect: (): DOMRect => anchor.getBoundingClientRect(), contextElement: anchor });
        escape(child);
        evidence.push(closeCount === 3);
        escape(content);
        evidence.push(closeCount === 4);
        return evidence;
      },
      (test, evidence): void => {
        test.addStep('Verifying trigger/content Escape handling, prevented events, and unrelated-owner isolation...');
        Test.assertIsEqual(evidence.length, 10);
        evidence.forEach((passed): void => Test.assertIsEqual(passed, true));
      },
      async (): Promise<void> => {
        unmount?.();
        await this.#cleanupScrollFixture(mapId, fixture, originalScroll);
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus();
      }
    );
  }

  /**
   * Verifies shared popover ownership through real controls in a layer-free viewer.
   *
   * @param consumer - The popover implementation to exercise
   * @returns Ownership and DOM-focus evidence, with isolated fixture cleanup
   */
  testPopoverFocusOwnership(consumer: TypePopoverConsumer): Promise<Test<TypePopoverOwnershipResult>> {
    const mapId = `popover-${generateId(8)}`;
    const fixture = UITester.#createScrollFixture(mapId);
    const originalScroll = { x: window.scrollX, y: window.scrollY };
    const originalFocus = DomHelper.getActiveElement();

    return this.test(
      `Test popover focus ownership - ${consumer}`,
      async (test): Promise<TypePopoverOwnershipResult> => {
        test.addStep('Creating an isolated viewer and a keyboard-owned footer...');
        document.body.appendChild(fixture);
        await this.#createScrollViewer(mapId, 'visible');
        const viewer = this.getApi().getMapViewer(mapId);
        const { uiController } = viewer.controllers;
        const navbarId = `${mapId}-probe`;
        if (consumer === 'navbar') {
          viewer.navBarApi.createNavbarButtonPanel(
            { id: navbarId, 'aria-label': 'Focus ownership probe', children: 'Probe' },
            { title: 'Focus ownership probe', content: 'Focus ownership probe', icon: 'Probe', status: false },
            'default'
          );
        }
        const buttonSuffix =
          consumer === 'navbar' ? 'probe' : `${CONTAINER_TYPE.APP_BAR}-${consumer === 'notifications' ? 'notifications' : consumer}-btn`;
        const ownerIds: Record<TypePopoverConsumer, string> = {
          navbar: `${mapId}-${navbarId}-navbar-focus-trap`,
          notifications: `${mapId}-notification-focus-trap`,
          settings: `${mapId}-${CONTAINER_TYPE.APP_BAR}-settings-panel-focus`,
          version: DomHelper.buildAppBarVersionFocusTrapId(mapId),
        };
        const ownerId = ownerIds[consumer];
        const footerOwnerId = `${mapId}-tab-layers`;
        const button = await whenThisThen(
          (): HTMLButtonElement | undefined => DomHelper.getGVElementById<HTMLButtonElement>(mapId, buttonSuffix),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!button) throw new Error(`Popover trigger was not rendered for '${consumer}'`);
        uiController.setActiveTrapGeoView(true);
        uiController.setActiveFooterBarTab('layers');
        uiController.setFooterBarIsOpen(true);
        uiController.enableFocusTrap({ activeElementId: footerOwnerId, callbackElementId: footerOwnerId, focusOnEntry: false });
        const footerExit = await whenThisThen(
          (): HTMLElement | undefined => DomHelper.getGVElementById(mapId, 'footerBar-layers-panel-close-btn'),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!footerExit) throw new Error('Footer Exit button was not rendered');
        footerExit.focus();
        await whenThisThen(
          (): boolean => getStoreUIFocusItem(mapId).activeElementId === footerOwnerId,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        await delay(TIMEOUT.dataPanelLoading + GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);

        test.addStep('Opening the popover, including navbar API synchronization...');
        if (consumer === 'navbar') viewer.navBarApi.setButtonPanelOpen(navbarId, true);
        else button.click();
        await whenThisThen(
          (): boolean => getStoreUIFocusItem(mapId).activeElementId === ownerId,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        const acquiredOwner = getStoreUIFocusItem(mapId).activeElementId;
        const dialog = DomHelper.getGVRootElement(mapId).querySelector<HTMLElement>('[role="dialog"]');
        if (!dialog) throw new Error(`Popover dialog was not rendered for '${consumer}'`);
        const closeButton = dialog.querySelector<HTMLButtonElement>('button');
        if (!closeButton) throw new Error('Popover close button was not rendered');
        closeButton.focus();
        closeButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
        await whenThisThen(
          (): boolean => getStoreUIFocusItem(mapId).activeElementId === footerOwnerId,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        const restoredOwner = getStoreUIFocusItem(mapId).activeElementId;
        const triggerFocused = DomHelper.getActiveElement()?.id === button.id;

        test.addStep('Closing through the controller without returning DOM focus to the trigger...');
        button.click();
        await whenThisThen(
          (): boolean => getStoreUIFocusItem(mapId).activeElementId === ownerId,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        footerExit.focus();
        uiController.closeMapPopovers();
        await whenThisThen(
          (): boolean =>
            getStoreUIFocusItem(mapId).activeElementId !== ownerId && !DomHelper.getGVRootElement(mapId).querySelector('[role="dialog"]'),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        const externalCloseOwner = getStoreUIFocusItem(mapId).activeElementId;
        const externalCloseFocusPreserved = DomHelper.getActiveElement() === footerExit;

        test.addStep('Reopening from the trigger and yielding to a newer owner without a focus jump...');
        button.click();
        await whenThisThen(
          (): boolean => getStoreUIFocusItem(mapId).activeElementId === ownerId,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        const newerOwnerId = `${mapId}-new-owner`;
        uiController.enableFocusTrap({ activeElementId: newerOwnerId, callbackElementId: false, focusOnEntry: false });
        footerExit.focus();
        await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        const yieldedOwner = getStoreUIFocusItem(mapId).activeElementId;
        const focusPreserved = DomHelper.getActiveElement() === footerExit;
        const unmountChecks: boolean[] = [];

        if (consumer === 'navbar') {
          test.addStep('Removing an active navbar popover, then removing one superseded by a newer owner...');
          for (const superseded of [false, true]) {
            uiController.enableFocusTrap({ activeElementId: footerOwnerId, callbackElementId: footerOwnerId, focusOnEntry: false });
            viewer.navBarApi.setButtonPanelOpen(navbarId, true);
            // eslint-disable-next-line no-await-in-loop -- Removal cases reuse the same navbar registration sequentially.
            await whenThisThen(
              (): boolean => getStoreUIFocusItem(mapId).activeElementId === ownerId,
              GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
              GVAbstractTester.UI_POLL_INTERVAL_MS
            );
            footerExit.focus();
            if (superseded) uiController.enableFocusTrap({ activeElementId: newerOwnerId, callbackElementId: false, focusOnEntry: false });
            viewer.navBarApi.removeNavbarButtonPanel(navbarId);
            // eslint-disable-next-line no-await-in-loop -- Wait for unmount before checking ownership or recreating the panel.
            await whenThisThen(
              (): boolean => DomHelper.getGVElementById(mapId, 'probe') === undefined,
              GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
              GVAbstractTester.UI_POLL_INTERVAL_MS
            );
            // eslint-disable-next-line no-await-in-loop -- Allow unmount cleanup and pending focus work to settle.
            await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
            unmountChecks.push(
              getStoreUIFocusItem(mapId).activeElementId === (superseded ? newerOwnerId : footerOwnerId),
              DomHelper.getActiveElement() === footerExit
            );
            if (!superseded) {
              viewer.navBarApi.createNavbarButtonPanel(
                { id: navbarId, 'aria-label': 'Focus ownership probe', children: 'Probe' },
                { title: 'Focus ownership probe', content: 'Focus ownership probe', icon: 'Probe', status: false },
                'default'
              );
              // eslint-disable-next-line no-await-in-loop -- The next removal case needs a newly mounted trigger.
              await whenThisThen(
                (): boolean => DomHelper.getGVElementById(mapId, 'probe') !== undefined,
                GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
                GVAbstractTester.UI_POLL_INTERVAL_MS
              );
            }
          }
        }
        return {
          acquiredOwner,
          expectedOwner: ownerId,
          restoredOwner,
          expectedPreviousOwner: footerOwnerId,
          triggerFocused,
          externalCloseOwner,
          externalCloseFocusPreserved,
          yieldedOwner,
          expectedNewOwner: newerOwnerId,
          focusPreserved,
          unmountChecks,
        };
      },
      (test, result): void => {
        test.addStep('Verifying acquisition, previous-owner restoration, trigger focus, and superseding ownership...');
        Test.assertIsEqual(result.acquiredOwner, result.expectedOwner);
        Test.assertIsEqual(result.restoredOwner, result.expectedPreviousOwner);
        Test.assertIsEqual(result.triggerFocused, true);
        Test.assertIsEqual(result.externalCloseOwner, false);
        Test.assertIsEqual(result.externalCloseFocusPreserved, true);
        Test.assertIsEqual(result.yieldedOwner, result.expectedNewOwner);
        Test.assertIsEqual(result.focusPreserved, true);
        Test.assertIsEqual(result.unmountChecks.length, consumer === 'navbar' ? 4 : 0);
        result.unmountChecks.forEach((passed): void => Test.assertIsEqual(passed, true));
      },
      async (): Promise<void> => {
        await this.#cleanupScrollFixture(mapId, fixture, originalScroll);
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus();
      }
    );
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
   * Verifies AppBar restoration preserves newer focus, ordinary button return, and crosshair-query map return.
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
        const settingsSwitch = await whenThisThen(
          (): HTMLElement | undefined => DomHelper.getGVElementById(mapId, `${CONTAINER_TYPE.APP_BAR}-settings-panel-keyboard-navigation`),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!settingsSwitch) throw new Error('Settings keyboard-navigation switch was not rendered');
        await whenThisThen(
          (): boolean => DomHelper.getActiveElement() === settingsSwitch,
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

        test.addStep('Closing keyboard-query Details and verifying map focus and crosshair restoration...');
        const mapTarget = DomHelper.getMapTargetElement(mapId);
        if (!mapTarget) throw new Error('Map focus target was not rendered');
        mapTarget.focus();
        uiController.setCrosshairActive(true);
        uiController.setActiveAppBarTab('details', true, true, true);
        await DomHelper.waitForAppbarTabSelected(mapId, 'details');
        const queryCloseButton = await whenThisThen(
          (): HTMLButtonElement | undefined => DomHelper.getAppBarPanelCloseButton(mapId, 'details'),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!queryCloseButton) throw new Error('Query Details panel close button was not rendered');
        queryCloseButton.focus();
        uiController.setCrosshairActive(false);
        queryCloseButton.click();
        await DomHelper.waitForAppbarTabNotSelected(mapId, 'details');
        await delay(TIMEOUT.dataPanelLoading + GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);

        return {
          expectedNewFocusId: settingsSwitch.id,
          actualNewFocusId: focusAfterNewOwner?.id ?? '',
          crosshairBeforeNewOwnerRestore,
          crosshairAfterNewOwnerRestore,
          expectedReturnFocusId: detailsButton.id,
          actualReturnFocusId: focusAfterOrdinaryClose?.id ?? '',
          expectedQueryReturnFocusId: mapTarget.id,
          actualQueryReturnFocusId: DomHelper.getActiveElement()?.id ?? '',
          crosshairAfterQueryClose: getStoreAppIsCrosshairsActive(mapId),
        };
      },
      (test, result): void => {
        test.addStep('Verifying newer focus is preserved and ordinary focus restoration still works...');
        Test.assertIsEqual(result.actualNewFocusId, result.expectedNewFocusId);
        Test.assertIsEqual(result.crosshairAfterNewOwnerRestore, result.crosshairBeforeNewOwnerRestore);
        Test.assertIsEqual(result.actualReturnFocusId, result.expectedReturnFocusId);
        Test.assertIsEqual(result.actualQueryReturnFocusId, result.expectedQueryReturnFocusId);
        Test.assertIsEqual(result.crosshairAfterQueryClose, true);
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
   * Waits for initialization before deleting the isolated viewer, then restores the host page.
   *
   * @param mapId - The isolated viewer ID
   * @param fixture - The host element mounted in the page
   * @param originalScroll - The page scroll position captured before the test
   * @returns A promise that resolves once the page is back to its original state
   */
  async #cleanupScrollFixture(mapId: string, fixture: HTMLElement, originalScroll: { x: number; y: number }): Promise<void> {
    try {
      // The viewer may not exist when setup failed early, so check before deleting
      if (this.getApi().hasMapViewer(mapId)) {
        // Fast creation returns before readyMap finishes registering handlers against the live map.
        await this.getApi().getMapViewer(mapId).waitForMapReady();
        await this.getApi().deleteMapViewer(mapId, true);
      }
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

/** Consumers sharing the popover ownership operations. */
type TypePopoverConsumer = 'version' | 'notifications' | 'navbar' | 'settings';

/** Ownership and DOM-focus evidence from the isolated popover fixture. */
type TypePopoverOwnershipResult = {
  acquiredOwner: string | false;
  expectedOwner: string;
  restoredOwner: string | false;
  expectedPreviousOwner: string;
  triggerFocused: boolean;
  externalCloseOwner: string | false;
  externalCloseFocusPreserved: boolean;
  yieldedOwner: string | false;
  expectedNewOwner: string;
  focusPreserved: boolean;
  unmountChecks: boolean[];
};

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
  /** Map target expected to regain focus after keyboard-query Details closes. */
  expectedQueryReturnFocusId: string;
  /** Actual focused element after keyboard-query Details closes. */
  actualQueryReturnFocusId: string;
  /** Whether explicit query dismissal reactivated the crosshair. */
  crosshairAfterQueryClose: boolean;
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
