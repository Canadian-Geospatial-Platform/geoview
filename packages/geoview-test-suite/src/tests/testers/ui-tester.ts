import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { buildAppBarFocusTrapId, buildGVElementId, buildTabId, isAppBarFocusTrapId } from 'geoview-core/core/utils/element-id';
import { Popper } from 'geoview-core/ui/popper/popper';
import { Switch } from 'geoview-core/ui/switch/switch';
import { BUILT_IN_MODAL_IDS, CONTAINER_TYPE, MAP_SECTION_SCROLL_GAP_PX, TIMEOUT } from 'geoview-core/core/utils/constant';
import { delay, doTimeout, generateId, getLocalizedMessage, whenThisThen } from 'geoview-core/core/utils/utilities';
import { getStoreAppHeight, getStoreAppIsCrosshairsActive, setStoreAppFullScreenActive } from 'geoview-core/core/stores/states/app-state';
import {
  getStoreUIActiveAppBarTab,
  getStoreUIActiveFooterBarTab,
  getStoreUIActiveTrapGeoView,
  getStoreUIFocusItem,
  getStoreUIIsModalActive,
  getStoreUIPopoverCloseVersion,
} from 'geoview-core/core/stores/states/ui-state';
import { getGeoViewStore } from 'geoview-core/core/stores/stores-managers';
import { getPopoverReturnFocusItem, usePopoverFocusOwner } from 'geoview-core/core/components/common/hooks/use-popover-focus-owner';
import { StoreContext } from 'geoview-core/core/stores/store-context';
import { ControllerContext } from 'geoview-core/core/controllers/base/controller-manager';
import { logger } from 'geoview-core/core/utils/logger';
import type { ReactElement } from 'react';
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
   * Verifies modal focus-owner classification without rendering dialogs or depending on DOM focus.
   *
   * @returns Classification evidence with restoration of the original focus owner
   */
  testModalFocusOwnerClassification(): Promise<Test<TypeOwnershipCheck[]>> {
    const mapId = this.getMapId();
    const { uiController } = this.getControllersRegistry();
    const originalFocusItem = getStoreUIFocusItem(mapId);

    return this.test(
      'Test built-in modal focus-owner classification',
      (test): TypeOwnershipCheck[] => {
        test.addStep('Classifying built-in modals, non-modal boundaries, and an unowned viewer...');
        const checks: TypeOwnershipCheck[] = [];

        // Keep owner changes synchronous and finish unowned so intermediate modal IDs never render dialogs.
        for (const [ownerId, expected] of [
          [BUILT_IN_MODAL_IDS.EXPORT, true],
          [BUILT_IN_MODAL_IDS.LAYER_DATA_TABLE, true],
          [BUILT_IN_MODAL_IDS.FEATURE_DETAIL_DATA_TABLE, true],
          [buildTabId(mapId, 'layers'), false],
          [buildAppBarFocusTrapId(mapId, 'legend'), false],
          [DomHelper.buildAppBarVersionFocusTrapId(mapId), false],
          [false, false],
        ] as const) {
          uiController.enableFocusTrap({ activeElementId: ownerId, callbackElementId: false, focusOnEntry: false });
          checks.push({
            source: String(ownerId),
            phase: 'modal focus-owner classification',
            actual: getStoreUIIsModalActive(mapId),
            expected,
          });
        }
        return checks;
      },
      (test, checks): void => {
        checks.forEach(({ source, actual, expected }): void => {
          test.addStep(`Verifying modal classification for '${source}'`);
          Test.assertIsEqual(actual, expected);
        });
      },
      (): void => {
        uiController.enableFocusTrap(originalFocusItem);
      }
    );
  }

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
   * Verifies popover keyboard boundaries and opening focus yield to newer interactions.
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
        let expectedOpeningTarget: HTMLElement | undefined;
        let openingInteractionError: unknown;
        let openingStartedAtAnchor = false;

        /** Moves focus after the opening effect captures its starting element but before its timer runs. */
        function OpeningFocusProbe({ scenario }: { scenario: string }): ReactElement {
          react.useEffect(() => {
            const job = doTimeout(0);
            job.promise
              .then((result): void => {
                if (result !== 'timeout') return;
                openingStartedAtAnchor = DomHelper.getActiveElement() === anchor;
                const suffix = scenario === 'normal' ? 'content' : scenario;
                const target = scenario === 'outside' ? unrelated : host.querySelector<HTMLElement>(`#${mapId}-${suffix}`);
                if (!target) throw new Error(`Popover interaction target '${scenario}' was not rendered`);
                expectedOpeningTarget = target;
                if (scenario !== 'normal') {
                  target.focus();
                  target.click();
                }
              })
              .catch((error: unknown): void => {
                openingInteractionError = error;
                logger.logError('Popover opening interaction failed:', error);
              });
            return (): void => job.cancel();
          }, [scenario]);
          return createElement(
            'div',
            { 'data-opening-scenario': scenario },
            createElement('button', { id: `${mapId}-content` }, 'Popover content'),
            createElement('input', { id: `${mapId}-input`, 'aria-label': 'Opening focus input' }),
            createElement('button', { id: `${mapId}-other-button` }, 'Other popover button')
          );
        }

        /** Renders the wrapper with the supplied anchor type and waits for effect registration. */
        const renderProbe = async (probeAnchor: Parameters<typeof Popper>[0]['anchorEl'], openingScenario?: string): Promise<void> => {
          root.render(
            createElement(
              react.Fragment,
              {},
              createElement(Popper, {
                key: openingScenario ?? 'keyboard',
                open: true,
                anchorEl: probeAnchor,
                container: host,
                focusSelector: openingScenario ? `#${mapId}-content` : undefined,
                onClose: (): void => {
                  closeCount += 1;
                },
                handleKeyDown: (key, close): void => {
                  if (key === 'Escape') close();
                },
                children: openingScenario
                  ? createElement(OpeningFocusProbe, { scenario: openingScenario })
                  : createElement('button', { id: `${mapId}-content`, 'data-opening-scenario': 'keyboard' }, 'Popover content'),
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
            (): boolean => host.querySelector(`[data-opening-scenario="${openingScenario ?? 'keyboard'}"]`) !== null,
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

        test.addStep('Checking normal opening focus and newer interactions inside and outside the popover...');
        for (const scenario of ['normal', 'input', 'other-button', 'outside']) {
          anchor.focus();
          expectedOpeningTarget = undefined;
          openingInteractionError = undefined;
          openingStartedAtAnchor = false;
          // eslint-disable-next-line no-await-in-loop -- Opening scenarios share focus and must use separate mounted popovers.
          await renderProbe(anchor, scenario);

          // eslint-disable-next-line no-await-in-loop -- Wait beyond opening focus before recording each interaction's final focus.
          await delay(GVAbstractTester.UI_SCROLL_SETTLE_MS);
          if (openingInteractionError) throw openingInteractionError;
          evidence.push(
            openingStartedAtAnchor && expectedOpeningTarget !== undefined && DomHelper.getActiveElement() === expectedOpeningTarget
          );
        }
        return evidence;
      },
      (test, evidence): void => {
        test.addStep('Verifying trigger/content Escape handling, prevented events, and unrelated-owner isolation...');
        Test.assertIsEqual(evidence.length, 14);
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
        const footerOwnerId = buildTabId(mapId, 'layers');
        const button = await whenThisThen(
          (): HTMLButtonElement | undefined => DomHelper.getGVElementById<HTMLButtonElement>(mapId, buttonSuffix),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!button) throw new Error(`Popover trigger was not rendered for '${consumer}'`);
        const modalChecks = consumer === 'navbar' ? await this.#checkModalPopoverExclusion(test, mapId, navbarId) : {};
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
        const closeButton = this.#requirePopoverCloseButton(mapId, consumer);
        closeButton.focus();
        closeButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
        await whenThisThen(
          (): boolean => getStoreUIFocusItem(mapId).activeElementId === footerOwnerId,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        const restoredOwner = getStoreUIFocusItem(mapId).activeElementId;
        const triggerFocused = DomHelper.getActiveElement()?.id === button.id;

        test.addStep('Switching footer tabs underneath the popover, then opening an AppBar panel...');
        button.click();
        await whenThisThen(
          (): boolean => getStoreUIFocusItem(mapId).activeElementId === ownerId,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        uiController.setActiveFooterBarTab('details');
        await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        const ownerDuringFooterSwitch = getStoreUIFocusItem(mapId).activeElementId;
        button.click();
        await whenThisThen(
          (): boolean => getStoreUIFocusItem(mapId).activeElementId !== ownerId,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        const ownerAfterFooterSwitch = getStoreUIFocusItem(mapId).activeElementId;
        uiController.setActiveAppBarTab('legend', true, true);
        const ownerAfterAppBarOpen = getStoreUIFocusItem(mapId).activeElementId;
        uiController.setActiveAppBarTab('legend', false, false);
        uiController.setActiveFooterBarTab('layers');
        uiController.enableFocusTrap({ activeElementId: footerOwnerId, callbackElementId: footerOwnerId, focusOnEntry: false });
        await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);

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
          (): boolean => getStoreUIFocusItem(mapId).activeElementId !== ownerId && !this.#findOwnershipDialog(mapId, consumer),
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
        const handoffChecks =
          consumer === 'navbar' ? await this.#checkNavbarPopoverHandoff(test, mapId, navbarId, ownerId, footerOwnerId) : [];

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
        const lifecycleEvidence =
          consumer === 'navbar'
            ? await this.#checkPopoverStoreLifecycle(test, mapId, fixture)
            : { lifecycleChecks: [], registryChecks: {} };
        return {
          acquiredOwner,
          expectedOwner: ownerId,
          restoredOwner,
          expectedPreviousOwner: footerOwnerId,
          triggerFocused,
          ownerDuringFooterSwitch,
          ownerAfterFooterSwitch,
          ownerAfterAppBarOpen,
          expectedAppBarOwner: buildAppBarFocusTrapId(mapId, 'legend'),
          externalCloseOwner,
          externalCloseFocusPreserved,
          yieldedOwner,
          expectedNewOwner: newerOwnerId,
          focusPreserved,
          unmountChecks,
          handoffChecks,
          modalChecks,
          ...lifecycleEvidence,
        };
      },
      (test, result): void => {
        test.addStep('Verifying acquisition, previous-owner restoration, trigger focus, and superseding ownership...');
        Test.assertIsEqual(result.acquiredOwner, result.expectedOwner);
        Test.assertIsEqual(result.restoredOwner, result.expectedPreviousOwner);
        Test.assertIsEqual(result.triggerFocused, true);
        Test.assertIsEqual(result.ownerDuringFooterSwitch, result.expectedOwner);
        Test.assertIsEqual(result.ownerAfterFooterSwitch, false);
        Test.assertIsEqual(result.ownerAfterAppBarOpen, result.expectedAppBarOwner);
        Test.assertIsEqual(result.externalCloseOwner, false);
        Test.assertIsEqual(result.externalCloseFocusPreserved, true);
        Test.assertIsEqual(result.yieldedOwner, result.expectedNewOwner);
        Test.assertIsEqual(result.focusPreserved, true);
        Test.assertIsEqual(result.unmountChecks.length, consumer === 'navbar' ? 4 : 0);
        result.unmountChecks.forEach((passed): void => Test.assertIsEqual(passed, true));
        Test.assertIsEqual(result.handoffChecks.length, consumer === 'navbar' ? 6 : 0);
        result.handoffChecks.forEach((passed): void => Test.assertIsEqual(passed, true));
        if (consumer === 'navbar') {
          for (const mode of ['pointer', 'keyboard']) {
            for (const modalId of [
              BUILT_IN_MODAL_IDS.EXPORT,
              BUILT_IN_MODAL_IDS.LAYER_DATA_TABLE,
              BUILT_IN_MODAL_IDS.FEATURE_DETAIL_DATA_TABLE,
            ]) {
              for (const check of [
                'owner-preserved',
                'dialog-and-focus-preserved',
                'opening-rejected',
                'shared-triggers-rejected',
                'controller-close-preserves-modal',
                'retry-opened',
                'dismissal-does-not-reopen-modal',
                'newer-modal-survives-popover-cleanup',
              ]) {
                const key = `${modalId}:${mode}:${check}`;
                test.addStep(`Verifying required modal exclusion check: ${key}`);
                Test.assertIsEqual(Object.prototype.hasOwnProperty.call(result.modalChecks, key), true);
              }
            }
          }
        } else {
          Test.assertIsEqual(Object.keys(result.modalChecks).length, 0);
        }
        Object.entries(result.modalChecks).forEach(([scenario, passed]): void => {
          test.addStep(`Verifying modal exclusion: ${scenario}`);
          Test.assertIsEqual(passed, true);
        });
        Test.assertIsEqual(result.lifecycleChecks.length, consumer === 'navbar' ? 8 : 0);
        result.lifecycleChecks.forEach((passed): void => Test.assertIsEqual(passed, true));
        Test.assertIsEqual(Object.keys(result.registryChecks).length, consumer === 'navbar' ? 28 : 0);
        Object.entries(result.registryChecks).forEach(([scenario, passed]): void => {
          test.addStep(`Verifying registry boundary: ${scenario}`);
          Test.assertIsEqual(passed, true);
        });
      },
      async (): Promise<void> => {
        const lifecycleMapId = `${mapId}-lifecycle`;
        try {
          if (this.getApi().hasMapViewer(lifecycleMapId)) {
            await this.#waitForPopoverViewerReady(lifecycleMapId);
            await this.getApi().deleteMapViewer(lifecycleMapId, true);
          }
        } finally {
          // Off-screen, layer-free fixtures need a render before cleanup waits for map readiness.
          if (this.getApi().hasMapViewer(mapId)) this.getApi().getMapViewer(mapId).map.renderSync();
          await this.#cleanupScrollFixture(mapId, fixture, originalScroll);
          if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus();
        }
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
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalFocus = DomHelper.getActiveElement();
    const removalPanelId = `ownership-removal-${generateId(8)}`;

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

        test.addStep('Transferring footer ownership on trigger, controller and legacy API opens...');
        uiController.setActiveTrapGeoView(true);
        await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        const ownershipChecks: TypeOwnershipCheck[] = [];
        test.addStep('Removing an owned AppBar panel without clearing a newer owner or moving focus...');
        const { appBarApi } = this.getMapViewer();
        for (const superseded of [false, true]) {
          const source = superseded ? 'removal with newer owner' : 'removal while owned';
          test.addStep(`Mounting the closed panel for ${source}...`);
          appBarApi.createAppbarPanel(
            { id: removalPanelId, 'aria-label': 'Ownership removal probe', children: 'Probe' },
            { title: 'Ownership removal probe', icon: 'Probe', content: 'Ownership removal probe' }
          );
          // eslint-disable-next-line no-await-in-loop -- Mount closed before opening; initially open panels intentionally do not autofocus.
          await whenThisThen(
            (): boolean => {
              const card = DomHelper.getAppBarPanel(mapId, removalPanelId)?.querySelector<HTMLElement>('.panel-card');
              return card !== undefined && card !== null && window.getComputedStyle(card).display === 'none';
            },
            GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
            GVAbstractTester.UI_POLL_INTERVAL_MS
          );
          uiController.enableFocusTrap({ activeElementId: false, callbackElementId: false });
          test.addStep(`Opening the mounted panel for ${source}...`);
          uiController.setActiveAppBarTab(removalPanelId, true, true);
          // eslint-disable-next-line no-await-in-loop -- Verify each registered panel mounts before testing its removal.
          await whenThisThen(
            (): boolean => DomHelper.getActiveElement() === DomHelper.getAppBarPanelCloseButton(mapId, removalPanelId),
            GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
            GVAbstractTester.UI_POLL_INTERVAL_MS
          );
          ownershipChecks.push({
            source,
            phase: 'acquisition',
            actual: getStoreUIFocusItem(mapId).activeElementId,
            expected: buildAppBarFocusTrapId(mapId, removalPanelId),
          });
          const newerOwnerId = `${mapId}-removal-newer-owner`;
          if (superseded) {
            uiController.enableFocusTrap({ activeElementId: newerOwnerId, callbackElementId: false, focusOnEntry: false });
          }
          settingsButton.focus();
          appBarApi.removeAppbarPanel(removalPanelId);

          // eslint-disable-next-line no-await-in-loop -- Removal cases share ownership and must settle before recreating the panel.
          await delay(GVAbstractTester.UI_SCROLL_SETTLE_MS);
          const activeTab = getStoreUIActiveAppBarTab(mapId);
          ownershipChecks.push(
            { source, phase: 'registry removal', actual: appBarApi.getAppBarButtonPanelById(removalPanelId) !== null, expected: false },
            {
              source,
              phase: 'owner after removal',
              actual: getStoreUIFocusItem(mapId).activeElementId,
              expected: superseded ? newerOwnerId : false,
            },
            { source, phase: 'tab cleared', actual: activeTab.tabId, expected: '' },
            { source, phase: 'panel closed', actual: activeTab.isOpen, expected: false },
            { source, phase: 'boundary disabled', actual: activeTab.isFocusTrapped, expected: false },
            { source, phase: 'focus preserved', actual: DomHelper.getActiveElement()?.id, expected: settingsButton.id }
          );
        }
        uiController.enableFocusTrap({ activeElementId: false, callbackElementId: false });
        ownershipChecks.push(
          { source: 'ID builder', phase: 'shell format', actual: buildGVElementId(mapId, 'shell'), expected: `${mapId}-shell` },
          { source: 'ID builder', phase: 'footer format', actual: buildTabId(mapId, 'layers'), expected: `${mapId}-tab-layers` },
          {
            source: 'ID builder',
            phase: 'named AppBar format',
            actual: buildAppBarFocusTrapId(mapId, 'details'),
            expected: `${mapId}-appBar-details-focus-trap`,
          },
          {
            source: 'ID builder',
            phase: 'undefined AppBar ID format',
            actual: buildAppBarFocusTrapId(mapId),
            expected: `${mapId}-appBar-focus-trap`,
          },
          {
            source: 'ID builder',
            phase: 'empty AppBar ID format',
            actual: buildAppBarFocusTrapId(mapId, ''),
            expected: `${mapId}-appBar-focus-trap`,
          }
        );
        const ownerClassificationCases = [
          { id: buildAppBarFocusTrapId(mapId, 'details'), expected: true },
          { id: buildAppBarFocusTrapId(mapId), expected: true },
          { id: buildAppBarFocusTrapId(`${mapId}-other`, 'details'), expected: false },
          { id: buildTabId(mapId, 'layers'), expected: false },
          { id: `${mapId}-appBar-settings-panel-focus`, expected: false },
          { id: `${mapId}-appBar-version-ft`, expected: false },
          { id: false, expected: false },
          { id: undefined, expected: false },
        ] as const;
        ownerClassificationCases.forEach(({ id, expected }): void => {
          ownershipChecks.push({
            source: 'ID classifier',
            phase: `classifying ${id}`,
            actual: isAppBarFocusTrapId(mapId, id),
            expected,
          });
        });
        const panelOwnerId = buildAppBarFocusTrapId(mapId, 'details');
        const footerOwnerId = buildTabId(mapId, getStoreUIActiveFooterBarTab(mapId).tabId);
        for (const source of ['trigger', 'controller', 'legacy', 'untrapped', 'toggle', 'external-close'] as const) {
          test.addStep(`Checking AppBar ownership through ${source}...`);
          uiController.setActiveAppBarTab('details', false, false);
          uiController.enableFocusTrap({ activeElementId: footerOwnerId, callbackElementId: footerOwnerId, focusOnEntry: false });

          // eslint-disable-next-line no-await-in-loop -- Opening paths share the same panel and must commit before trigger activation.
          await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
          if (source === 'trigger') detailsButton.click();
          else if (source === 'legacy') this.getMapViewer().appBarApi.selectTab('details');
          else uiController.setActiveAppBarTab('details', true, source !== 'untrapped');

          // eslint-disable-next-line no-await-in-loop -- Each opening must finish before testing its dismissal.
          await whenThisThen(
            (): boolean => DomHelper.getActiveElement() === DomHelper.getAppBarPanelCloseButton(mapId, 'details'),
            GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
            GVAbstractTester.UI_POLL_INTERVAL_MS
          );
          ownershipChecks.push({
            source,
            phase: 'acquisition',
            actual: getStoreUIFocusItem(mapId).activeElementId,
            expected: panelOwnerId,
          });
          const closeButton = DomHelper.getAppBarPanelCloseButton(mapId, 'details');
          if (!closeButton) throw new Error('Details close button was not rendered during ownership checks');
          if (source === 'controller') {
            closeButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          } else if (source === 'toggle') detailsButton.click();
          else if (source === 'external-close') uiController.setActiveAppBarTab('details', false, false);
          else closeButton.click();

          // eslint-disable-next-line no-await-in-loop -- Wait for delayed restoration before testing the next opening.
          await delay(TIMEOUT.dataPanelLoading + GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
          ownershipChecks.push(
            { source, phase: 'dismissal owner', actual: getStoreUIFocusItem(mapId).activeElementId, expected: false },
            { source, phase: 'trigger focus return', actual: DomHelper.getActiveElement()?.id, expected: detailsButton.id }
          );
        }

        test.addStep('Closing an AppBar panel underneath Settings without restoring its stale owner...');
        uiController.setActiveAppBarTab('details', true, true);
        await whenThisThen(
          (): boolean => DomHelper.getActiveElement() === DomHelper.getAppBarPanelCloseButton(mapId, 'details'),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        settingsButton.click();
        const settingsOwnerId = `${mapId}-${CONTAINER_TYPE.APP_BAR}-settings-panel-focus`;
        await whenThisThen(
          (): boolean => getStoreUIFocusItem(mapId).activeElementId === settingsOwnerId,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        uiController.setActiveAppBarTab('details', false, false);
        ownershipChecks.push({
          source: 'Settings',
          phase: 'AppBar closed underneath popover',
          actual: getStoreUIFocusItem(mapId).activeElementId,
          expected: settingsOwnerId,
        });
        getSettingsButton()?.click();
        await delay(TIMEOUT.dataPanelLoading + GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        ownershipChecks.push(
          { source: 'Settings', phase: 'stale owner released', actual: getStoreUIFocusItem(mapId).activeElementId, expected: false },
          { source: 'Settings', phase: 'trigger focus return', actual: DomHelper.getActiveElement()?.id, expected: settingsButton.id }
        );

        test.addStep('Preserving a newer owner during API opening and dismissal...');
        const newerOwnerId = `${mapId}-appbar-newer-owner`;
        uiController.enableFocusTrap({ activeElementId: newerOwnerId, callbackElementId: false, focusOnEntry: false });
        settingsButton.focus();
        uiController.setActiveAppBarTab('details', true, true);
        await delay(GVAbstractTester.UI_SCROLL_SETTLE_MS);
        ownershipChecks.push(
          {
            source: 'newer owner',
            phase: 'API open owner preserved',
            actual: getStoreUIFocusItem(mapId).activeElementId,
            expected: newerOwnerId,
          },
          {
            source: 'newer owner',
            phase: 'API open focus preserved',
            actual: DomHelper.getActiveElement()?.id,
            expected: settingsButton.id,
          }
        );
        DomHelper.getAppBarPanelCloseButton(mapId, 'details')?.click();
        await delay(TIMEOUT.dataPanelLoading + GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        ownershipChecks.push(
          {
            source: 'newer owner',
            phase: 'dismissal owner preserved',
            actual: getStoreUIFocusItem(mapId).activeElementId,
            expected: newerOwnerId,
          },
          {
            source: 'newer owner',
            phase: 'dismissal focus preserved',
            actual: DomHelper.getActiveElement()?.id,
            expected: settingsButton.id,
          }
        );
        uiController.enableFocusTrap({ activeElementId: false, callbackElementId: false });

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
          ownershipChecks,
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
        result.ownershipChecks.forEach((check): void => {
          test.addStep(`Verifying ${check.source}: ${check.phase} (expected ${check.expected}, actual ${check.actual})...`);
          Test.assertIsEqual(check.actual, check.expected);
        });
        Test.assertIsEqual(result.actualNewFocusId, result.expectedNewFocusId);
        Test.assertIsEqual(result.crosshairAfterNewOwnerRestore, result.crosshairBeforeNewOwnerRestore);
        Test.assertIsEqual(result.actualReturnFocusId, result.expectedReturnFocusId);
        Test.assertIsEqual(result.actualQueryReturnFocusId, result.expectedQueryReturnFocusId);
        Test.assertIsEqual(result.crosshairAfterQueryClose, true);
      },
      async (): Promise<void> => {
        this.getMapViewer().appBarApi.removeAppbarPanel(removalPanelId);
        uiController.setActiveAppBarTab(
          originalAppBarTab.tabId || undefined,
          originalAppBarTab.isOpen,
          originalAppBarTab.isFocusTrapped ?? false,
          originalAppBarTab.returnFocusToMap ?? false
        );
        await delay(GVAbstractTester.UI_SCROLL_SETTLE_MS);
        uiController.setActiveTrapGeoView(originalKeyboardMode);
        uiController.setCrosshairActive(originalCrosshairActive);
        uiController.enableFocusTrap({ ...originalFocusItem, focusOnEntry: false });
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
    let didStartPreparation = false;

    return this.test(
      'Test WCAG Skip returns focus to the same map',
      async (test): Promise<TypeSkipFocusResult> => {
        const testPanel = DomHelper.getGVRootElement(mapId).closest('.tab-content');
        if (testPanel && (testPanel.getClientRects().length === 0 || window.getComputedStyle(testPanel).visibility !== 'visible')) {
          throw new TestSkippedError('The UI test map is hidden; run the UI Tests tab directly');
        }

        didStartPreparation = true;
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
        if (!didStartPreparation) return;

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

  /**
   * Verifies enabling keyboard navigation focuses an available destination on dynamic and static maps.
   *
   * @returns A promise that resolves with the focus and mode evidence for both interaction types
   */
  testKeyboardEnableFocusDestination(): Promise<Test<TypeKeyboardEnableFocusResult[]>> {
    const scenarios = [
      { interaction: 'dynamic', entrySuffix: 'wcag-toplink', shiftKey: false, expectedSuffix: 'wcag-link-to-map' },
      { interaction: 'static', entrySuffix: 'wcag-toplink', shiftKey: false, expectedSuffix: 'shell' },
      { interaction: 'static', entrySuffix: 'wcag-bottomlink', shiftKey: true, expectedSuffix: 'shell' },
    ] as const;
    const mapIds = scenarios.map(({ interaction }) => `enable-focus-${interaction}-${generateId(8)}`);
    const fixtures = mapIds.map((mapId) => UITester.#createScrollFixture(mapId));
    const originalFocus = DomHelper.getActiveElement();
    const originalScroll = { x: window.scrollX, y: window.scrollY };

    return this.test(
      'Test keyboard navigation Enable focus destination on dynamic and static maps',
      async (test): Promise<TypeKeyboardEnableFocusResult[]> => {
        const results: TypeKeyboardEnableFocusResult[] = [];

        for (let index = 0; index < scenarios.length; index++) {
          const scenario = scenarios[index];
          const mapId = mapIds[index];
          const fixture = fixtures[index];
          test.addStep(`Creating the ${scenario.interaction} map and opening its keyboard-navigation prompt...`);
          document.body.appendChild(fixture);
          // eslint-disable-next-line no-await-in-loop -- Viewer scenarios share browser focus and must run sequentially.
          await this.#createScrollViewer(mapId, 'visible', scenario.interaction);

          // eslint-disable-next-line no-await-in-loop -- Wait for this viewer's entry link before transferring shared focus.
          const entryLink = await whenThisThen(
            (): HTMLElement | undefined => DomHelper.getGVElementById<HTMLElement>(mapId, scenario.entrySuffix),
            GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
            GVAbstractTester.UI_POLL_INTERVAL_MS
          );
          if (!entryLink) throw new Error(`WCAG entry skip link was not rendered for ${scenario.interaction} map '${mapId}'`);

          const expectedDestination = DomHelper.getGVElementById<HTMLElement>(mapId, scenario.expectedSuffix);
          if (!expectedDestination) throw new Error(`Expected keyboard-navigation focus destination was not rendered for '${mapId}'`);

          entryLink.focus();
          entryLink.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', shiftKey: scenario.shiftKey, bubbles: true, cancelable: true })
          );

          // eslint-disable-next-line no-await-in-loop -- The current prompt must open before the next focus action.
          const enableButton = await whenThisThen(
            (): HTMLButtonElement | undefined => DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'enable-focus'),
            GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
            GVAbstractTester.UI_POLL_INTERVAL_MS
          );
          if (!enableButton) throw new Error(`Keyboard-navigation Enable button was not rendered for '${mapId}'`);

          test.addStep(`Enabling keyboard navigation on the ${scenario.interaction} map...`);
          enableButton.click();
          // eslint-disable-next-line no-await-in-loop -- Finish this viewer's focus transfer before starting another scenario.
          await whenThisThen(
            (): boolean =>
              getStoreUIActiveTrapGeoView(mapId) &&
              DomHelper.getGVElementById(mapId, 'enable-focus') === undefined &&
              DomHelper.getActiveElement() === expectedDestination,
            GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
            GVAbstractTester.UI_POLL_INTERVAL_MS
          );

          const actualFocusId = DomHelper.getActiveElement()?.id ?? '';
          const shell = DomHelper.getShellElement(mapId);
          if (!shell) throw new Error(`Keyboard-navigation shell was not rendered for '${mapId}'`);
          let reverseTabContained = true;
          if (scenario.interaction === 'static') {
            test.addStep('Checking that Shift+Tab from the static entry destination stays inside the viewer...');
            const reverseTab = new KeyboardEvent('keydown', {
              key: 'Tab',
              code: 'Tab',
              shiftKey: true,
              bubbles: true,
              cancelable: true,
            });
            const tabbable = DomHelper.getGVVisibleTabbable(mapId, shell);
            const lastTabbable = tabbable.at(-1);
            if (!lastTabbable) throw new Error(`Static viewer '${mapId}' has no visible keyboard destination`);

            expectedDestination.dispatchEvent(reverseTab);

            // Synthetic key events do not perform native Tab movement; exercise the boundary the browser would reach.
            if (!reverseTab.defaultPrevented) {
              const startBoundary = shell.previousElementSibling;
              if (!(startBoundary instanceof HTMLElement) || !startBoundary.matches('[data-testid="sentinelStart"][tabindex="0"]')) {
                throw new Error(`Static viewer '${mapId}' has no active start boundary`);
              }
              startBoundary.focus();
            }

            // eslint-disable-next-line no-await-in-loop -- Complete this viewer's boundary wrap before checking the next scenario.
            await whenThisThen(
              (): boolean => DomHelper.getActiveElement() === lastTabbable,
              GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
              GVAbstractTester.UI_POLL_INTERVAL_MS
            );
            const reverseTabFocus = DomHelper.getActiveElement();
            reverseTabContained = reverseTabFocus === lastTabbable && shell.contains(reverseTabFocus);
          }

          results.push({
            interaction: scenario.interaction,
            expectedDestinationId: expectedDestination.id,
            actualFocusId,
            keyboardModeEnabled: getStoreUIActiveTrapGeoView(mapId),
            promptClosed: DomHelper.getGVElementById(mapId, 'enable-focus') === undefined,
            entryInsideShell: shell.contains(expectedDestination),
            reverseTabContained,
          });
        }

        return results;
      },
      (test, results): void => {
        test.addStep('Verifying both map types enable keyboard navigation and focus a rendered destination...');
        Test.assertIsEqual(results.length, scenarios.length);
        results.forEach((result, index): void => {
          Test.assertIsEqual(result.interaction, scenarios[index].interaction);
          Test.assertIsEqual(result.actualFocusId, result.expectedDestinationId);
          Test.assertIsEqual(result.keyboardModeEnabled, true);
          Test.assertIsEqual(result.promptClosed, true);
          Test.assertIsEqual(result.entryInsideShell, true);
          Test.assertIsEqual(result.reverseTabContained, true);
        });
      },
      async (): Promise<void> => {
        for (let index = 0; index < mapIds.length; index++) {
          // eslint-disable-next-line no-await-in-loop -- Viewer cleanup must finish before restoring the shared page state.
          await this.#cleanupScrollFixture(mapIds[index], fixtures[index], originalScroll);
        }
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus();
      }
    );
  }

  /**
   * Verifies a Settings mode selection satisfies the fresh-viewer entry guard without opening its dialog.
   *
   * @returns Named mode, prompt and focus evidence from an isolated viewer
   */
  testSettingsModeSatisfiesEntryGuard(): Promise<Test<Record<string, boolean>>> {
    const mapId = `settings-entry-${generateId(8)}`;
    const fixture = UITester.#createScrollFixture(mapId);
    const originalFocus = DomHelper.getActiveElement();
    const originalScroll = { x: window.scrollX, y: window.scrollY };

    return this.test(
      'Test Settings mode selection satisfies the keyboard entry guard',
      async (test): Promise<Record<string, boolean>> => {
        test.addStep('Creating a fresh viewer without opening its entry dialog...');
        document.body.appendChild(fixture);
        await this.#createScrollViewer(mapId, 'visible');
        const settingsButton = await whenThisThen(
          (): HTMLButtonElement | undefined =>
            DomHelper.getGVElementById<HTMLButtonElement>(mapId, `${CONTAINER_TYPE.APP_BAR}-settings-btn`),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!settingsButton) throw new Error(`Settings trigger was not rendered for '${mapId}'`);

        settingsButton.focus();
        const initialTab = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true });
        settingsButton.dispatchEvent(initialTab);
        const checks: Record<string, boolean> = {
          freshGuardActive: initialTab.defaultPrevented && DomHelper.getActiveElement() === DomHelper.getWCAGTopLink(mapId),
          promptInitiallyClosed: DomHelper.getGVElementById(mapId, 'enable-focus') === undefined,
          modeInitiallyDisabled: !getStoreUIActiveTrapGeoView(mapId),
        };

        test.addStep('Opening Settings by pointer and enabling then disabling keyboard navigation...');
        settingsButton.click();
        const settingsSwitch = await whenThisThen(
          (): HTMLInputElement | undefined =>
            DomHelper.getGVElementById<HTMLInputElement>(mapId, `${CONTAINER_TYPE.APP_BAR}-settings-panel-keyboard-navigation`),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!settingsSwitch) throw new Error(`Settings switch was not rendered for '${mapId}'`);
        checks.switchHasSwitchRole = settingsSwitch.getAttribute('role') === 'switch';
        checks.switchHasAccessibleName = Boolean(settingsSwitch.labels?.[0]?.textContent?.trim());
        checks.switchAriaCheckedInitially = settingsSwitch.getAttribute('aria-checked') === String(settingsSwitch.checked);
        await whenThisThen(
          (): boolean => DomHelper.getActiveElement() === settingsSwitch,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        settingsSwitch.click();
        await whenThisThen(
          (): boolean =>
            getStoreUIActiveTrapGeoView(mapId) &&
            settingsSwitch.checked &&
            settingsSwitch.getAttribute('aria-checked') === String(settingsSwitch.checked),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        checks.switchAriaCheckedWhenEnabled = settingsSwitch.getAttribute('aria-checked') === 'true';
        checks.enabledWithoutPrompt =
          DomHelper.getActiveElement() === settingsSwitch && DomHelper.getGVElementById(mapId, 'enable-focus') === undefined;

        settingsSwitch.click();
        await whenThisThen(
          (): boolean =>
            !getStoreUIActiveTrapGeoView(mapId) &&
            !settingsSwitch.checked &&
            settingsSwitch.getAttribute('aria-checked') === String(settingsSwitch.checked),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        checks.switchAriaCheckedWhenDisabled = settingsSwitch.getAttribute('aria-checked') === 'false';
        await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        checks.settingsRemainsOpen = settingsButton.getAttribute('aria-expanded') === 'true';
        checks.switchRetainsFocus = DomHelper.getActiveElement() === settingsSwitch;
        checks.crosshairDisabled = !getStoreAppIsCrosshairsActive(mapId);

        test.addStep('Checking internal Tab and Shift+Tab after the explicit Settings selection...');
        settingsSwitch.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true }));
        checks.settingsTabNotRedirected = DomHelper.getActiveElement() === settingsSwitch;
        settingsSwitch.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
        await whenThisThen(
          (): boolean => settingsButton.getAttribute('aria-expanded') === 'false' && DomHelper.getActiveElement() === settingsButton,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        [false, true].forEach((shiftKey): void => {
          const tab = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', shiftKey, bubbles: true, cancelable: true });
          settingsButton.dispatchEvent(tab);
          checks[shiftKey ? 'reverseTabNotIntercepted' : 'forwardTabNotIntercepted'] =
            !tab.defaultPrevented && DomHelper.getActiveElement() === settingsButton;
        });
        checks.promptRemainsClosed = DomHelper.getGVElementById(mapId, 'enable-focus') === undefined;

        test.addStep('Preserving deliberate entry through the outer skip link...');
        const topLink = DomHelper.getWCAGTopLink(mapId);
        if (!topLink) throw new Error(`WCAG top link was not rendered for '${mapId}'`);
        topLink.focus();
        topLink.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true }));
        await whenThisThen(
          (): boolean => DomHelper.getGVElementById(mapId, 'enable-focus') !== undefined,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        checks.explicitEntryStillPrompts = DomHelper.getGVElementById(mapId, 'enable-focus') !== undefined;
        return checks;
      },
      (test, checks): void => {
        test.addStep('Verifying Settings handles onboarding without changing ordinary entry-link behavior...');
        Object.entries(checks).forEach(([name, passed]): void => {
          test.addStep(`Verifying ${name}`);
          Test.assertIsEqual(passed, true);
        });
      },
      async (): Promise<void> => {
        await this.#cleanupScrollFixture(mapId, fixture, originalScroll);
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus();
      }
    );
  }

  /**
   * Verifies switch markup exposes an accessible name and live checked state for controlled and uncontrolled use.
   *
   * @returns Switch role, label, slot-prop preservation, and checked-state evidence with fixture cleanup
   */
  testSwitchAccessibleMarkup(): Promise<Test<Record<string, boolean>>> {
    const fixture = document.createElement('div');
    const switchIds = { controlled: `switch-controlled-${generateId(8)}`, uncontrolled: `switch-uncontrolled-${generateId(8)}` };
    const inputs: { controlled?: HTMLInputElement; uncontrolled?: HTMLInputElement } = {};
    let cleanupRoot: (() => void) | undefined;

    return this.test(
      'Test Switch accessible markup and checked state',
      async (test): Promise<Record<string, boolean>> => {
        test.addStep('Rendering controlled and uncontrolled switches with caller input slot props...');
        document.body.appendChild(fixture);
        const { createRoot, createElement, react } = window.cgpv.reactUtilities;
        const root = createRoot(fixture);
        cleanupRoot = (): void => root.unmount();

        const SwitchProbe = (): ReactElement => {
          const [controlledChecked, setControlledChecked] = react.useState(false);
          return createElement(
            'div',
            {},
            createElement(Switch, {
              id: switchIds.controlled,
              label: 'Controlled accessibility switch',
              checked: controlledChecked,
              onChange: (_event, checked): void => setControlledChecked(checked),
              slotProps: {
                input: () => ({
                  'aria-checked': true,
                  title: 'function-slot',
                  ref: (element: HTMLInputElement | null): void => {
                    if (element) inputs.controlled = element;
                  },
                }),
              },
            }),
            createElement(Switch, {
              id: switchIds.uncontrolled,
              label: 'Uncontrolled accessibility switch',
              defaultChecked: true,
              slotProps: {
                input: {
                  'aria-checked': false,
                  title: 'object-slot',
                  ref: (element: HTMLInputElement | null): void => {
                    if (element) inputs.uncontrolled = element;
                  },
                },
              },
            })
          );
        };

        root.render(createElement(SwitchProbe));
        await whenThisThen(
          (): boolean => Boolean(inputs.controlled && inputs.uncontrolled),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );

        const controlledInput = inputs.controlled;
        const uncontrolledInput = inputs.uncontrolled;
        if (!controlledInput || !uncontrolledInput) throw new Error('Switch accessibility probes were not rendered');

        const checks: Record<string, boolean> = {
          controlledSwitchRole: controlledInput.getAttribute('role') === 'switch',
          controlledAccessibleName: Boolean(controlledInput.labels?.[0]?.textContent?.trim()),
          controlledInitialAriaChecked: controlledInput.getAttribute('aria-checked') === String(controlledInput.checked),
          controlledFunctionSlotPropsPreserved: controlledInput.title === 'function-slot',
          uncontrolledSwitchRole: uncontrolledInput.getAttribute('role') === 'switch',
          uncontrolledAccessibleName: Boolean(uncontrolledInput.labels?.[0]?.textContent?.trim()),
          uncontrolledInitialAriaChecked: uncontrolledInput.getAttribute('aria-checked') === String(uncontrolledInput.checked),
          uncontrolledObjectSlotPropsPreserved: uncontrolledInput.title === 'object-slot',
        };

        test.addStep('Toggling the controlled and uncontrolled switches and checking their generated aria-checked attributes...');
        controlledInput.click();
        await whenThisThen(
          (): boolean => controlledInput.checked && controlledInput.getAttribute('aria-checked') === 'true',
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        checks.controlledAriaCheckedUpdates = controlledInput.getAttribute('aria-checked') === 'true';

        uncontrolledInput.click();
        await whenThisThen(
          (): boolean => !uncontrolledInput.checked && uncontrolledInput.getAttribute('aria-checked') === 'false',
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        checks.uncontrolledAriaCheckedUpdates = uncontrolledInput.getAttribute('aria-checked') === 'false';
        return checks;
      },
      (test, checks): void => {
        Object.entries(checks).forEach(([name, passed]): void => {
          test.addStep(`Verifying ${name}`);
          Test.assertIsEqual(passed, true);
        });
      },
      (): void => {
        cleanupRoot?.();
        fixture.remove();
      }
    );
  }

  // #endregion PUBLIC METHODS - UI TESTS

  // #region PRIVATE METHODS - MAP SECTION SCROLL

  /**
   * Verifies modal exclusion and navbar API retry through real dialogs in both navigation modes.
   *
   * @param test - The running test receiving scenario steps
   * @param mapId - The isolated viewer
   * @param navbarId - The registered navbar probe
   * @returns Named modal-preservation, rejection, retry, and dismissal evidence
   */
  async #checkModalPopoverExclusion(test: Test, mapId: string, navbarId: string): Promise<Record<string, boolean>> {
    const viewer = this.getApi().getMapViewer(mapId);
    const { uiController, dataTableController } = viewer.controllers;
    viewer.map.renderSync();
    await viewer.waitForMapReady();
    dataTableController.setSelectedFeature({ featureKey: 0, geoviewLayerType: 'GeoJSON', fieldInfo: {}, layerPath: 'modal-probe' });
    const checks: Record<string, boolean> = {};

    for (const keyboardMode of [false, true]) {
      uiController.setActiveTrapGeoView(keyboardMode);
      // eslint-disable-next-line no-await-in-loop -- The trigger handlers must observe the committed navigation mode.
      await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
      for (const modalId of [
        BUILT_IN_MODAL_IDS.EXPORT,
        BUILT_IN_MODAL_IDS.LAYER_DATA_TABLE,
        BUILT_IN_MODAL_IDS.FEATURE_DETAIL_DATA_TABLE,
      ]) {
        const scenario = `${modalId}:${keyboardMode ? 'keyboard' : 'pointer'}`;
        test.addStep(`Rejecting navbar API opening while ${scenario} owns focus...`);
        uiController.enableFocusTrap({ activeElementId: modalId, callbackElementId: false, focusOnEntry: false });
        const entryFocusId = modalId === BUILT_IN_MODAL_IDS.EXPORT ? `${mapId}-export-title-input` : `${modalId}-close-button`;

        // eslint-disable-next-line no-await-in-loop -- Each modal must finish entry focus before its navbar request.
        const dialog = await whenThisThen(
          (): HTMLElement | undefined => {
            const candidate = DomHelper.queryGVSelector<HTMLElement>(mapId, '[role="dialog"][aria-modal="true"]');
            const focused = DomHelper.getActiveElement();
            return focused?.id === entryFocusId && candidate?.contains(focused) ? candidate : undefined;
          },
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        if (!dialog) throw new Error(`Modal '${modalId}' did not finish entry focus`);
        const originalFocus = DomHelper.getActiveElement();
        const originalOwner = getStoreUIFocusItem(mapId);
        const closeVersion = getStoreUIPopoverCloseVersion(mapId);
        viewer.navBarApi.setButtonPanelOpen(navbarId, true);
        // eslint-disable-next-line no-await-in-loop -- Rejection must reset the external request so later retries work.
        await whenThisThen(
          (): boolean => viewer.navBarApi.getNavBarButtonPanelById(navbarId)?.panel?.status === false,
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        checks[`${scenario}:owner-preserved`] = getStoreUIFocusItem(mapId) === originalOwner;
        checks[`${scenario}:dialog-and-focus-preserved`] =
          dialog.isConnected && !!originalFocus && dialog.contains(originalFocus) && DomHelper.getActiveElement() === originalFocus;
        checks[`${scenario}:opening-rejected`] =
          !this.#findOwnershipDialog(mapId, 'navbar') &&
          viewer.navBarApi.getNavBarButtonPanelById(navbarId)?.panel?.status === false &&
          getStoreUIPopoverCloseVersion(mapId) === closeVersion;

        for (const consumer of ['version', 'notifications', 'settings'] as const) {
          const trigger = DomHelper.getGVElementById<HTMLButtonElement>(mapId, `${CONTAINER_TYPE.APP_BAR}-${consumer}-btn`);
          if (!trigger) throw new Error(`Popover trigger '${consumer}' was not rendered`);
          trigger.click();
        }
        // eslint-disable-next-line no-await-in-loop -- All shared trigger consumers must handle a rejected opening without claiming ownership.
        await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        checks[`${scenario}:shared-triggers-rejected`] =
          getStoreUIFocusItem(mapId) === originalOwner &&
          getStoreUIPopoverCloseVersion(mapId) === closeVersion &&
          DomHelper.getActiveElement() === originalFocus &&
          !(['version', 'notifications', 'settings'] as const).some((consumer): boolean => !!this.#findOwnershipDialog(mapId, consumer));

        uiController.closeMapPopovers();
        // eslint-disable-next-line no-await-in-loop -- Settle close effects before checking the newer modal owner.
        await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        checks[`${scenario}:controller-close-preserves-modal`] =
          getStoreUIFocusItem(mapId) === originalOwner && dialog.isConnected && DomHelper.getActiveElement() === originalFocus;
        uiController.disableFocusTrap('no-focus');
        // eslint-disable-next-line no-await-in-loop -- Modal transitions must finish before the retry.
        await whenThisThen((): boolean => !dialog.isConnected, GVAbstractTester.UI_FOCUS_TIMEOUT_MS, GVAbstractTester.UI_POLL_INTERVAL_MS);

        viewer.navBarApi.setButtonPanelOpen(navbarId, true);
        // eslint-disable-next-line no-await-in-loop -- Each retry must open before dismissal.
        await whenThisThen(
          (): boolean => !!this.#findOwnershipDialog(mapId, 'navbar'),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        checks[`${scenario}:retry-opened`] = !!this.#findOwnershipDialog(mapId, 'navbar');
        this.#requirePopoverCloseButton(mapId, 'navbar').click();
        // eslint-disable-next-line no-await-in-loop -- Settle ownership release to detect stale modal resurrection.
        await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        checks[`${scenario}:dismissal-does-not-reopen-modal`] =
          getStoreUIFocusItem(mapId).activeElementId === false &&
          !this.#findOwnershipDialog(mapId, 'navbar') &&
          !DomHelper.queryGVSelector(mapId, '[role="dialog"][aria-modal="true"]');

        viewer.navBarApi.setButtonPanelOpen(navbarId, true);
        // eslint-disable-next-line no-await-in-loop -- Establish an outgoing popover before the modal supersedes it.
        await whenThisThen(
          (): boolean => !!this.#findOwnershipDialog(mapId, 'navbar'),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
        uiController.enableFocusTrap({ activeElementId: modalId, callbackElementId: false, focusOnEntry: false });
        uiController.closeMapPopovers();
        // eslint-disable-next-line no-await-in-loop -- Popover cleanup must not overwrite the newer modal.
        await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
        checks[`${scenario}:newer-modal-survives-popover-cleanup`] = getStoreUIFocusItem(mapId).activeElementId === modalId;
        uiController.disableFocusTrap('no-focus');
        // eslint-disable-next-line no-await-in-loop -- Finish modal cleanup before the next scenario.
        await whenThisThen(
          (): boolean => !DomHelper.queryGVSelector(mapId, '[role="dialog"][aria-modal="true"]'),
          GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
          GVAbstractTester.UI_POLL_INTERVAL_MS
        );
      }
    }
    return checks;
  }

  /**
   * Finds the expected map-scoped dialog by its accessible title, never by DOM order.
   *
   * @param mapId - The isolated viewer
   * @param consumer - The popover whose accessible title is expected
   * @returns The matching dialog, or undefined after it closes
   */
  #findOwnershipDialog(mapId: string, consumer: TypePopoverConsumer): HTMLElement | undefined {
    const language = this.getApi().getMapViewer(mapId).getDisplayLanguage();
    const title = consumer === 'navbar' ? 'Focus ownership probe' : getLocalizedMessage(language, `appbar.${consumer}`);
    const dialogs = DomHelper.getGVRootElement(mapId).querySelectorAll<HTMLElement>('[role="dialog"][aria-labelledby]');
    const matches = Array.from(dialogs).filter((dialog): boolean => {
      const labelIds = dialog.getAttribute('aria-labelledby')?.split(/\s+/) ?? [];
      const accessibleTitle = labelIds.map((id): string => DomHelper.getGVElementByFullId(mapId, id)?.textContent?.trim() ?? '').join(' ');
      return accessibleTitle === title;
    });
    if (matches.length > 1) throw new Error(`Multiple '${title}' dialogs were rendered for '${mapId}'`);
    return matches[0];
  }

  /**
   * Requires the named dialog's translated Close control, allowing unrelated buttons and dialogs.
   *
   * @param mapId - The isolated viewer
   * @param consumer - The popover being dismissed
   * @returns The unique Close button inside the expected dialog
   */
  #requirePopoverCloseButton(mapId: string, consumer: TypePopoverConsumer): HTMLButtonElement {
    const dialog = this.#findOwnershipDialog(mapId, consumer);
    if (!dialog) throw new Error(`Popover dialog was not rendered for '${consumer}'`);
    const language = this.getApi().getMapViewer(mapId).getDisplayLanguage();
    const closeLabel = getLocalizedMessage(language, consumer === 'notifications' ? 'appbar.closeNotificationsDialog' : 'general.close');
    const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button[aria-label]')).filter(
      (button): boolean => button.getAttribute('aria-label') === closeLabel
    );
    if (buttons.length !== 1) throw new Error(`Expected one '${closeLabel}' button in the '${consumer}' dialog; found ${buttons.length}`);
    return buttons[0];
  }

  /**
   * Exercises the real ownership hook with deliberately colliding owner IDs, independent of DOM ID generation.
   *
   * @param test - The running test receiving registry scenario steps
   * @param mapIds - Two live viewers supplying real store and controller contexts
   * @param fixture - The host for disposable React roots
   * @returns Named isolation, flattening, cleanup, and fresh-snapshot evidence
   */
  async #checkPopoverRegistryBoundaries(test: Test, mapIds: [string, string], fixture: HTMLElement): Promise<Record<string, boolean>> {
    const { createRoot, createElement, react } = window.cgpv.reactUtilities;
    const handles = new Map<string, ReturnType<typeof usePopoverFocusOwner>>();
    const closeCounts = new Map<string, number>();
    const ownerIds = ['registry-popover-a', 'registry-popover-b', 'registry-popover-c'];
    const roots = mapIds.map((mapId) => {
      const host = document.createElement('div');
      fixture.appendChild(host);
      return { mapId, host, root: createRoot(host) };
    });
    const checks: Record<string, boolean> = {};

    /** Exposes committed hook operations without introducing map-specific owner IDs. */
    const OwnershipProbe = ({ mapId, ownerId }: { mapId: string; ownerId: string }): ReactElement => {
      logger.logTraceRender('UI-TESTER - ownership registry probe', mapId, ownerId);
      const key = `${mapId}:${ownerId}`;
      const operations = usePopoverFocusOwner(ownerId, undefined, (): void => {
        closeCounts.set(key, (closeCounts.get(key) ?? 0) + 1);
      });
      react.useEffect((): (() => void) => {
        logger.logTraceUseEffect('UI-TESTER - register ownership probe', key, operations);
        handles.set(key, operations);
        return (): void => {
          handles.delete(key);
        };
      }, [key, operations]);
      return createElement('span', {}, ownerId);
    };

    /** Commits a selected set of probes under the viewer's actual contexts. */
    const renderProbes = async (index: number, ids: string[]): Promise<void> => {
      const { mapId, root } = roots[index];
      root.render(
        createElement(
          StoreContext.Provider,
          { value: mapId },
          createElement(
            ControllerContext.Provider,
            { value: this.getApi().getMapViewer(mapId).controllers },
            ...ids.map((ownerId): ReactElement => createElement(OwnershipProbe, { key: ownerId, mapId, ownerId }))
          )
        )
      );
      await whenThisThen(
        (): boolean => ownerIds.every((id) => handles.has(`${mapId}:${id}`) === ids.includes(id)),
        GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
        GVAbstractTester.UI_POLL_INTERVAL_MS
      );
    };

    /** Resolves a committed probe or fails with the missing map and owner. */
    const probe = (mapId: string, ownerId: string): ReturnType<typeof usePopoverFocusOwner> => {
      const operations = handles.get(`${mapId}:${ownerId}`);
      if (!operations) throw new Error(`Ownership probe '${ownerId}' was not mounted for '${mapId}'`);
      return operations;
    };

    try {
      test.addStep('Mounting identical popover owner IDs in two independent map contexts...');
      for (const mapId of mapIds) this.getApi().getMapViewer(mapId).controllers.uiController.closeMapPopovers();
      await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
      await renderProbes(0, ownerIds);
      await renderProbes(1, ownerIds);
      for (const mapId of mapIds) {
        this.getApi()
          .getMapViewer(mapId)
          .controllers.uiController.enableFocusTrap({
            activeElementId: `${mapId}-underlying`,
            callbackElementId: false,
            focusOnEntry: false,
          });
        probe(mapId, ownerIds[0]).claimFocusOwner();
      }
      for (const mapId of mapIds) {
        checks[`${mapId}:same-owner-id-isolation`] = getPopoverReturnFocusItem(mapId).activeElementId === `${mapId}-underlying`;
      }

      for (let index = 0; index < mapIds.length; index++) {
        const mapId = mapIds[index];
        const { uiController } = this.getApi().getMapViewer(mapId).controllers;
        const [a, b, c] = ownerIds;
        test.addStep(`Checking A -> B -> C replacement and cleanup on '${mapId}'...`);
        probe(mapId, b).claimFocusOwner();
        probe(mapId, a).synchronizeOwnership(true, true);
        probe(mapId, c).claimFocusOwner();
        probe(mapId, b).synchronizeOwnership(true, true);
        checks[`${mapId}:chain-flattened`] = getPopoverReturnFocusItem(mapId).activeElementId === `${mapId}-underlying`;
        probe(mapId, c).releaseFocusOwner();
        checks[`${mapId}:chain-restored`] = getStoreUIFocusItem(mapId).activeElementId === `${mapId}-underlying`;

        for (const [path, ownerId] of [
          ['release', c],
          ['yield', a],
          ['unmount', b],
        ] as const) {
          if (path === 'unmount') {
            probe(mapId, ownerId).claimFocusOwner();
            // eslint-disable-next-line no-await-in-loop -- Commit removal before probing its former registry entry.
            await renderProbes(
              index,
              ownerIds.filter((id): boolean => id !== ownerId)
            );
          }
          uiController.enableFocusTrap({ activeElementId: ownerId, callbackElementId: false, focusOnEntry: false });
          checks[`${mapId}:${path}-snapshot-removed`] =
            getPopoverReturnFocusItem(mapId).activeElementId === ownerId &&
            (path !== 'yield' || closeCounts.get(`${mapId}:${ownerId}`) === 1);
          if (path === 'unmount') {
            // eslint-disable-next-line no-await-in-loop -- Remount before verifying fresh snapshot capture.
            await renderProbes(index, ownerIds);
          }
          const freshOwner = `${mapId}-fresh-${path}`;
          uiController.enableFocusTrap({ activeElementId: freshOwner, callbackElementId: false, focusOnEntry: false });
          probe(mapId, ownerId).claimFocusOwner();
          probe(mapId, ownerId).releaseFocusOwner();
          checks[`${mapId}:${path}-fresh-snapshot`] = getStoreUIFocusItem(mapId).activeElementId === freshOwner;
        }
        checks[`${mapId}:other-map-unaffected`] =
          index === 0
            ? getStoreUIFocusItem(mapIds[1]).activeElementId === a &&
              getPopoverReturnFocusItem(mapIds[1]).activeElementId === `${mapIds[1]}-underlying`
            : getStoreUIFocusItem(mapIds[0]).activeElementId === `${mapIds[0]}-fresh-unmount`;
      }

      test.addStep('Checking selected, expanded, existing footer owners before popover release...');
      const mapId = mapIds[0];
      const { uiController } = this.getApi().getMapViewer(mapId).controllers;
      const customTab = 'popover-owner-test';
      for (const scenario of ['valid', 'switched', 'collapsed', 'cleared', 'removed', 'hidden', 'missing', 'guide'] as const) {
        let tabId = customTab;
        if (scenario === 'guide') tabId = 'guide';
        if (scenario === 'missing') tabId = 'missing-tab';
        uiController.addFooterTab({ id: customTab });
        uiController.showTabButton(tabId);
        uiController.setActiveFooterBarTab(tabId);
        uiController.setFooterBarIsOpen(true);
        const footerOwner = buildTabId(mapId, tabId);
        uiController.enableFocusTrap({ activeElementId: footerOwner, callbackElementId: footerOwner, focusOnEntry: false });
        probe(mapId, ownerIds[0]).claimFocusOwner();
        if (scenario === 'switched') uiController.setActiveFooterBarTab('layers');
        if (scenario === 'collapsed') uiController.setFooterBarIsOpen(false);
        if (scenario === 'cleared') uiController.setActiveFooterBarTab(undefined);
        if (scenario === 'removed') uiController.removeFooterTab(customTab);
        if (scenario === 'hidden') uiController.hideTabButton(customTab);
        probe(mapId, ownerIds[0]).releaseFocusOwner();
        checks[`${mapId}:footer-${scenario}`] =
          getStoreUIFocusItem(mapId).activeElementId === (scenario === 'valid' || scenario === 'guide' ? footerOwner : false);
      }
      uiController.removeFooterTab(customTab);
      uiController.showTabButton(customTab);
      uiController.setActiveFooterBarTab('layers');
      uiController.setFooterBarIsOpen(true);
      return checks;
    } finally {
      for (const { mapId, root, host } of roots) {
        root.unmount();
        host.remove();
        this.getApi().getMapViewer(mapId).controllers.uiController.enableFocusTrap({
          activeElementId: false,
          callbackElementId: false,
          focusOnEntry: false,
        });
      }
    }
  }

  /**
   * Completes off-screen map initialization before ownership setup or destruction.
   *
   * @param mapId - The isolated viewer, which may have just returned from fast creation
   * @returns A promise that resolves after the map and its initial UI effects are ready
   */
  async #waitForPopoverViewerReady(mapId: string): Promise<void> {
    const viewer = this.getApi().getMapViewer(mapId);
    await whenThisThen((): boolean => !!viewer.map, GVAbstractTester.UI_FOCUS_TIMEOUT_MS, GVAbstractTester.UI_POLL_INTERVAL_MS);
    viewer.map.renderSync();
    await viewer.waitForMapReady();
  }

  /**
   * Destroys viewers with active popovers, reuses their map ID, and checks a surviving map's snapshot.
   *
   * @param test - The running test receiving lifecycle steps
   * @param mapId - The surviving viewer whose ownership must remain unchanged
   * @param fixture - The host for the second viewer, removed by the test finalizer even on failure
   * @returns Snapshot isolation and same-ID recreation evidence for About and navbar destruction
   */
  async #checkPopoverStoreLifecycle(
    test: Test,
    mapId: string,
    fixture: HTMLElement
  ): Promise<{ lifecycleChecks: boolean[]; registryChecks: Record<string, boolean> }> {
    const lifecycleMapId = `${mapId}-lifecycle`;
    const target = document.createElement('div');
    target.id = lifecycleMapId;
    fixture.appendChild(target);
    await this.#createScrollViewer(lifecycleMapId, 'visible');
    await this.#waitForPopoverViewerReady(lifecycleMapId);
    const registryChecks = await this.#checkPopoverRegistryBoundaries(test, [mapId, lifecycleMapId], fixture);
    const survivor = this.getApi().getMapViewer(mapId).controllers.uiController;
    const footerOwnerId = buildTabId(mapId, 'layers');
    survivor.enableFocusTrap({ activeElementId: footerOwnerId, callbackElementId: footerOwnerId, focusOnEntry: false });
    const aboutButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, `${CONTAINER_TYPE.APP_BAR}-version-btn`);
    if (!aboutButton) throw new Error('Surviving About trigger was not rendered for the lifecycle test');
    aboutButton.click();
    await whenThisThen(
      (): boolean => getStoreUIFocusItem(mapId).activeElementId === DomHelper.buildAppBarVersionFocusTrapId(mapId),
      GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
      GVAbstractTester.UI_POLL_INTERVAL_MS
    );
    const checks: boolean[] = [];

    for (const consumer of ['version', 'navbar'] as const) {
      test.addStep(`Deleting a viewer with active ${consumer} ownership and recreating the same map ID...`);
      const viewer = this.getApi().getMapViewer(lifecycleMapId);
      const originalStore = getGeoViewStore(lifecycleMapId);
      const navbarId = `${lifecycleMapId}-probe`;
      const ownerId =
        consumer === 'version'
          ? DomHelper.buildAppBarVersionFocusTrapId(lifecycleMapId)
          : `${lifecycleMapId}-${navbarId}-navbar-focus-trap`;
      if (consumer === 'navbar') {
        viewer.navBarApi.createNavbarButtonPanel(
          { id: navbarId, 'aria-label': 'Lifecycle probe', children: 'Probe' },
          { title: 'Lifecycle probe', content: 'Lifecycle probe', icon: 'Probe', status: false },
          'default'
        );
      }
      const buttonSuffix = consumer === 'navbar' ? 'probe' : `${CONTAINER_TYPE.APP_BAR}-version-btn`;
      // eslint-disable-next-line no-await-in-loop -- Mount the closed popover before establishing its previous owner.
      const button = await whenThisThen(
        (): HTMLButtonElement | undefined => DomHelper.getGVElementById<HTMLButtonElement>(lifecycleMapId, buttonSuffix),
        GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
        GVAbstractTester.UI_POLL_INTERVAL_MS
      );
      if (!button) throw new Error(`Lifecycle ${consumer} trigger was not rendered`);
      viewer.controllers.uiController.setActiveTrapGeoView(true);
      // eslint-disable-next-line no-await-in-loop -- Commit keyboard mode before clicking a trigger whose handler captures that mode.
      await delay(GVAbstractTester.UI_FOCUS_RESTORE_BUFFER_MS);
      viewer.controllers.uiController.enableFocusTrap({
        activeElementId: buildTabId(lifecycleMapId, 'layers'),
        callbackElementId: false,
        focusOnEntry: false,
      });
      if (consumer === 'navbar') viewer.navBarApi.setButtonPanelOpen(navbarId, true);
      else button.click();
      // eslint-disable-next-line no-await-in-loop -- Delete only after the popover has registered its snapshot.
      await whenThisThen(
        (): boolean => getStoreUIFocusItem(lifecycleMapId).activeElementId === ownerId,
        GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
        GVAbstractTester.UI_POLL_INTERVAL_MS
      );
      checks.push(getPopoverReturnFocusItem(lifecycleMapId).activeElementId === `${lifecycleMapId}-tab-layers`);
      // eslint-disable-next-line no-await-in-loop -- Destruction while the popover is active is the operation under test.
      await this.getApi().deleteMapViewer(lifecycleMapId, false);
      checks.push(
        getStoreUIFocusItem(mapId).activeElementId === DomHelper.buildAppBarVersionFocusTrapId(mapId) &&
          getPopoverReturnFocusItem(mapId).activeElementId === footerOwnerId
      );
      // eslint-disable-next-line no-await-in-loop -- Reuse the same target only after its old viewer is fully removed.
      await this.#createScrollViewer(lifecycleMapId, 'visible');
      // eslint-disable-next-line no-await-in-loop -- Initial UI effects must settle before probing ownership or starting the next case.
      await this.#waitForPopoverViewerReady(lifecycleMapId);
      checks.push(getGeoViewStore(lifecycleMapId) !== originalStore && getStoreUIFocusItem(lifecycleMapId).activeElementId === false);

      // Probe the old owner ID directly: a new store must not resolve it through the destroyed store's snapshot.
      this.getApi().getMapViewer(lifecycleMapId).controllers.uiController.enableFocusTrap({
        activeElementId: ownerId,
        callbackElementId: false,
        focusOnEntry: false,
      });
      checks.push(getPopoverReturnFocusItem(lifecycleMapId).activeElementId === ownerId);
    }
    return { lifecycleChecks: checks, registryChecks };
  }

  /**
   * Replaces About with an API-opened navbar and verifies that closed popovers never become return owners.
   *
   * @param test - The running test receiving scenario steps
   * @param mapId - The isolated viewer
   * @param navbarId - The registered navbar probe
   * @param navbarOwnerId - The navbar's focus owner
   * @param footerOwnerId - The still-open footer's focus owner
   * @returns Ownership and outgoing-dialog closure evidence for each replacement
   */
  async #checkNavbarPopoverHandoff(
    test: Test,
    mapId: string,
    navbarId: string,
    navbarOwnerId: string,
    footerOwnerId: string
  ): Promise<boolean[]> {
    const viewer = this.getApi().getMapViewer(mapId);
    const { uiController } = viewer.controllers;
    const aboutButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, `${CONTAINER_TYPE.APP_BAR}-version-btn`);
    if (!aboutButton) throw new Error('About trigger was not rendered for the navbar handoff test');
    const checks: boolean[] = [];

    for (const scenario of ['footer', 'unowned', 'superseded'] as const) {
      test.addStep(`Replacing About with an API-opened navbar (${scenario})...`);
      uiController.enableFocusTrap({
        activeElementId: scenario === 'unowned' ? false : footerOwnerId,
        callbackElementId: scenario === 'unowned' ? false : footerOwnerId,
        focusOnEntry: false,
      });
      aboutButton.click();
      // eslint-disable-next-line no-await-in-loop -- About must acquire ownership before the API replaces it.
      await whenThisThen(
        (): boolean => getStoreUIFocusItem(mapId).activeElementId === DomHelper.buildAppBarVersionFocusTrapId(mapId),
        GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
        GVAbstractTester.UI_POLL_INTERVAL_MS
      );
      viewer.navBarApi.setButtonPanelOpen(navbarId, true);
      // eslint-disable-next-line no-await-in-loop -- Wait for the replacement's ownership before dismissing it.
      await whenThisThen(
        (): boolean => getStoreUIFocusItem(mapId).activeElementId === navbarOwnerId,
        GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
        GVAbstractTester.UI_POLL_INTERVAL_MS
      );
      checks.push(DomHelper.getGVElementById(mapId, `${CONTAINER_TYPE.APP_BAR}-version-title`) === undefined);
      const closeButton = this.#requirePopoverCloseButton(mapId, 'navbar');
      if (scenario === 'superseded') {
        uiController.enableFocusTrap({ activeElementId: `${mapId}-handoff-new-owner`, callbackElementId: false, focusOnEntry: false });
      }
      closeButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
      // eslint-disable-next-line no-await-in-loop -- Settle close effects before testing the restored owner or opening About again.
      await whenThisThen(
        (): boolean => !this.#findOwnershipDialog(mapId, 'navbar'),
        GVAbstractTester.UI_FOCUS_TIMEOUT_MS,
        GVAbstractTester.UI_POLL_INTERVAL_MS
      );
      let expectedOwner: string | false = footerOwnerId;
      if (scenario === 'unowned') expectedOwner = false;
      if (scenario === 'superseded') expectedOwner = `${mapId}-handoff-new-owner`;
      checks.push(getStoreUIFocusItem(mapId).activeElementId === expectedOwner);
    }
    return checks;
  }

  /**
   * Renders the isolated viewer with app-bar, map-info and footer controls.
   *
   * @param mapId - The isolated viewer ID
   * @param scenario - The viewport regression, which selects the viewer height
   * @param interaction - Whether the viewer supports dynamic interaction
   * @returns A promise that resolves once the viewer is created
   */
  async #createScrollViewer(mapId: string, scenario: TypeScrollScenario, interaction: 'dynamic' | 'static' = 'dynamic'): Promise<void> {
    // The oversized scenario needs a map taller than the viewport; the others must fit inside it
    const height = Math.round(window.innerHeight * (scenario === 'oversized' ? 1.5 : 0.7));

    // Layer-free map with one app-bar tab and two footer tabs: just enough controls to drive the delegated scrolling
    await this.getApi().createMapFromConfigFast(
      mapId,
      JSON.stringify({
        map: {
          interaction,
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
  ownerDuringFooterSwitch: string | false;
  ownerAfterFooterSwitch: string | false;
  ownerAfterAppBarOpen: string | false;
  expectedAppBarOwner: string;
  externalCloseOwner: string | false;
  externalCloseFocusPreserved: boolean;
  yieldedOwner: string | false;
  expectedNewOwner: string;
  focusPreserved: boolean;
  unmountChecks: boolean[];
  /** Outgoing About closure and valid return ownership for navbar replacement scenarios. */
  handoffChecks: boolean[];
  /** Export and both data-table modals reject navbar opens, preserve focus, and permit a clean retry. */
  modalChecks: Record<string, boolean>;
  /** Active-popover destruction, same-ID recreation, and surviving-map snapshot isolation. */
  lifecycleChecks: boolean[];
  /** Named checks for colliding owner IDs, three-popover flattening, and stale-record removal. */
  registryChecks: Record<string, boolean>;
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

/** Mode and focus evidence after enabling keyboard navigation on dynamic and static maps. */
type TypeKeyboardEnableFocusResult = {
  /** Map interaction type exercised by the test. */
  interaction: 'dynamic' | 'static';
  /** Expected destination's DOM id. */
  expectedDestinationId: string;
  /** Actual focused element's DOM id after enabling. */
  actualFocusId: string;
  /** Whether keyboard navigation mode activated. */
  keyboardModeEnabled: boolean;
  /** Whether the entry prompt closed. */
  promptClosed: boolean;
  /** Whether entry focus is within the viewer's keyboard boundary, rather than an outer skip link. */
  entryInsideShell: boolean;
  /** Whether the static shell intercepts reverse Tab and keeps focus inside the viewer. */
  reverseTabContained: boolean;
};

/** Captured ownership evidence with enough context to identify a failing transition. */
type TypeOwnershipCheck = {
  /** Opening path or scenario under test. */
  source: string;
  /** Ownership or focus transition being verified. */
  phase: string;
  /** Captured owner or focused element identifier. */
  actual: string | boolean | undefined;
  /** Required owner or focused element identifier. */
  expected: string | boolean;
};

/** Expected and actual focus targets for AppBar focus restoration. */
type TypeAppBarFocusRestoreResult = {
  /** Trigger/API acquisition, dismissal, and superseding-owner checks. */
  ownershipChecks: TypeOwnershipCheck[];
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
