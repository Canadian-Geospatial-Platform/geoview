import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';

import { TestConstants } from './constants';
import { TestError, TestSkippedError } from '../core/exceptions';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { A11yEntryTester } from './a11y-entry-tester';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { delay, getFullscreenElement, whenThisThen } from 'geoview-core/core/utils/utilities';
import { TIMEOUT } from 'geoview-core/core/utils/constant';
import {
  getStoreUIActiveAppBarTab,
  getStoreUIActiveFooterBarTab,
  getStoreUIActiveTrapGeoView,
  getStoreUIFocusItem,
} from 'geoview-core/core/stores/states/ui-state';
import { getStoreAppIsCrosshairsActive } from 'geoview-core/core/stores/states/app-state';
import { getStoreLayerSelectedLayerPath } from 'geoview-core/core/stores/states/layer-state';
import { getStoreDetailsCurrentFeatureIndex, getStoreDetailsSelectedLayerPath } from 'geoview-core/core/stores/states/feature-info-state';
import { getStoreMapPointerPosition, setStoreMapPointerPosition } from 'geoview-core/core/stores/states/map-state';
import type { FeatureInfoLayerSet, QueryEndedEvent } from 'geoview-core/geo/layer/layer-sets/feature-info-layer-set';

/** The polygon fixture extent that returns multiple features for navigation checks. */
const MULTI_FEATURE_QUERY_EXTENT: Extent = [-88.5, 52.2, -85.5, 52.8];
/** The settling time for modal focus enforcement and restoration. */
const MODAL_FOCUS_SETTLE_MS = 300;

/**
 * Tests keyboard accessibility and cross-panel user interactions.
 */
export class A11yUxTester extends GVAbstractTester {
  // #region OVERRIDES

  /**
   * Returns the name of the tester.
   *
   * @returns The tester name
   */
  override getName(): string {
    return 'A11yUxTester';
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Tests navbar panel ownership and Escape focus return for two built-in controls.
   *
   * @returns A promise that resolves with the panel ownership and focus observations
   */
  testNavbarPanelFocusOwnership(): Promise<Test<TypeNavbarPanelFocusResult[]>> {
    const mapId = this.getMapId();
    const { uiController } = this.getControllersRegistry();

    // Preserve the viewer's focus ownership so the next test sees the original state.
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalFocus = DomHelper.getActiveElement();

    return this.test(
      'Test navbar panel ownership and Escape focus return',
      async (test): Promise<TypeNavbarPanelFocusResult[]> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const basemap = DomHelper.queryGVSelector<HTMLButtonElement>(mapId, 'button[aria-label="Change basemap"]');
        const rotation = DomHelper.queryGVSelector<HTMLButtonElement>(mapId, 'button[aria-label="Map Rotation"]');
        if (!basemap || !rotation) throw new TestError('The basemap and rotation navbar controls must be mounted');

        uiController.closeMapPopovers();
        uiController.setActiveTrapGeoView(true);
        await DomHelper.waitForReactIdle();

        /** Activates a panel and dismisses it from its close control. */
        const openAndEscape = async (button: HTMLButtonElement): Promise<TypeNavbarPanelFocusResult> => {
          /** Finds the visible navbar panel Close button. */
          const getVisibleClose = (): HTMLButtonElement | undefined =>
            DomHelper.queryGVSelectorAll<HTMLButtonElement>(mapId, '[role="dialog"] .buttonPopperClose').find((element) =>
              element.checkVisibility({ visibilityProperty: true })
            );

          // Synthetic Enter does not perform the browser's click default.
          button.focus();
          const allowed = button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
          if (allowed) button.click();
          button.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true, cancelable: true }));
          await DomHelper.waitForReactIdle();

          const focusItem = getStoreUIFocusItem(mapId);
          const opened = button.getAttribute('aria-expanded') === 'true';
          const close = getVisibleClose();
          if (!close) throw new TestError('The open navbar panel must expose its Close button');

          // Release and reacquire keyboard ownership without replacing the open panel.
          uiController.setActiveTrapGeoView(false);
          await DomHelper.waitForReactIdle();
          const originalClose = getVisibleClose();
          if (!originalClose) throw new TestError('The navbar panel must remain mounted without keyboard ownership');
          const stayedOpenOnRelease = button.getAttribute('aria-expanded') === 'true';
          uiController.setActiveTrapGeoView(true);
          await DomHelper.waitForReactIdle();
          const acquiredClose = getVisibleClose();
          if (!acquiredClose) throw new TestError('The navbar panel must remain mounted after acquiring keyboard ownership');
          const reacquiredOwnership = getStoreUIFocusItem(mapId).activeElementId === focusItem.activeElementId;
          const preservedOnAcquire = originalClose.isConnected && originalClose === acquiredClose;
          uiController.setActiveTrapGeoView(false);
          await DomHelper.waitForReactIdle();
          const releasedClose = getVisibleClose();
          const preservedOnRelease = acquiredClose.isConnected && acquiredClose === releasedClose;
          uiController.setActiveTrapGeoView(true);
          await DomHelper.waitForReactIdle();
          const currentClose = getVisibleClose();
          if (!currentClose) throw new TestError('The reopened focus trap must expose its Close button');
          currentClose.focus();
          currentClose.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          await DomHelper.waitForReactIdle();

          return {
            buttonId: button.id,
            ownerId: focusItem.activeElementId,
            callbackId: focusItem.callbackElementId,
            opened,
            reacquiredOwnership,
            preservedOnAcquire,
            preservedOnRelease,
            stayedOpenOnRelease,
            closed: button.getAttribute('aria-expanded') === 'false',
            focusReturned: DomHelper.getActiveElement() === button,
          };
        };

        test.addStep('Opening Basemap and dismissing it with Escape...');
        const basemapResult = await openAndEscape(basemap);
        test.addStep('Opening Rotation and dismissing it with Escape...');
        const rotationResult = await openAndEscape(rotation);
        return [basemapResult, rotationResult];
      },
      (test, result): void => {
        test.addStep('Verifying distinct owners and callbacks for the two navbar buttons...');
        Test.assertIsNotEqual(result[0].ownerId, result[1].ownerId);
        test.addStep('Verifying panel content survives ownership changes...');
        result.forEach((panel): void => {
          Test.assertIsNotEqual(panel.buttonId, '');
          Test.assertIsNotEqual(panel.ownerId, false);
          Test.assertIsEqual(panel.callbackId, panel.buttonId);
          Test.assertIsEqual(panel.opened, true);
          Test.assertIsEqual(panel.reacquiredOwnership, true);
          Test.assertIsEqual(panel.preservedOnAcquire, true);
          Test.assertIsEqual(panel.preservedOnRelease, true);
          Test.assertIsEqual(panel.stayedOpenOnRelease, true);
          Test.assertIsEqual(panel.closed, true);
          Test.assertIsEqual(panel.focusReturned, true);
        });
      },
      async (test): Promise<void> => {
        if (test.getStatus() === 'skipped') return;
        uiController.closeMapPopovers();
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap({ ...originalFocusItem, focusOnEntry: false });
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus();
      }
    );
  }

  /**
   * Tests footer focus ownership through Exit, collapse, and reopening.
   *
   * @param input - The dispatched activation method
   * @returns A promise that resolves with footer focus and ownership observations
   */
  testFooterPanelReopensWithFocus(input: 'keyboard' | 'pointer'): Promise<Test<TypeFooterPanelReopenResult>> {
    const mapId = this.getMapId();
    const { uiController } = this.getControllersRegistry();
    const view = DomHelper.getGVRootElement(mapId).ownerDocument.defaultView;

    // Preserve page and viewer state before exercising both activation methods.
    const originalScroll = view ? { x: view.scrollX, y: view.scrollY } : undefined;
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const originalFooter = getStoreUIActiveFooterBarTab(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalFocus = DomHelper.getActiveElement();
    const originalCrosshair = getStoreAppIsCrosshairsActive(mapId);

    return this.test(
      `Test footer Exit, collapse, and reopen focus with ${input} activation`,
      async (test): Promise<TypeFooterPanelReopenResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const tab = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'tab-data-table');
        if (!tab) throw new TestError('The existing Data Table footer tab must be mounted');

        // Begin with no panel or focus trap competing for the footer.
        uiController.closeMapPopovers();
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(undefined, false, false);
        uiController.setActiveFooterBarTab(undefined, false);
        uiController.setFooterBarIsOpen(false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(true);
        await DomHelper.waitForReactIdle();
        tab.focus();

        /** Dispatches activation and supplies only the browser defaults synthetic events do not perform. */
        const activate = async (control: HTMLButtonElement, key: 'Enter' | ' ' = 'Enter'): Promise<void> => {
          if (input === 'pointer') {
            control.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'mouse' }));
            if (control.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))) control.focus();
            control.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: 'mouse' }));
            control.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
            control.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
          } else {
            const keyDownAllowed = control.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
            if (key === 'Enter' && keyDownAllowed) control.click();
            const keyUpAllowed = control.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
            if (key === ' ' && keyDownAllowed && keyUpAllowed) control.click();
          }
          await DomHelper.waitForReactIdle();
        };

        test.addStep('Opening the existing footer and checking its first Exit focus...');
        await activate(tab);
        const exit = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'footerBar-data-table-panel-close-btn');
        if (!exit) throw new TestError('The open Data Table footer must expose Exit');
        const initialExitFocused = DomHelper.getActiveElement() === exit;

        test.addStep('Activating Exit without collapsing the footer...');
        await activate(exit, ' ');
        const exitReturnedFocus = DomHelper.getActiveElement() === tab;
        const exitKeptPanelOpen = getStoreUIActiveFooterBarTab(mapId).isOpen;
        const exitReleasedOwnership = getStoreUIFocusItem(mapId).activeElementId === false;

        test.addStep('Collapsing the footer and checking that it releases ownership...');
        await activate(tab);
        const collapsed = !getStoreUIActiveFooterBarTab(mapId).isOpen;
        const collapseReleasedOwnership = getStoreUIFocusItem(mapId).activeElementId === false;

        test.addStep('Reopening the footer and checking Exit focus and ownership...');
        await activate(tab, ' ');
        return {
          initialExitFocused,
          exitReturnedFocus,
          exitKeptPanelOpen,
          exitReleasedOwnership,
          collapsed,
          collapseReleasedOwnership,
          reopened: getStoreUIActiveFooterBarTab(mapId).isOpen,
          reopenExitFocused: DomHelper.getActiveElement() === exit,
          reopenOwnsFocus: getStoreUIFocusItem(mapId).activeElementId === tab.id,
        };
      },
      (test, result): void => {
        test.addStep('Verifying initial entry and Exit preserve the expected footer behavior...');
        Test.assertIsEqual(result.initialExitFocused, true);
        Test.assertIsEqual(result.exitReturnedFocus, true);
        Test.assertIsEqual(result.exitKeptPanelOpen, true);
        Test.assertIsEqual(result.exitReleasedOwnership, true);
        test.addStep('Verifying collapse releases ownership...');
        Test.assertIsEqual(result.collapsed, true);
        Test.assertIsEqual(result.collapseReleasedOwnership, true);
        test.addStep('Verifying reopening focuses Exit and reacquires ownership...');
        Test.assertIsEqual(result.reopened, true);
        Test.assertIsEqual(result.reopenExitFocused, true);
        Test.assertIsEqual(result.reopenOwnsFocus, true);
      },
      async (test): Promise<void> => {
        if (test.getStatus() === 'skipped') return;

        // Restore panel ownership before returning focus and scroll to the host page.
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveFooterBarTab(originalFooter.tabId, false);
        uiController.setFooterBarIsOpen(originalFooter.isOpen);
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap({ ...originalFocusItem, focusOnEntry: false });
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus();
        uiController.setCrosshairActive(originalCrosshair);
        if (originalScroll) view?.scrollTo({ left: originalScroll.x, top: originalScroll.y, behavior: 'instant' });
      }
    );
  }

  /**
   * Tests that a selected Layers sub-panel lets a Settings pointer press and popover keep focus.
   *
   * @returns A promise that resolves with pre-release focus and Settings switch observations
   */
  testLayersSubPanelYieldsToSettings(): Promise<Test<TypeLayersSettingsFocusResult>> {
    const mapId = this.getMapId();
    const { uiController, layerController } = this.getControllersRegistry();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalFocus = DomHelper.getActiveElement();
    const originalCrosshair = getStoreAppIsCrosshairsActive(mapId);
    const originalSelectedLayer = getStoreLayerSelectedLayerPath(mapId);
    let selectionClose: HTMLButtonElement | undefined;
    let removeFocusListeners: (() => void) | undefined;

    return this.test(
      'Test Layers sub-panel yields pointer and popover focus to Settings',
      async (test): Promise<TypeLayersSettingsFocusResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const root = DomHelper.getGVRootElement(mapId);
        const layers = DomHelper.getAppBarButton(mapId, 'layers');
        const settings = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'appBar-settings-btn');
        if (!layers || !settings) throw new TestError('Layers and Settings controls must be mounted');
        uiController.closeMapPopovers();
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(undefined, false, false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(true);
        await DomHelper.waitForReactIdle();

        test.addStep('Opening Layers and selecting its existing polygon layer...');
        layers.click();
        await DomHelper.waitForReactIdle();
        const panel = DomHelper.getAppBarPanel(mapId, 'layers');
        const panelClose = DomHelper.getAppBarPanelCloseButton(mapId, 'layers');
        if (!panel || !panelClose) throw new TestError('Layers must expose its panel and header Close');
        await whenThisThen(() => DomHelper.getActiveElement() === panelClose, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        const layerRow = panel.querySelector<HTMLElement>('[role="button"][id*="-appBar-layers-"]');
        if (!layerRow) throw new TestError('Layers must contain a selectable layer row');
        layerRow.focus();
        layerRow.click();
        await DomHelper.waitForReactIdle();
        selectionClose = panel.querySelector<HTMLButtonElement>('button[aria-label="Close selection"]') ?? undefined;
        if (!selectionClose) throw new TestError('Selecting a layer must expose its sub-panel Close');
        await whenThisThen(() => DomHelper.getActiveElement() === selectionClose, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);

        // Observe focus between press and release, before the Settings click opens its popover.
        test.addStep('Pressing Settings and applying the browser mousedown focus default before mouseup...');
        settings.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'mouse' }));
        settings.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        settings.focus();
        const pointerFocusRetained = DomHelper.getActiveElement() === settings;
        let switchReceivedFocus = false;
        let switchLostFocus = false;
        const switchId = DomHelper.buildGVElementId(mapId, 'appBar-settings-panel-keyboard-navigation');

        /** Records transient focus theft even if another entry callback later focuses the switch again. */
        const recordSwitchFocus = (event: FocusEvent): void => {
          if (!(event.target instanceof HTMLElement) || event.target.id !== switchId) return;
          if (event.type === 'focusin') switchReceivedFocus = true;
          else switchLostFocus = true;
        };
        root.addEventListener('focusin', recordSwitchFocus, true);
        root.addEventListener('focusout', recordSwitchFocus, true);
        removeFocusListeners = (): void => {
          root.removeEventListener('focusin', recordSwitchFocus, true);
          root.removeEventListener('focusout', recordSwitchFocus, true);
        };

        test.addStep('Releasing Settings and checking that its switch receives and keeps focus...');
        settings.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        settings.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await DomHelper.waitForReactIdle();
        const settingsOpened = settings.getAttribute('aria-expanded') === 'true';
        await whenThisThen(() => switchReceivedFocus, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        await DomHelper.waitForReactIdle();
        return {
          pointerFocusRetained,
          settingsOpened,
          switchReceivedFocus,
          switchKeptFocus: !switchLostFocus && DomHelper.getActiveElement()?.id === switchId,
        };
      },
      (test, result): void => {
        test.addStep('Verifying Settings kept focus before mouseup...');
        Test.assertIsEqual(result.pointerFocusRetained, true);
        test.addStep('Verifying Settings opened and its switch kept focus...');
        Test.assertIsEqual(result.settingsOpened, true);
        Test.assertIsEqual(result.switchReceivedFocus, true);
        Test.assertIsEqual(result.switchKeptFocus, true);
      },
      async (test): Promise<void> => {
        removeFocusListeners?.();
        if (test.getStatus() === 'skipped') return;

        // Remove the test selection and restore the previous panel and focus owner.
        uiController.closeMapPopovers();
        selectionClose?.click();
        layerController.setSelectedLayerPath(originalSelectedLayer ?? '');
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap({ ...originalFocusItem, focusOnEntry: false });
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && DomHelper.getGVRootElement(mapId).contains(originalFocus)) originalFocus.focus();
        uiController.setCrosshairActive(originalCrosshair);
      }
    );
  }

  /**
   * Tests that opening Settings does not scroll a clipped map section.
   *
   * @returns A promise that resolves with the scroll and popover observations
   */
  testSettingsDoesNotScrollPage(): Promise<Test<TypeSettingsScrollResult>> {
    const mapId = this.getMapId();
    const { uiController } = this.getControllersRegistry();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    let originalScroll: { x: number; y: number } | undefined;

    return this.test(
      'Test opening Settings does not scroll the page',
      async (test): Promise<TypeSettingsScrollResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const doc = DomHelper.getGVRootElement(mapId).ownerDocument;
        const view = doc.defaultView;
        const settings = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'appBar-settings-btn');
        const section = DomHelper.getGVElementById(mapId, 'map');
        if (!view || !settings || !section) throw new TestError('Settings and its map section must be mounted');
        originalScroll = { x: view.scrollX, y: view.scrollY };
        uiController.closeMapPopovers();
        uiController.setActiveTrapGeoView(false);
        test.addStep('Positioning the scrollable page with Settings visible and the map section clipped above the viewport...');
        test.addStep('Dispatching a pointer click on Settings...');
        await DomHelper.waitForReactIdle();

        // Keep Settings visible while clipping the map section, so any unwanted page scroll on click is detectable.
        view.scrollTo({ top: view.scrollY + settings.getBoundingClientRect().bottom - view.innerHeight + 20, behavior: 'instant' });
        const rect = settings.getBoundingClientRect();
        if (
          doc.documentElement.scrollHeight <= view.innerHeight ||
          view.scrollY <= 0 ||
          section.getBoundingClientRect().top >= 0 ||
          rect.top < 0 ||
          rect.bottom > view.innerHeight
        ) {
          throw new TestSkippedError('The page must scroll and show Settings while the map section is clipped above the viewport');
        }

        // Capture scroll around the complete pointer sequence, not just the resulting popover state.
        const before = view.scrollY;
        settings.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
        settings.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        settings.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }));
        settings.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        settings.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await DomHelper.waitForReactIdle();
        return { before, after: view.scrollY, open: settings.getAttribute('aria-expanded') === 'true' };
      },
      (test, result): void => {
        test.addStep('Verifying Settings opened without moving the page...');
        Test.assertIsEqual(result.open, true);
        Test.assertIsEqual(result.after, result.before);
      },
      async (): Promise<void> => {
        if (!originalScroll) return;

        // Return the host page to its original position after closing the popover.
        uiController.closeMapPopovers();
        uiController.setActiveTrapGeoView(originalMode);
        await DomHelper.waitForReactIdle();
        const view = DomHelper.getGVRootElement(mapId).ownerDocument.defaultView;
        view?.scrollTo({ left: originalScroll.x, top: originalScroll.y, behavior: 'instant' });
      }
    );
  }

  /**
   * Tests Settings click-away before releasing a dispatched Layers pointer press.
   *
   * @returns A promise that resolves with pre-release focus and post-click app-bar observations
   */
  testSettingsPointerClickAway(): Promise<Test<TypeSettingsPointerClickAwayResult>> {
    const mapId = this.getMapId();
    const { uiController } = this.getControllersRegistry();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalFocus = DomHelper.getActiveElement();
    let restoredSettings = false;
    let removeFocusListener: (() => void) | undefined;

    return this.test(
      'Test Settings click-away preserves focus intent during a Layers pointer press and click',
      async (test): Promise<TypeSettingsPointerClickAwayResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const settings = DomHelper.getGVElementById(mapId, 'appBar-settings-btn');
        const layers = DomHelper.getAppBarButton(mapId, 'layers');
        if (!settings || !layers) throw new TestError('Settings and Layers buttons must be mounted');
        uiController.setActiveAppBarTab(undefined, false, false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(true);
        await DomHelper.waitForReactIdle();
        settings.focus();
        settings.click();
        await whenThisThen(
          () => DomHelper.getActiveElement() === DomHelper.getGVElementById(mapId, 'appBar-settings-panel-keyboard-navigation'),
          TestConstants.KEYBOARD_QUERY_TIMEOUT_MS
        );

        /** Detects even a transient opener restore before the pointer is released. */
        const recordFocus = (): void => {
          restoredSettings = true;
        };
        settings.addEventListener('focusin', recordFocus);
        removeFocusListener = (): void => {
          settings.removeEventListener('focusin', recordFocus);
        };

        test.addStep('Dispatching pointerdown and mousedown on Layers with the Settings switch focused...');
        layers.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
        layers.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await DomHelper.waitForReactIdle();

        // Snapshot the press before mouseup; the framework asserts these observations separately.
        const settingsClosedBeforeMouseUp = !DomHelper.getGVElementById(mapId, 'appBar-settings-panel');
        const settingsRestoredBeforeMouseUp = restoredSettings;

        test.addStep('Dispatching mouseup and click on Layers...');
        layers.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        layers.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await DomHelper.waitForReactIdle();
        const activeAppBar = getStoreUIActiveAppBarTab(mapId);
        return {
          settingsClosedBeforeMouseUp,
          settingsRestoredBeforeMouseUp,
          activeTabAfterClick: activeAppBar.tabId,
          appBarOpenAfterClick: activeAppBar.isOpen,
        };
      },
      (test, observations): void => {
        test.addStep('Verifying click-away focus before mouseup...');
        Test.assertIsEqual(observations.settingsClosedBeforeMouseUp, true);
        Test.assertIsEqual(observations.settingsRestoredBeforeMouseUp, false);
        test.addStep('Verifying the Layers click opened its app-bar tab...');
        Test.assertIsEqual(observations.activeTabAfterClick, 'layers');
        Test.assertIsEqual(observations.appBarOpenAfterClick, true);
      },
      async (test): Promise<void> => {
        removeFocusListener?.();
        if (test.getStatus() === 'skipped') return;
        uiController.closeMapPopovers();
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap({ ...originalFocusItem, focusOnEntry: false });
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus();
      }
    );
  }

  /**
   * Tests focus restoration after Resize dismissal and leaving navBar fullscreen.
   *
   * @returns A promise that resolves with Resize and fullscreen-exit observations
   */
  testFullscreenPopoverFocusReturn(): Promise<Test<TypeFullscreenPopoverFocusResult>> {
    const mapId = this.getMapId();
    const { uiController } = this.getControllersRegistry();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalFooter = getStoreUIActiveFooterBarTab(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalFocus = DomHelper.getActiveElement();
    let closeButton: HTMLButtonElement | undefined;
    let enteredFullscreen = false;
    let originalResizeValue: number | undefined;

    return this.test(
      'Test navBar fullscreen Resize Close and fullscreen exit restore focus',
      async (test): Promise<TypeFullscreenPopoverFocusResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const shell = DomHelper.getShellElement(mapId);
        const fullscreenButton = DomHelper.getGVElementById(mapId, 'button-fullscreen');
        const footerTab = DomHelper.getGVElementById(mapId, 'tab-data-table');
        const guideTab = DomHelper.getGVElementById(mapId, 'tab-guide');
        if (!shell || !fullscreenButton || !footerTab || !guideTab) {
          throw new TestError('Fullscreen and footer controls must be mounted');
        }
        if (
          !DomHelper.getGVRootElement(mapId).checkVisibility({ visibilityProperty: true }) ||
          shell.ownerDocument.visibilityState !== 'visible' ||
          !shell.ownerDocument.hasFocus() ||
          !navigator.userActivation.isActive
        ) {
          throw new TestSkippedError(
            'Run Group 6 on its own with the viewer visible, the page in front and a real click on Launch to cover navBar fullscreen'
          );
        }
        if (getFullscreenElement()) throw new TestError('Launch Group 6 outside fullscreen so the test can enter through the navBar');

        // Native fullscreen requires the real suite-launch gesture; a synthetic key cannot grant it.
        test.addStep('Activating navBar fullscreen from the suite launch user gesture...');
        await new Promise<void>((resolve, reject) => {
          /** Completes the native fullscreen request or reports its browser rejection. */
          const handleFullscreen = (event: Event): void => {
            shell.removeEventListener('fullscreenchange', handleFullscreen);
            shell.removeEventListener('fullscreenerror', handleFullscreen);
            if (event.type === 'fullscreenerror' || getFullscreenElement() !== shell) {
              reject(new TestError('The browser rejected navBar fullscreen; allow fullscreen and launch Group 6 with a real click'));
            } else {
              resolve();
            }
          };
          shell.addEventListener('fullscreenchange', handleFullscreen);
          shell.addEventListener('fullscreenerror', handleFullscreen);
          fullscreenButton.focus();
          fullscreenButton.click();
          enteredFullscreen = true;
        });
        uiController.setActiveTrapGeoView(true);
        uiController.setActiveFooterBarTab(undefined, false);
        uiController.setFooterBarIsOpen(false);
        await DomHelper.waitForReactIdle();
        footerTab.focus();
        footerTab.click();
        await DomHelper.waitForReactIdle();
        await delay(TIMEOUT.focusDelay);
        const resizeButton = DomHelper.queryGVSelector<HTMLButtonElement>(mapId, 'button[aria-label="Resize"]');
        if (!resizeButton) throw new TestError('An open footer in navBar fullscreen must expose Resize');

        test.addStep('Following the footer tab order to Resize and activating its rendered button...');
        guideTab.focus();
        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        const tabbable = DomHelper.getGVVisibleTabbable(mapId, shell);
        const nextControl = tabbable[tabbable.indexOf(guideTab) + 1];
        // Synthetic Tab has no browser default; perform its normal focus step separately.
        if (guideTab.dispatchEvent(tabEvent)) nextControl?.focus();
        const resizeReached = DomHelper.getActiveElement() === resizeButton;
        if (!resizeReached) {
          return {
            resizeReached,
            closeRestored: false,
            pointerClosed: false,
            pointerValue: undefined,
            expectedPointerValue: undefined,
            pointerFocusRestored: false,
            fullscreenControlsUnmounted: false,
            exitFocusRestored: false,
          };
        }

        /** Opens the actual Resize popover and retains its Close control before waiting for focus. */
        const openResize = async (): Promise<void> => {
          resizeButton.click();
          await DomHelper.waitForReactIdle();
          closeButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'resize-close-button');
          if (!closeButton) throw new TestError('Resize must expose its Close button');
          await whenThisThen(() => DomHelper.getActiveElement() === closeButton, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        };

        await openResize();
        closeButton?.click();
        await DomHelper.waitForReactIdle();
        await delay(MODAL_FOCUS_SETTLE_MS);
        const closeRestored = DomHelper.getActiveElement() === resizeButton;

        test.addStep('Committing a Resize slider value with a dispatched pointer press and release...');
        await openResize();
        const input = closeButton?.closest('[role="dialog"]')?.querySelector<HTMLInputElement>('input[type="range"]');
        const slider = input?.closest<HTMLElement>('.MuiSlider-root');
        if (!input || !slider) throw new TestError('Resize must expose its slider');
        originalResizeValue = Number(input.value);
        const expectedPointerValue = originalResizeValue === 100 ? 35 : 100;
        input.focus();
        const rect = slider.getBoundingClientRect();
        if (!rect.height) throw new TestError('Resize slider must have a visible track');
        const pointer = {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          clientX: rect.left + rect.width / 2,
          clientY: expectedPointerValue === 100 ? rect.top : rect.bottom,
        };
        slider.dispatchEvent(new PointerEvent('pointerdown', { ...pointer, button: 0, buttons: 1 }));
        await DomHelper.waitForReactIdle();
        slider.ownerDocument.dispatchEvent(new PointerEvent('pointerup', { ...pointer, button: 0, buttons: 0 }));
        await DomHelper.waitForReactIdle();
        const pointerClosed = resizeButton.getAttribute('aria-expanded') === 'false';
        const pointerFocusRestored = DomHelper.getActiveElement() === resizeButton;
        if (pointerClosed) await openResize();
        const reopenedInput = closeButton?.closest('[role="dialog"]')?.querySelector<HTMLInputElement>('input[type="range"]');
        if (!reopenedInput) throw new TestError('Resize must expose its slider after the pointer commit');
        const pointerValue = Number(reopenedInput.value);

        test.addStep('Exiting browser fullscreen while Resize Close owns focus...');
        closeButton?.focus();

        // exitFullscreen fires the same fullscreenchange as browser-handled Esc, which a synthetic key cannot invoke.
        await shell.ownerDocument.exitFullscreen();
        await DomHelper.waitForReactIdle();
        await delay(MODAL_FOCUS_SETTLE_MS);
        return {
          resizeReached,
          closeRestored,
          pointerClosed,
          pointerValue,
          expectedPointerValue,
          pointerFocusRestored,
          fullscreenControlsUnmounted: !getFullscreenElement() && !closeButton?.isConnected && !resizeButton.isConnected,
          exitFocusRestored: DomHelper.getActiveElement() === fullscreenButton,
        };
      },
      (test, result): void => {
        test.addStep('Verifying the footer Tab step reached Resize...');
        Test.assertIsEqual(result.resizeReached, true);
        test.addStep('Verifying Close returned focus to Resize...');
        Test.assertIsEqual(result.closeRestored, true);
        test.addStep('Verifying the pointer commit closed Resize and applied its value...');
        Test.assertIsEqual(result.pointerClosed, true);
        Test.assertIsEqual(result.pointerValue, result.expectedPointerValue);
        test.addStep('Verifying the pointer commit returned focus to Resize...');
        Test.assertIsEqual(result.pointerFocusRestored, true);
        test.addStep('Verifying fullscreen exit unmounted Resize and its trigger...');
        Test.assertIsEqual(result.fullscreenControlsUnmounted, true);
        test.addStep('Verifying lost fullscreen focus returned to the navBar fullscreen button...');
        Test.assertIsEqual(result.exitFocusRestored, true);
      },
      async (test): Promise<void> => {
        if (test.getStatus() === 'skipped') return;

        // Close Resize and exit native fullscreen before restoring the original footer and focus.
        closeButton?.click();
        if (enteredFullscreen) {
          uiController.setFullScreen(false);
          await whenThisThen(() => !getFullscreenElement(), TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        }
        if (originalResizeValue !== undefined) uiController.setFooterPanelResizeValue(originalResizeValue);
        uiController.setActiveFooterBarTab(originalFooter.tabId, false);
        uiController.setFooterBarIsOpen(originalFooter.isOpen);
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap({ ...originalFocusItem, focusOnEntry: false });
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement) originalFocus.focus();
      }
    );
  }

  /**
   * Tests repeated crosshair queries open the Details sub-panel and focus its main Close button.
   *
   * @returns A promise that resolves with focus, panel, and repeated-query observations
   */
  testKeyboardQueryMapFocusReturn(): Promise<Test<TypeKeyboardQueryFocusResult>> {
    const mapId = this.getMapId();
    const viewer = this.getMapViewer();
    const view = viewer.getView();
    const { mapController, uiController, layerSetController } = this.getControllersRegistry();
    const querySet = layerSetController.featureInfoLayerSet;
    const originalFocus = DomHelper.getActiveElement();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalCrosshair = getStoreAppIsCrosshairsActive(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const originalCenter = view.getCenter()?.slice();
    const originalResolution = view.getResolution();
    const originalPointer = getStoreMapPointerPosition(mapId);
    const queries: Coordinate[] = [];

    /** Records completed queries independently of whether their coordinates or results changed. */
    const recordQuery = (_sender: FeatureInfoLayerSet, event: QueryEndedEvent): void => {
      queries.push([...event.coordinate]);
    };

    /** Dispatches keys from actual focus so a misplaced focus cannot produce a false pass. */
    const pressKey = (key: string, ctrlKey = false): void => {
      const activeElement = DomHelper.getActiveElementWithinMap(mapId);
      if (!activeElement) throw new TestError('Keyboard query test requires focus inside its existing map');
      activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey, bubbles: true, cancelable: true }));
    };

    return this.test(
      'Test Ctrl+M closes Details and returns map focus before Enter queries and reopens Details',
      async (test): Promise<TypeKeyboardQueryFocusResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const target = DomHelper.getMapTargetElement(mapId);
        const detailsButton = DomHelper.getAppBarButton(mapId, 'details');
        const detailsPanel = DomHelper.getAppBarPanel(mapId, 'details');
        if (!target || !detailsButton || !detailsPanel) throw new TestError('Existing map target and Details controls must be mounted');
        if (!target.ownerDocument.hasFocus()) throw new TestError('Keyboard focus tests require the browser page to be in the foreground');

        test.addStep('Preparing keyboard navigation on the existing map and polygon layer...');
        await layerSetController.featureInfoLayerSet.waitForLayerToGetRegistered('geojsonLYR5/polygons.json');
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(originalAppBar.tabId, false, false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(true);
        detailsButton.focus();
        querySet.onQueryEnded(recordQuery);
        const observations: TypeKeyboardQueryFocusResult['observations'] = [];

        /** Records one query and its focus transitions before the next query starts. */
        const runQuery = async (index: number, expectsFeatures: boolean): Promise<TypeKeyboardQueryFocusResult['observations'][number]> => {
          let subPanelClosedBeforeQuery: boolean | undefined;
          if (index === 2) {
            test.addStep('Closing the feature sub-panel before repeating the query at the same coordinates...');
            uiController.setActiveAppBarTab('details', true, true);
            await DomHelper.waitForReactIdle();
            const layerButton = detailsPanel.querySelector<HTMLButtonElement>('ul button');
            if (!layerButton) throw new TestError('Details must expose its result layer');
            layerButton.click();
            await DomHelper.waitForReactIdle();
            const subPanelClose = detailsPanel.querySelector<HTMLButtonElement>(
              '.responsive-layout-right-main-content button[aria-label="Close selection"]'
            );
            if (!subPanelClose) throw new TestError('Details must expose its feature sub-panel Close button');
            subPanelClose.focus();
            pressKey('Escape');
            await DomHelper.waitForReactIdle();
            subPanelClosedBeforeQuery = !detailsPanel.querySelector('.responsive-layout-right-main')?.getClientRects().length;
          }

          test.addStep(`Query ${index + 1}: pressing Ctrl+M and checking map focus and Details closure...`);
          pressKey('m', true);
          await DomHelper.waitForReactIdle();
          const shortcutFocusId = DomHelper.getActiveElement()?.id;
          const shortcutCrosshairActive = getStoreAppIsCrosshairsActive(mapId);
          const detailsClosedAfterShortcut = !getStoreUIActiveAppBarTab(mapId).isOpen;
          const queryCountAfterShortcut = queries.length;

          // Render the new view before synchronizing the crosshair used by the next query.
          await mapController.zoomToLonLatExtentOrCoordinate(
            expectsFeatures ? MULTI_FEATURE_QUERY_EXTENT : TestConstants.ALBERTA_CENTER_LONLAT,
            false
          );
          viewer.map.renderSync();
          mapController.synchronizeCrosshairPointerPosition();
          const expectedCoordinate = mapController.getViewportCenterPosition()?.lonlat;
          if (!expectedCoordinate) throw new TestError('Crosshair coordinates must be available before each query');

          test.addStep(`Query ${index + 1}: pressing Enter and waiting for ${expectsFeatures ? 'features' : 'the guide'}...`);
          const focusDepartures: string[] = [];
          let mainCloseReceivedFocus = false;

          /** Records transient focus theft even if another pending entry callback later restores the main Close button. */
          const recordFocus = (event: FocusEvent): void => {
            const element = event.target;
            if (!(element instanceof HTMLElement)) return;
            if (element === DomHelper.getAppBarPanelCloseButton(mapId, 'details')) mainCloseReceivedFocus = true;
            else if (mainCloseReceivedFocus) focusDepartures.push(element.id || element.getAttribute('aria-label') || element.className);
          };

          detailsPanel.addEventListener('focusin', recordFocus);
          try {
            pressKey('Enter');
            await whenThisThen(() => queries.length === index + 1, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
            await GVAbstractTester.waitForBatchedQueryPropagation(test);
            test.addStep(`Query ${index + 1}: waiting for rendered content and the sub-panel autofocus animation frame...`);
            await whenThisThen(
              () =>
                !!detailsPanel.querySelector(expectsFeatures ? '[aria-label="Feature navigation"]' : '.guide-container')?.getClientRects()
                  .length,
              TestConstants.KEYBOARD_QUERY_TIMEOUT_MS
            );
            await DomHelper.waitForReactIdle();
            await delay(TIMEOUT.focusDelay);
            await DomHelper.waitForReactIdle();
          } finally {
            detailsPanel.removeEventListener('focusin', recordFocus);
          }
          const mainClose = DomHelper.getAppBarPanelCloseButton(mapId, 'details');
          if (!mainClose) throw new TestError('Query-opened Details must expose its main Close button');
          const activeElement = DomHelper.getActiveElement();
          const activeTab = getStoreUIActiveAppBarTab(mapId);
          const observation: TypeKeyboardQueryFocusResult['observations'][number] = {
            expectsFeatures,
            expectedCoordinate,
            shortcutFocusId,
            shortcutCrosshairActive,
            detailsClosedAfterShortcut,
            queryCountAfterShortcut,
            focusAfterQuery: activeElement?.id || activeElement?.getAttribute('aria-label') || activeElement?.className,
            mainCloseId: mainClose.id,
            focusDepartures,
            detailsOpenAfterQuery: activeTab.isOpen && activeTab.tabId === 'details',
            crosshairInactiveAfterQuery: !getStoreAppIsCrosshairsActive(mapId),
            subPanelVisible: !!detailsPanel.querySelector('.responsive-layout-right-main')?.getClientRects().length,
            featuresVisible: !!detailsPanel.querySelector('[aria-label="Feature navigation"]')?.getClientRects().length,
            guideVisible: !!detailsPanel.querySelector('.guide-container')?.getClientRects().length,
            subPanelClosedBeforeQuery,
          };

          if (index % 2 === 1) {
            test.addStep(`Query ${index + 1}: pressing one Escape from query focus...`);
            pressKey('Escape');
            await DomHelper.waitForReactIdle();
            observation.escape = {
              detailsClosed: !getStoreUIActiveAppBarTab(mapId).isOpen,
              focusId: DomHelper.getActiveElement()?.id,
              crosshairActive: getStoreAppIsCrosshairsActive(mapId),
            };
          }
          return observation;
        };

        for (const [index, expectsFeatures] of [true, true, true, false, false, true].entries()) {
          // eslint-disable-next-line no-await-in-loop -- Each query reuses the map and must finish its focus transitions before the next.
          observations.push(await runQuery(index, expectsFeatures));
        }

        return { mapTargetId: target.id, queries, observations };
      },
      (test, result): void => {
        Test.assertIsEqual(result.queries.length, result.observations.length);
        result.observations.forEach((observation, index): void => {
          test.addStep(`Query ${index + 1}: verifying Ctrl+M closes Details and focuses the active crosshair without querying...`);
          Test.assertIsEqual(observation.shortcutFocusId, result.mapTargetId);
          Test.assertIsEqual(observation.shortcutCrosshairActive, true);
          Test.assertIsEqual(observation.detailsClosedAfterShortcut, true);
          Test.assertIsEqual(observation.queryCountAfterShortcut, index);

          test.addStep(
            `Query ${index + 1}: verifying exact main Close focus and the open ${observation.expectsFeatures ? 'features' : 'guide'}...`
          );
          Test.assertIsEqual(observation.focusAfterQuery, observation.mainCloseId);
          Test.assertIsEqual(observation.focusDepartures.join(', '), '');
          Test.assertIsEqual(observation.detailsOpenAfterQuery, true);
          Test.assertIsEqual(observation.crosshairInactiveAfterQuery, true);
          Test.assertIsEqual(observation.subPanelVisible, true);
          Test.assertIsEqual(observation.featuresVisible, observation.expectsFeatures);
          Test.assertIsEqual(observation.guideVisible, !observation.expectsFeatures);
          if (observation.subPanelClosedBeforeQuery !== undefined) Test.assertIsEqual(observation.subPanelClosedBeforeQuery, true);
          result.queries[index].forEach((value, axis): void => {
            Test.assertIsEqualWithinTolerance(value, observation.expectedCoordinate[axis], 1e-9);
          });
          if (observation.escape) {
            test.addStep(`Query ${index + 1}: verifying one Escape closes Details and returns to the active crosshair...`);
            Test.assertIsEqual(observation.escape.detailsClosed, true);
            Test.assertIsEqual(observation.escape.focusId, result.mapTargetId);
            Test.assertIsEqual(observation.escape.crosshairActive, true);
          }
        });
      },
      async (test): Promise<void> => {
        querySet.offQueryEnded(recordQuery);
        if (test.getStatus() === 'skipped') return;

        // Restore view, pointer and focus state so subsequent shared-map cases start cleanly.
        uiController.setCrosshairActive(false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(false);
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        view.setResolution(originalResolution);
        view.setCenter(originalCenter);
        viewer.map.renderSync();
        await DomHelper.waitForReactIdle();
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap(originalFocusItem);
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
        uiController.setCrosshairActive(originalCrosshair);
        setStoreMapPointerPosition(mapId, originalPointer ?? mapController.getMapCenterPosition());
        await DomHelper.waitForReactIdle();
      }
    );
  }

  /**
   * Tests reopening Details preserves its feature sub-panel after app-bar and Ctrl+M dismissal.
   *
   * @returns A promise that resolves with the remembered sub-panel and feature observations
   */
  testDetailsSubPanelReopensAfterDismissal(): Promise<Test<TypeDetailsReopenResult[]>> {
    const mapId = this.getMapId();
    const viewer = this.getMapViewer();
    const view = viewer.getView();
    const { mapController, uiController, detailsController, layerSetController } = this.getControllersRegistry();
    const originalFocus = DomHelper.getActiveElement();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalCrosshair = getStoreAppIsCrosshairsActive(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const originalCenter = view.getCenter()?.slice();
    const originalResolution = view.getResolution();
    const originalPointer = getStoreMapPointerPosition(mapId);
    const originalLayerPath = getStoreDetailsSelectedLayerPath(mapId);
    const originalFeatureIndex = getStoreDetailsCurrentFeatureIndex(mapId);

    return this.test(
      'Test reopening Details preserves its feature sub-panel after app-bar and Ctrl+M dismissal',
      async (test): Promise<TypeDetailsReopenResult[]> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const target = DomHelper.getMapTargetElement(mapId);
        const detailsButton = DomHelper.getAppBarButton(mapId, 'details');
        const detailsPanel = DomHelper.getAppBarPanel(mapId, 'details');
        if (!target || !detailsButton || !detailsPanel) throw new TestError('The map target and Details controls must be mounted');
        if (!target.ownerDocument.hasFocus()) throw new TestError('Keyboard focus tests require the browser page to be in the foreground');

        test.addStep('Opening Details with a pointer-origin query on the existing polygon layer...');
        await layerSetController.featureInfoLayerSet.waitForLayerToGetRegistered('geojsonLYR5/polygons.json');
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(undefined, false, false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(true);
        detailsController.setSelectedLayerPath('');
        await mapController.zoomToLonLatExtentOrCoordinate(MULTI_FEATURE_QUERY_EXTENT, false);
        viewer.map.renderSync();
        await DomHelper.waitForReactIdle();
        const queryPosition = mapController.getViewportCenterPosition();
        if (!queryPosition) throw new TestError('The existing map must expose a query position');
        await mapController.performMapClickAction(queryPosition);
        await GVAbstractTester.waitForBatchedQueryPropagation(test);
        await whenThisThen(() => {
          const nextButton = detailsPanel.querySelector<HTMLButtonElement>(
            '[role="group"][aria-label="Feature navigation"] button[aria-label="Next feature"]'
          );
          return !!nextButton && nextButton.getAttribute('aria-disabled') !== 'true';
        }, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        const nextButton = detailsPanel.querySelector<HTMLButtonElement>(
          '[role="group"][aria-label="Feature navigation"] button[aria-label="Next feature"]'
        );
        const subPanel = nextButton?.closest<HTMLElement>('.responsive-layout-right-main');
        const layerButton = detailsPanel.querySelector<HTMLButtonElement>('ul button');
        if (!nextButton || !subPanel || !layerButton)
          throw new TestError('Details must expose its feature sub-panel and parent layer item');
        /** Closes the outer panel and reopens it without issuing another feature query. */
        const closeAndReopen = async (dismissal: 'app-bar button' | 'Ctrl+M'): Promise<TypeDetailsReopenResult> => {
          test.addStep(`Closing Details with ${dismissal} while its feature sub-panel is open...`);
          layerButton.click();
          await DomHelper.waitForReactIdle();
          nextButton.click();
          await DomHelper.waitForReactIdle();
          const selectedLayerPath = getStoreDetailsSelectedLayerPath(mapId);
          const featureIndex = getStoreDetailsCurrentFeatureIndex(mapId);
          const subPanelOpenBefore = subPanel.getClientRects().length > 0;
          if (dismissal === 'app-bar button') {
            detailsButton.focus();
            detailsButton.click();
          } else {
            nextButton.focus();
            nextButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', ctrlKey: true, bubbles: true, cancelable: true }));
          }
          await DomHelper.waitForReactIdle();
          const detailsClosed = !getStoreUIActiveAppBarTab(mapId).isOpen;
          const subPanelHiddenWithDetails = subPanel.getClientRects().length === 0;

          test.addStep(`Reopening Details from its app-bar button after ${dismissal} without a new query...`);
          detailsButton.focus();
          detailsButton.click();
          await DomHelper.waitForReactIdle();
          return {
            dismissal,
            subPanelOpenBefore,
            detailsClosed,
            subPanelHiddenWithDetails,
            detailsReopened: getStoreUIActiveAppBarTab(mapId).isOpen,
            subPanelReopened: subPanel.getClientRects().length > 0,
            selectedLayerPath,
            reopenedLayerPath: getStoreDetailsSelectedLayerPath(mapId),
            featureIndex,
            reopenedFeatureIndex: getStoreDetailsCurrentFeatureIndex(mapId),
          };
        };
        return [await closeAndReopen('app-bar button'), await closeAndReopen('Ctrl+M')];
      },
      (test, results): void => {
        results.forEach((result): void => {
          test.addStep(`Verifying the feature sub-panel was open before ${result.dismissal}...`);
          Test.assertIsEqual(result.subPanelOpenBefore, true);
          test.addStep(`Verifying ${result.dismissal} hides both Details levels...`);
          Test.assertIsEqual(result.detailsClosed, true);
          Test.assertIsEqual(result.subPanelHiddenWithDetails, true);
          test.addStep(`Verifying the Details app-bar button reopens Details after ${result.dismissal}...`);
          Test.assertIsEqual(result.detailsReopened, true);
          test.addStep(`Verifying the remembered feature sub-panel reopens after ${result.dismissal}...`);
          Test.assertIsEqual(result.subPanelReopened, true);
          test.addStep(`Verifying the same layer and feature remain selected after ${result.dismissal}...`);
          Test.assertIsEqual(result.reopenedLayerPath, result.selectedLayerPath);
          Test.assertIsEqual(result.reopenedFeatureIndex, result.featureIndex);
        });
      },
      async (test): Promise<void> => {
        if (test.getStatus() === 'skipped') return;

        // Restore both the map view and the remembered Details selection.
        uiController.setCrosshairActive(false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(false);
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        detailsController.setSelectedLayerPath(originalLayerPath);
        detailsController.setCurrentFeatureIndex(originalFeatureIndex);
        view.setResolution(originalResolution);
        view.setCenter(originalCenter);
        viewer.map.renderSync();
        await DomHelper.waitForReactIdle();
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap(originalFocusItem);
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
        uiController.setCrosshairActive(originalCrosshair);
        setStoreMapPointerPosition(mapId, originalPointer ?? mapController.getMapCenterPosition());
        await DomHelper.waitForReactIdle();
      }
    );
  }

  /**
   * Tests Ctrl+M closes app-bar panels and map popovers without closing footer panels.
   *
   * @returns A promise that resolves with focus and panel observations
   */
  testKeyboardShortcutClosesPanelsAndPreservesFooter(): Promise<Test<TypeKeyboardShortcutPanelsResult>> {
    const mapId = this.getMapId();
    const { uiController } = this.getControllersRegistry();
    const originalFocus = DomHelper.getActiveElement();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalCrosshair = getStoreAppIsCrosshairsActive(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const originalFooterBar = getStoreUIActiveFooterBarTab(mapId);

    const shortcutPrevented: boolean[] = [];

    /** Dispatches Ctrl+M from the element that currently owns focus in this map and records whether its default was prevented. */
    const pressCtrlM = (): void => {
      const activeElement = DomHelper.getActiveElementWithinMap(mapId);
      if (!activeElement) throw new TestError('Ctrl+M panel test requires focus inside its existing map');
      shortcutPrevented.push(
        !activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', ctrlKey: true, bubbles: true, cancelable: true }))
      );
    };

    return this.test(
      'Test Ctrl+M closes app-bar panels and map popovers while preserving the footer panel',
      async (test): Promise<TypeKeyboardShortcutPanelsResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const target = DomHelper.getMapTargetElement(mapId);
        const layersButton = DomHelper.getAppBarButton(mapId, 'layers');
        const settingsButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'appBar-settings-btn');
        const basemapButton = DomHelper.queryGVSelector<HTMLButtonElement>(mapId, 'button[aria-label="Change basemap"]');
        if (!target || !layersButton || !settingsButton || !basemapButton) {
          throw new TestError('The map target, Layers button, Settings button, and basemap control must be mounted');
        }
        if (!target.ownerDocument.hasFocus()) throw new TestError('Keyboard focus tests require the browser page to be in the foreground');

        test.addStep('Preparing the existing map with the footer Data Table panel open...');
        uiController.closeMapPopovers();
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(undefined, false, false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(true);
        uiController.setActiveFooterBarTab('data-table');
        await DomHelper.waitForReactIdle();

        test.addStep('Opening the Layers app-bar panel and pressing Ctrl+M...');
        layersButton.focus();
        layersButton.click();
        await DomHelper.waitForReactIdle();
        const appBarBeforeShortcut = getStoreUIActiveAppBarTab(mapId);
        pressCtrlM();
        await DomHelper.waitForReactIdle();
        const appBarAfterShortcut = getStoreUIActiveAppBarTab(mapId);
        const mapFocusedAfterAppBar = DomHelper.getActiveElement() === target;
        const crosshairActiveAfterAppBar = getStoreAppIsCrosshairsActive(mapId);
        const footerAfterAppBar = getStoreUIActiveFooterBarTab(mapId);

        test.addStep('Opening Settings and pressing Ctrl+M...');
        uiController.setActiveAppBarTab('layers', false, false);
        await DomHelper.waitForReactIdle();
        settingsButton.focus();
        settingsButton.click();
        await DomHelper.waitForReactIdle();
        const settingsOpenBeforeShortcut = settingsButton.getAttribute('aria-expanded') === 'true';
        pressCtrlM();
        await DomHelper.waitForReactIdle();
        const settingsClosedAfterShortcut = settingsButton.getAttribute('aria-expanded') === 'false';
        const mapFocusedAfterPopover = DomHelper.getActiveElement() === target;
        const crosshairActiveAfterPopover = getStoreAppIsCrosshairsActive(mapId);
        const footerAfterPopover = getStoreUIActiveFooterBarTab(mapId);

        test.addStep('Opening the map basemap popover and pressing Ctrl+M...');
        basemapButton.focus();
        basemapButton.click();
        await DomHelper.waitForReactIdle();
        const basemapPopoverWasOpen = basemapButton.getAttribute('aria-expanded') === 'true';
        pressCtrlM();
        await DomHelper.waitForReactIdle();
        const basemapPopoverClosed = basemapButton.getAttribute('aria-expanded') === 'false';
        const mapFocusedAfterMapPopover = DomHelper.getActiveElement() === target;
        const crosshairActiveAfterMapPopover = getStoreAppIsCrosshairsActive(mapId);
        const footerAfterMapPopover = getStoreUIActiveFooterBarTab(mapId);

        // Repeat the shortcut without an open panel to cover the baseline map behavior.
        test.addStep('Pressing Ctrl+M with no panel or popover open...');
        target.focus();
        pressCtrlM();
        await DomHelper.waitForReactIdle();

        return {
          appBarWasOpen: appBarBeforeShortcut.isOpen && appBarBeforeShortcut.tabId === 'layers',
          appBarClosed: !appBarAfterShortcut.isOpen,
          mapFocusedAfterAppBar,
          crosshairActiveAfterAppBar,
          footerPreservedAfterAppBar: footerAfterAppBar.tabId === 'data-table' && footerAfterAppBar.isOpen,
          settingsWasOpen: settingsOpenBeforeShortcut,
          settingsClosedAfterShortcut,
          mapFocusedAfterPopover,
          crosshairActiveAfterPopover,
          footerPreservedAfterPopover: footerAfterPopover.tabId === 'data-table' && footerAfterPopover.isOpen,
          basemapPopoverWasOpen,
          basemapPopoverClosed,
          mapFocusedAfterMapPopover,
          crosshairActiveAfterMapPopover,
          footerPreservedAfterMapPopover: footerAfterMapPopover.tabId === 'data-table' && footerAfterMapPopover.isOpen,
          mapFocusedWithNothingOpen: DomHelper.getActiveElement() === target,
          crosshairActiveWithNothingOpen: getStoreAppIsCrosshairsActive(mapId),
          shortcutPrevented: [...shortcutPrevented],
        };
      },
      (test, result): void => {
        test.addStep('Verifying every acting Ctrl+M prevents the browser default...');
        Test.assertIsArrayEqual(result.shortcutPrevented, [true, true, true, true]);
        test.addStep('Verifying the Layers app-bar panel was open before Ctrl+M...');
        Test.assertIsEqual(result.appBarWasOpen, true);
        test.addStep('Verifying Ctrl+M closes the Layers app-bar panel...');
        Test.assertIsEqual(result.appBarClosed, true);
        test.addStep('Verifying map focus after closing the app-bar panel...');
        Test.assertIsEqual(result.mapFocusedAfterAppBar, true);
        test.addStep('Verifying the crosshair is active after closing the app-bar panel...');
        Test.assertIsEqual(result.crosshairActiveAfterAppBar, true);
        test.addStep('Verifying the footer Data Table panel remains open after the app-bar shortcut...');
        Test.assertIsEqual(result.footerPreservedAfterAppBar, true);

        test.addStep('Verifying Settings was open before Ctrl+M...');
        Test.assertIsEqual(result.settingsWasOpen, true);
        test.addStep('Verifying Ctrl+M closes Settings...');
        Test.assertIsEqual(result.settingsClosedAfterShortcut, true);
        test.addStep('Verifying map focus after the Settings shortcut...');
        Test.assertIsEqual(result.mapFocusedAfterPopover, true);
        test.addStep('Verifying the crosshair is active after the Settings shortcut...');
        Test.assertIsEqual(result.crosshairActiveAfterPopover, true);
        test.addStep('Verifying the footer Data Table panel remains open after the Settings shortcut...');
        Test.assertIsEqual(result.footerPreservedAfterPopover, true);

        test.addStep('Verifying the basemap popover was open before Ctrl+M...');
        Test.assertIsEqual(result.basemapPopoverWasOpen, true);
        test.addStep('Verifying Ctrl+M closes the basemap popover...');
        Test.assertIsEqual(result.basemapPopoverClosed, true);
        test.addStep('Verifying map focus after the basemap shortcut...');
        Test.assertIsEqual(result.mapFocusedAfterMapPopover, true);
        test.addStep('Verifying the crosshair is active after the basemap shortcut...');
        Test.assertIsEqual(result.crosshairActiveAfterMapPopover, true);
        test.addStep('Verifying the footer Data Table panel remains open after the basemap shortcut...');
        Test.assertIsEqual(result.footerPreservedAfterMapPopover, true);

        test.addStep('Verifying Ctrl+M with nothing open focuses the map...');
        Test.assertIsEqual(result.mapFocusedWithNothingOpen, true);
        test.addStep('Verifying Ctrl+M with nothing open activates the crosshair...');
        Test.assertIsEqual(result.crosshairActiveWithNothingOpen, true);
      },
      async (test): Promise<void> => {
        if (test.getStatus() === 'skipped') return;

        // Restore both app-bar and footer state after comparing their shortcut behavior.
        uiController.closeMapPopovers();
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        uiController.setActiveFooterBarTab(originalFooterBar.tabId || undefined, originalFooterBar.isOpen);
        uiController.setFooterBarIsOpen(originalFooterBar.isOpen);
        await DomHelper.waitForReactIdle();
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap(originalFocusItem);
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
        uiController.setCrosshairActive(originalCrosshair);
        await DomHelper.waitForReactIdle();
      }
    );
  }

  /**
   * Tests Escape returns to the map after an in-panel crosshair-query Details focus.
   *
   * @returns A promise that resolves with the resulting focus and crosshair state
   */
  testCrosshairDetailsEscapeReturnsToMap(): Promise<Test<TypeCrosshairDetailsEscapeResult>> {
    const mapId = this.getMapId();
    const viewer = this.getMapViewer();
    const view = viewer.getView();
    const { mapController, uiController, layerSetController } = this.getControllersRegistry();
    const querySet = layerSetController.featureInfoLayerSet;
    const originalFocus = DomHelper.getActiveElement();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalCrosshair = getStoreAppIsCrosshairsActive(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const originalCenter = view.getCenter()?.slice();
    const originalResolution = view.getResolution();
    const originalPointer = getStoreMapPointerPosition(mapId);
    const queries: Coordinate[] = [];

    /** Records completed queries for this test. */
    const recordQuery = (_sender: FeatureInfoLayerSet, event: QueryEndedEvent): void => {
      queries.push([...event.coordinate]);
    };

    /** Dispatches a key from the focused element inside this map. */
    const pressKey = (key: string, ctrlKey = false): void => {
      const activeElement = DomHelper.getActiveElementWithinMap(mapId);
      if (!activeElement) throw new TestError('Details Escape test requires focus inside its existing map');
      activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey, bubbles: true, cancelable: true }));
    };

    /** Checks whether focus currently belongs to the Details app-bar panel. */
    const hasDetailsFocus = (): boolean => {
      const activeElement = DomHelper.getActiveElement();
      return !!activeElement && !!DomHelper.getAppBarPanel(mapId, 'details')?.contains(activeElement);
    };

    return this.test(
      'Test Escape returns focus to the crosshair after navigating within query-opened Details',
      async (test): Promise<TypeCrosshairDetailsEscapeResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const target = DomHelper.getMapTargetElement(mapId);
        if (!target) throw new TestError('The map target must be mounted');
        if (!target.ownerDocument.hasFocus()) throw new TestError('Keyboard focus tests require the browser page to be in the foreground');

        test.addStep('Preparing a crosshair query on the existing polygon layer...');
        await layerSetController.featureInfoLayerSet.waitForLayerToGetRegistered('geojsonLYR5/polygons.json');
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(undefined, false, false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(true);
        await mapController.zoomToLonLatExtentOrCoordinate(MULTI_FEATURE_QUERY_EXTENT, false);
        viewer.map.renderSync();
        await DomHelper.waitForReactIdle();
        mapController.synchronizeCrosshairPointerPosition();
        uiController.setCrosshairActive(true);
        target.focus();
        querySet.onQueryEnded(recordQuery);

        test.addStep('Querying from the active crosshair and waiting for Details focus...');
        await DomHelper.waitForReactIdle();
        pressKey('Enter');
        await whenThisThen(() => queries.length === 1, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        await GVAbstractTester.waitForBatchedQueryPropagation(test);
        await whenThisThen(hasDetailsFocus, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);

        const targetPanel = DomHelper.getAppBarPanel(mapId, 'details');
        const closeButton = DomHelper.getAppBarPanelCloseButton(mapId, 'details');
        if (!targetPanel || !closeButton) throw new TestError('The query-opened Details panel must be mounted');
        const availableLayerButton = targetPanel.querySelector<HTMLButtonElement>('ul button');
        if (!availableLayerButton) throw new TestError('The query-opened Details panel must list the available result layer');
        availableLayerButton.click();
        await whenThisThen(() => {
          const nextButton = targetPanel.querySelector<HTMLButtonElement>(
            '[role="group"][aria-label="Feature navigation"] button[aria-label="Next feature"]'
          );
          return !!nextButton && nextButton.getAttribute('aria-disabled') !== 'true';
        }, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);

        const navigationGroup = targetPanel.querySelector('[role="group"][aria-label="Feature navigation"]');
        const nextFeatureButton = navigationGroup?.querySelector<HTMLButtonElement>('button[aria-label="Next feature"]');
        const subPanel = nextFeatureButton?.closest<HTMLElement>('.responsive-layout-right-main');
        if (!nextFeatureButton || !subPanel) {
          throw new TestError('The map13 query must expose multiple Details results to exercise result navigation');
        }

        // Exercise in-panel navigation before testing the two nested Escape destinations.
        test.addStep('Moving focus within Details, navigating a result, and moving the mouse without clicking...');
        closeButton.focus();
        closeButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
        const focusStayedWithinAfterTab = targetPanel.contains(DomHelper.getActiveElement() ?? null);
        nextFeatureButton.focus();
        nextFeatureButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
        const focusStayedWithinAfterArrow = targetPanel.contains(DomHelper.getActiveElement() ?? null);
        const featureIndexBeforeResultChange = getStoreDetailsCurrentFeatureIndex(mapId);
        nextFeatureButton.click();
        await DomHelper.waitForReactIdle();
        const resultChangedAfterNavigation = getStoreDetailsCurrentFeatureIndex(mapId) !== featureIndexBeforeResultChange;
        targetPanel.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
        const focusStayedWithinAfterResultChange = targetPanel.contains(DomHelper.getActiveElement() ?? null);

        test.addStep('Pressing Escape within the feature sub-panel after navigation and mouse movement...');
        const subPanelWasOpen = subPanel.getClientRects().length > 0;
        pressKey('Escape');
        await DomHelper.waitForReactIdle();
        const subPanelClosedAfterEscape = subPanel.getClientRects().length === 0;
        const detailsOpenAfterFirstEscape = getStoreUIActiveAppBarTab(mapId).isOpen;
        const focusAfterFirstEscape = DomHelper.getActiveElement()?.id;

        test.addStep('Pressing Escape from the parent layer item to close Details...');
        pressKey('Escape');
        await delay(TIMEOUT.dataPanelLoading);
        await DomHelper.waitForReactIdle();

        return {
          focusStayedWithinAfterTab,
          focusStayedWithinAfterArrow,
          resultChangedAfterNavigation,
          focusStayedWithinAfterResultChange,
          subPanelWasOpen,
          subPanelClosedAfterEscape,
          detailsOpenAfterFirstEscape,
          focusAfterFirstEscape,
          parentLayerItemId: availableLayerButton.id,
          detailsClosed: !getStoreUIActiveAppBarTab(mapId).isOpen,
          mapFocused: DomHelper.getActiveElement() === target,
          crosshairActive: getStoreAppIsCrosshairsActive(mapId),
          queryCount: queries.length,
        };
      },
      (test, result): void => {
        test.addStep('Verifying Tab focus remains inside Details...');
        Test.assertIsEqual(result.focusStayedWithinAfterTab, true);
        test.addStep('Verifying arrow-key focus remains inside Details...');
        Test.assertIsEqual(result.focusStayedWithinAfterArrow, true);
        test.addStep('Verifying keyboard result navigation changes the selected feature...');
        Test.assertIsEqual(result.resultChangedAfterNavigation, true);
        test.addStep('Verifying focus remains inside Details after switching results...');
        Test.assertIsEqual(result.focusStayedWithinAfterResultChange, true);
        Test.assertIsEqual(result.queryCount, 1);

        test.addStep('Verifying the feature sub-panel was open before Escape...');
        Test.assertIsEqual(result.subPanelWasOpen, true);
        test.addStep('Verifying the first Escape closes the feature sub-panel...');
        Test.assertIsEqual(result.subPanelClosedAfterEscape, true);
        test.addStep('Verifying Details remains open after the first Escape...');
        Test.assertIsEqual(result.detailsOpenAfterFirstEscape, true);
        test.addStep('Verifying the first Escape restores focus to the parent layer item...');
        Test.assertIsEqual(result.focusAfterFirstEscape, result.parentLayerItemId);

        test.addStep('Verifying the second Escape closes Details...');
        Test.assertIsEqual(result.detailsClosed, true);
        test.addStep('Verifying Escape restores map focus...');
        Test.assertIsEqual(result.mapFocused, true);
        test.addStep('Verifying Escape activates the crosshair...');
        Test.assertIsEqual(result.crosshairActive, true);
      },
      async (test): Promise<void> => {
        querySet.offQueryEnded(recordQuery);
        if (test.getStatus() === 'skipped') return;
        uiController.setCrosshairActive(false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(false);
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        view.setResolution(originalResolution);
        view.setCenter(originalCenter);
        viewer.map.renderSync();
        await DomHelper.waitForReactIdle();
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap(originalFocusItem);
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
        uiController.setCrosshairActive(originalCrosshair);
        setStoreMapPointerPosition(mapId, originalPointer ?? mapController.getMapCenterPosition());
        await DomHelper.waitForReactIdle();
      }
    );
  }

  /**
   * Tests that mouse input cancels query-origin Escape ownership and that mouse-open Details and Close keep current behavior.
   *
   * @returns A promise that resolves with fallback focus observations
   */
  testDetailsEscapeOwnershipCancellation(): Promise<Test<TypeDetailsEscapeCancellationResult>> {
    const mapId = this.getMapId();
    const viewer = this.getMapViewer();
    const view = viewer.getView();
    const { mapController, uiController, layerSetController } = this.getControllersRegistry();
    const querySet = layerSetController.featureInfoLayerSet;
    const originalFocus = DomHelper.getActiveElement();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalCrosshair = getStoreAppIsCrosshairsActive(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const originalCenter = view.getCenter()?.slice();
    const originalResolution = view.getResolution();
    const originalPointer = getStoreMapPointerPosition(mapId);
    const queries: Coordinate[] = [];

    /** Records completed queries for this test. */
    const recordQuery = (_sender: FeatureInfoLayerSet, event: QueryEndedEvent): void => {
      queries.push([...event.coordinate]);
    };

    /** Dispatches a key from the focused element inside this map. */
    const pressKey = (key: string, ctrlKey = false): void => {
      const activeElement = DomHelper.getActiveElementWithinMap(mapId);
      if (!activeElement) throw new TestError('Details Escape test requires focus inside its existing map');
      activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey, bubbles: true, cancelable: true }));
    };

    /** Checks whether focus currently belongs to the Details app-bar panel. */
    const hasDetailsFocus = (): boolean => {
      const activeElement = DomHelper.getActiveElement();
      return !!activeElement && !!DomHelper.getAppBarPanel(mapId, 'details')?.contains(activeElement);
    };

    return this.test(
      'Test Close, mouse input, and mouse-open Details keep their existing focus behavior',
      async (test): Promise<TypeDetailsEscapeCancellationResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const target = DomHelper.getMapTargetElement(mapId);
        const detailsButton = DomHelper.getAppBarButton(mapId, 'details');
        if (!target || !detailsButton) throw new TestError('The map target and Details button must be mounted');
        if (!target.ownerDocument.hasFocus()) throw new TestError('Keyboard focus tests require the browser page to be in the foreground');

        test.addStep('Preparing a crosshair query on the existing polygon layer...');
        await layerSetController.featureInfoLayerSet.waitForLayerToGetRegistered('geojsonLYR5/polygons.json');
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(undefined, false, false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(true);
        await mapController.zoomToLonLatExtentOrCoordinate(MULTI_FEATURE_QUERY_EXTENT, false);
        viewer.map.renderSync();
        await DomHelper.waitForReactIdle();
        mapController.synchronizeCrosshairPointerPosition();
        uiController.setCrosshairActive(true);
        target.focus();
        querySet.onQueryEnded(recordQuery);

        /** Runs a crosshair query and waits for Details focus. */
        const queryIntoDetails = async (): Promise<void> => {
          const startingQueryCount = queries.length;
          target.focus();
          await DomHelper.waitForReactIdle();
          pressKey('Enter');
          await whenThisThen(() => queries.length === startingQueryCount + 1, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
          await GVAbstractTester.waitForBatchedQueryPropagation(test);
          await whenThisThen(hasDetailsFocus, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        };

        await queryIntoDetails();
        const detailsPanel = DomHelper.getAppBarPanel(mapId, 'details');
        const closeButton = DomHelper.getAppBarPanelCloseButton(mapId, 'details');
        if (!detailsPanel) throw new TestError('The query-opened Details panel must be mounted');
        if (!closeButton) throw new TestError('The query-opened Details panel Close button must be mounted');

        const availableLayerButton = detailsPanel.querySelector<HTMLButtonElement>('ul button');
        if (!availableLayerButton) throw new TestError('The query-opened Details panel must list the available result layer');
        availableLayerButton.click();
        await whenThisThen(() => {
          const nextButton = detailsPanel.querySelector<HTMLButtonElement>(
            '[role="group"][aria-label="Feature navigation"] button[aria-label="Next feature"]'
          );
          return !!nextButton && nextButton.getAttribute('aria-disabled') !== 'true';
        }, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);

        const navigationGroup = detailsPanel.querySelector('[role="group"][aria-label="Feature navigation"]');
        const nextFeatureButton = navigationGroup?.querySelector<HTMLButtonElement>('button[aria-label="Next feature"]');
        const subPanel = nextFeatureButton?.closest<HTMLElement>('.responsive-layout-right-main');
        if (!nextFeatureButton || !subPanel) {
          throw new TestError('The query-opened Details panel must expose its feature sub-panel and navigation');
        }

        // Mouse input cancels query-origin ownership before the Escape sequence.
        test.addStep('Canceling query-origin Escape ownership with a mouse click on the next-result button...');
        const previousFeatureIndex = getStoreDetailsCurrentFeatureIndex(mapId);
        nextFeatureButton.focus();
        nextFeatureButton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
        nextFeatureButton.click();
        await DomHelper.waitForReactIdle();
        const resultChangedAfterMouseClick = getStoreDetailsCurrentFeatureIndex(mapId) !== previousFeatureIndex;
        test.addStep('Pressing Escape within the feature sub-panel after the mouse click...');
        const subPanelWasOpen = subPanel.getClientRects().length > 0;
        pressKey('Escape');
        await DomHelper.waitForReactIdle();
        const subPanelClosedAfterEscape = subPanel.getClientRects().length === 0;
        const detailsOpenAfterFirstEscape = getStoreUIActiveAppBarTab(mapId).isOpen;
        const focusAfterFirstEscape = DomHelper.getActiveElement()?.id;

        test.addStep('Pressing Escape from the parent layer item to close Details after mouse cancellation...');
        pressKey('Escape');
        await delay(TIMEOUT.dataPanelLoading);
        await DomHelper.waitForReactIdle();
        const mouseClickEscapeClosedDetails = !getStoreUIActiveAppBarTab(mapId).isOpen;
        const mouseClickEscapeReturnedToMap = DomHelper.getActiveElement() === DomHelper.getMapTargetElement(mapId);
        const crosshairInactiveAfterMouseClickEscape = !getStoreAppIsCrosshairsActive(mapId);

        test.addStep('Opening Details with the mouse, checking Escape, and closing with the Close button...');
        if (getStoreUIActiveAppBarTab(mapId).isOpen) {
          closeButton.click();
          await DomHelper.waitForReactIdle();
        }
        detailsButton.click();
        await whenThisThen(() => getStoreUIActiveAppBarTab(mapId).isOpen, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        closeButton.focus();
        pressKey('Escape');
        await delay(TIMEOUT.dataPanelLoading);
        await DomHelper.waitForReactIdle();
        const mouseOpenedDetailsUsedNormalReturn = DomHelper.getActiveElement() === detailsButton && !getStoreAppIsCrosshairsActive(mapId);
        if (getStoreUIActiveAppBarTab(mapId).isOpen) {
          closeButton.click();
          await DomHelper.waitForReactIdle();
        }
        if (!getStoreUIActiveAppBarTab(mapId).isOpen) {
          detailsButton.click();
          await whenThisThen(() => getStoreUIActiveAppBarTab(mapId).isOpen, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        }
        closeButton.click();
        await delay(TIMEOUT.dataPanelLoading);
        await DomHelper.waitForReactIdle();
        const closeButtonUsedNormalReturn = DomHelper.getActiveElement() === detailsButton && !getStoreAppIsCrosshairsActive(mapId);

        return {
          resultChangedAfterMouseClick,
          subPanelWasOpen,
          subPanelClosedAfterEscape,
          detailsOpenAfterFirstEscape,
          focusAfterFirstEscape,
          parentLayerItemId: availableLayerButton.id,
          mouseClickEscapeClosedDetails,
          mouseClickEscapeReturnedToMap,
          crosshairInactiveAfterMouseClickEscape,
          mouseOpenedDetailsUsedNormalReturn,
          closeButtonUsedNormalReturn,
        };
      },
      (test, result): void => {
        test.addStep('Verifying the result changed after the mouse click...');
        Test.assertIsEqual(result.resultChangedAfterMouseClick, true);
        test.addStep('Verifying the feature sub-panel was open before Escape...');
        Test.assertIsEqual(result.subPanelWasOpen, true);
        test.addStep('Verifying the first Escape closes the feature sub-panel after a mouse click...');
        Test.assertIsEqual(result.subPanelClosedAfterEscape, true);
        test.addStep('Verifying Details remains open after the first Escape...');
        Test.assertIsEqual(result.detailsOpenAfterFirstEscape, true);
        test.addStep('Verifying the first Escape restores focus to the parent layer item...');
        Test.assertIsEqual(result.focusAfterFirstEscape, result.parentLayerItemId);
        test.addStep('Verifying the second Escape after a mouse click closes Details...');
        Test.assertIsEqual(result.mouseClickEscapeClosedDetails, true);
        test.addStep('Verifying mouse cancellation prevents Escape from returning focus to the map...');
        Test.assertIsEqual(result.mouseClickEscapeReturnedToMap, false);
        test.addStep('Verifying the crosshair remains inactive after mouse-canceled Escape...');
        Test.assertIsEqual(result.crosshairInactiveAfterMouseClickEscape, true);
        test.addStep('Verifying mouse-open Details keeps its existing Escape behavior...');
        Test.assertIsEqual(result.mouseOpenedDetailsUsedNormalReturn, true);
        test.addStep('Verifying the Close button keeps its existing behavior...');
        Test.assertIsEqual(result.closeButtonUsedNormalReturn, true);
      },
      async (test): Promise<void> => {
        querySet.offQueryEnded(recordQuery);
        if (test.getStatus() === 'skipped') return;
        uiController.setCrosshairActive(false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(false);
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        view.setResolution(originalResolution);
        view.setCenter(originalCenter);
        viewer.map.renderSync();
        await DomHelper.waitForReactIdle();
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap(originalFocusItem);
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
        uiController.setCrosshairActive(originalCrosshair);
        setStoreMapPointerPosition(mapId, originalPointer ?? mapController.getMapCenterPosition());
        await DomHelper.waitForReactIdle();
      }
    );
  }

  /**
   * Tests that focus can leave query-opened Details' feature sub-panel and cancel its Escape focus return.
   *
   * @returns A promise that resolves with fallback focus observations
   */
  testDetailsEscapeFocusLeaveCancellation(): Promise<Test<TypeDetailsEscapeFocusLeaveResult>> {
    const mapId = this.getMapId();
    const viewer = this.getMapViewer();
    const view = viewer.getView();
    const { mapController, uiController, layerSetController } = this.getControllersRegistry();
    const querySet = layerSetController.featureInfoLayerSet;
    const originalFocus = DomHelper.getActiveElement();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalCrosshair = getStoreAppIsCrosshairsActive(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const originalCenter = view.getCenter()?.slice();
    const originalResolution = view.getResolution();
    const originalPointer = getStoreMapPointerPosition(mapId);
    const queries: Coordinate[] = [];

    /** Records completed queries for this test. */
    const recordQuery = (_sender: FeatureInfoLayerSet, event: QueryEndedEvent): void => {
      queries.push([...event.coordinate]);
    };

    /** Dispatches a key from the focused element inside this map. */
    const pressKey = (key: string, ctrlKey = false): void => {
      const activeElement = DomHelper.getActiveElementWithinMap(mapId);
      if (!activeElement) throw new TestError('Details Escape test requires focus inside its existing map');
      activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey, bubbles: true, cancelable: true }));
    };

    return this.test(
      'Test leaving query-opened Details cancels its Escape focus return',
      async (test): Promise<TypeDetailsEscapeFocusLeaveResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const target = DomHelper.getMapTargetElement(mapId);
        const detailsPanel = DomHelper.getAppBarPanel(mapId, 'details');
        const layersButton = DomHelper.getAppBarButton(mapId, 'layers');
        if (!target || !detailsPanel || !layersButton) throw new TestError('Map, Details, and Layers controls must be mounted');
        if (!target.ownerDocument.hasFocus()) throw new TestError('Keyboard focus tests require the browser page to be in the foreground');

        test.addStep('Preparing one crosshair query on the existing polygon layer...');
        await layerSetController.featureInfoLayerSet.waitForLayerToGetRegistered('geojsonLYR5/polygons.json');
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(undefined, false, false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(true);
        await mapController.zoomToLonLatExtentOrCoordinate(MULTI_FEATURE_QUERY_EXTENT, false);
        viewer.map.renderSync();
        await DomHelper.waitForReactIdle();
        mapController.synchronizeCrosshairPointerPosition();
        uiController.setCrosshairActive(true);
        target.focus();
        querySet.onQueryEnded(recordQuery);

        test.addStep('Querying from the active crosshair and focusing the Details feature sub-panel...');
        await DomHelper.waitForReactIdle();
        pressKey('Enter');
        await whenThisThen(() => queries.length === 1, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        await GVAbstractTester.waitForBatchedQueryPropagation(test);
        await DomHelper.waitForReactIdle();
        const layerButton = detailsPanel.querySelector<HTMLButtonElement>('ul button');
        if (!layerButton) throw new TestError('The query-opened Details panel must list the available result layer');
        layerButton.click();
        await DomHelper.waitForReactIdle();
        const nextFeatureButton = detailsPanel.querySelector<HTMLButtonElement>(
          '[role="group"][aria-label="Feature navigation"] button[aria-label="Next feature"]'
        );
        const subPanel = nextFeatureButton?.closest<HTMLElement>('.responsive-layout-right-main-content');
        if (!nextFeatureButton || !subPanel?.getClientRects().length)
          throw new TestError('Details must expose its feature sub-panel and navigation controls');
        nextFeatureButton.focus();
        await DomHelper.waitForReactIdle();
        const subPanelFocusedBeforeLeaving = DomHelper.getActiveElement() === nextFeatureButton;

        // Moving focus outside Details cancels the pending return to the crosshair.
        test.addStep('Moving focus from the feature sub-panel to Layers and waiting for focus effects...');
        layersButton.focus();
        await DomHelper.waitForReactIdle();
        const focusAfterLeaving = DomHelper.getActiveElement()?.id;

        test.addStep('Pressing Escape after leaving the Details feature sub-panel...');
        pressKey('Escape');
        await DomHelper.waitForReactIdle();
        const focusAfterEscape = DomHelper.getActiveElement();

        return {
          subPanelFocusedBeforeLeaving,
          focusAfterLeaving,
          outsideControlId: layersButton.id,
          focusReturnedToMapAfterEscape: focusAfterEscape === target,
          focusRemainsOnLayersButton: focusAfterEscape === layersButton,
          crosshairInactiveAfterEscape: !getStoreAppIsCrosshairsActive(mapId),
        };
      },
      (test, result): void => {
        test.addStep('Verifying focus started inside the Details feature sub-panel...');
        Test.assertIsEqual(result.subPanelFocusedBeforeLeaving, true);
        test.addStep('Verifying focus stays on Layers instead of being pulled back into Details...');
        Test.assertIsEqual(result.focusAfterLeaving, result.outsideControlId);
        test.addStep('Verifying Escape keeps focus on Layers after leaving Details...');
        Test.assertIsEqual(result.focusRemainsOnLayersButton, true);
        test.addStep('Verifying Escape does not return focus to the map after it leaves Details...');
        Test.assertIsEqual(result.focusReturnedToMapAfterEscape, false);
        test.addStep('Verifying Escape leaves the crosshair inactive after focus leaves Details...');
        Test.assertIsEqual(result.crosshairInactiveAfterEscape, true);
      },
      async (test): Promise<void> => {
        querySet.offQueryEnded(recordQuery);
        if (test.getStatus() === 'skipped') return;
        uiController.setCrosshairActive(false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(false);
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        view.setResolution(originalResolution);
        view.setCenter(originalCenter);
        viewer.map.renderSync();
        await DomHelper.waitForReactIdle();
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap(originalFocusItem);
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
        uiController.setCrosshairActive(originalCrosshair);
        setStoreMapPointerPosition(mapId, originalPointer ?? mapController.getMapCenterPosition());
        await DomHelper.waitForReactIdle();
      }
    );
  }

  /**
   * Tests Ctrl+M is ignored while Export is open.
   *
   * @param withFormatDropdown - Whether to press the shortcut from Export's portaled format dropdown
   * @returns A promise that resolves with Export modal and keyboard notification observations
   */
  testKeyboardShortcutIgnoredForExportModal(withFormatDropdown = false): Promise<Test<TypeExportModalShortcutResult>> {
    const mapId = this.getMapId();
    const viewer = this.getMapViewer();
    const { uiController } = this.getControllersRegistry();
    const originalFocus = DomHelper.getActiveElement();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalCrosshair = getStoreAppIsCrosshairsActive(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const keyboardEvents: KeyboardEvent[] = [];
    let exportDialog: HTMLElement | undefined;
    let formatDropdown: HTMLElement | undefined;
    let formatSelect: HTMLElement | undefined;

    /** Dispatches a key from the currently focused element, whether inside or outside the viewer root, and returns whether its default was prevented. */
    const pressActiveKey = (key: string, ctrlKey = false): boolean => {
      const activeElement = DomHelper.getActiveElement();
      if (!activeElement) throw new TestError('Export modal keyboard test requires an active element');
      return !activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey, bubbles: true, cancelable: true }));
    };

    const keyboardEventDelegate = viewer.onMapKeyboardEvent((_sender, event) => {
      keyboardEvents.push(event.keyboardEvent);
    });

    return this.test(
      withFormatDropdown
        ? 'Test Ctrl+M does nothing while Export format dropdown is open'
        : 'Test Ctrl+M does nothing while Export is open',
      async (test): Promise<TypeExportModalShortcutResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const exportButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'appBar-export-modal-btn');
        const mapTarget = DomHelper.getMapTargetElement(mapId);
        if (!exportButton || !mapTarget) throw new TestError('Export and map controls must be mounted');
        if (!mapTarget.ownerDocument.hasFocus())
          throw new TestError('Keyboard focus tests require the browser page to be in the foreground');

        test.addStep('Opening Export and pressing Ctrl+M from within its modal...');
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(undefined, false, false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(true);
        exportButton.focus();
        exportButton.click();
        await whenThisThen(() => {
          exportDialog =
            DomHelper.queryGVSelector<HTMLElement>(
              mapId,
              `#${CSS.escape(DomHelper.buildGVElementId(mapId, 'export-dialog'))} [role="dialog"][aria-modal="true"]`
            ) ?? undefined;
          return !!exportDialog;
        }, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        const openedExportDialog = exportDialog;
        if (!openedExportDialog) throw new TestError('The Export modal must be mounted after opening');
        const exportTitleInput = openedExportDialog.querySelector<HTMLInputElement>(`#${CSS.escape(`${mapId}-export-title-input`)}`);
        if (!exportTitleInput) throw new TestError('The open Export modal must contain its title input');
        if (!withFormatDropdown) exportTitleInput.focus();
        await whenThisThen(() => {
          const activeElement = DomHelper.getActiveElement();
          if (withFormatDropdown) return activeElement === exportTitleInput;
          return !!activeElement && openedExportDialog.contains(activeElement);
        }, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        const notificationsBeforeOrdinaryKey = keyboardEvents.length;
        pressActiveKey('x');
        const ordinaryKeyboardNotification = keyboardEvents.length > notificationsBeforeOrdinaryKey;
        const exportOpenBeforeShortcut = getStoreUIFocusItem(mapId).activeElementId === 'export';

        // The format list is portaled outside the dialog, so it needs its own focus observation.
        if (withFormatDropdown) {
          test.addStep('Opening the format dropdown and waiting for focus in its portaled list...');
          formatSelect = openedExportDialog.querySelector<HTMLElement>('[role="combobox"]') ?? undefined;
          if (!formatSelect) throw new TestError('Export must contain its format selector');
          formatSelect.focus();
          pressActiveKey('ArrowDown');
          await whenThisThen(() => {
            const listId = formatSelect?.getAttribute('aria-controls');
            formatDropdown = listId ? DomHelper.getGVElementByFullId(mapId, listId) : undefined;
            const activeElement = DomHelper.getActiveElement();
            return formatSelect?.getAttribute('aria-expanded') === 'true' && !!activeElement && !!formatDropdown?.contains(activeElement);
          }, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        }
        const dropdownExpandedBeforeShortcut = formatSelect?.getAttribute('aria-expanded') === 'true';
        test.addStep('Pressing Ctrl+M from the focused Export control...');
        const exportShortcutPrevented = pressActiveKey('m', true);
        await DomHelper.waitForReactIdle();
        const exportOpenAfterShortcut = getStoreUIFocusItem(mapId).activeElementId === 'export';
        const exportFocusAfter = DomHelper.getActiveElement();
        const exportFocusStayedInModal = !!exportDialog && !!exportFocusAfter && exportDialog.contains(exportFocusAfter);
        const exportShortcutNotifications = keyboardEvents.filter(
          (event) => (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'm'
        ).length;
        const crosshairAfterExportShortcut = getStoreAppIsCrosshairsActive(mapId);

        return {
          exportOpenBeforeShortcut,
          exportOpenAfterShortcut,
          exportFocusStayedInModal,
          exportShortcutNotifications,
          exportShortcutPrevented,
          crosshairAfterExportShortcut,
          ordinaryKeyboardNotification,
          dropdown: withFormatDropdown
            ? {
                expandedBeforeShortcut: dropdownExpandedBeforeShortcut,
                expandedAfterShortcut: formatSelect?.getAttribute('aria-expanded') === 'true',
                focusStayedInDropdown: !!exportFocusAfter && !!formatDropdown?.contains(exportFocusAfter),
                outsideDialog: !!formatDropdown && !openedExportDialog.contains(formatDropdown),
              }
            : undefined,
        };
      },
      (test, result): void => {
        test.addStep('Verifying Export remains open and focused, without crosshair or keyboard-notification side effects...');
        Test.assertIsEqual(result.exportOpenBeforeShortcut, true);
        Test.assertIsEqual(result.exportOpenAfterShortcut, true);
        if (withFormatDropdown) {
          Test.assertIsDefined('Export format dropdown observations', result.dropdown);
          test.addStep('Verifying the format dropdown was expanded outside the dialog before Ctrl+M...');
          Test.assertIsEqual(result.dropdown.expandedBeforeShortcut, true);
          Test.assertIsEqual(result.dropdown.outsideDialog, true);
          test.addStep('Verifying Ctrl+M leaves the format dropdown expanded...');
          Test.assertIsEqual(result.dropdown.expandedAfterShortcut, true);
          test.addStep('Verifying focus stays inside the format dropdown...');
          Test.assertIsEqual(result.dropdown.focusStayedInDropdown, true);
        } else {
          Test.assertIsEqual(result.exportFocusStayedInModal, true);
        }
        test.addStep('Verifying Ctrl+M sends no map keyboard notification...');
        Test.assertIsEqual(result.exportShortcutNotifications, 0);
        test.addStep('Verifying Ctrl+M prevents the browser default...');
        Test.assertIsEqual(result.exportShortcutPrevented, true);
        test.addStep('Verifying Ctrl+M leaves the crosshair inactive...');
        Test.assertIsEqual(result.crosshairAfterExportShortcut, false);

        test.addStep('Verifying ordinary keys also send no map keyboard notification while Export is open...');
        Test.assertIsEqual(result.ordinaryKeyboardNotification, false);
      },
      async (test): Promise<void> => {
        viewer.offMapKeyboardEvent(keyboardEventDelegate);
        if (test.getStatus() === 'skipped') return;

        // Close the portaled list first so it cannot retain focus during restoration.
        if (formatSelect?.getAttribute('aria-expanded') === 'true' && formatDropdown?.isConnected) {
          formatDropdown.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          await DomHelper.waitForReactIdle();
        }
        if (getStoreUIFocusItem(mapId).activeElementId === 'export') uiController.disableFocusTrap('no-focus');
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap(originalFocusItem);
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
        uiController.setCrosshairActive(originalCrosshair);
        await DomHelper.waitForReactIdle();
      }
    );
  }

  /**
   * Tests Ctrl+M is ignored while Share is open.
   *
   * @returns A promise that resolves with Share modal and keyboard notification observations
   */
  testKeyboardShortcutIgnoredForShareModal(): Promise<Test<TypeShareModalShortcutResult>> {
    const mapId = this.getMapId();
    const viewer = this.getMapViewer();
    const { uiController } = this.getControllersRegistry();
    const originalFocus = DomHelper.getActiveElement();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalCrosshair = getStoreAppIsCrosshairsActive(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const keyboardEvents: KeyboardEvent[] = [];
    let shareDialog: HTMLElement | undefined;

    /** Dispatches a key from the currently focused element outside the viewer root and returns whether its default was prevented. */
    const pressActiveKey = (key: string, ctrlKey = false): boolean => {
      const activeElement = DomHelper.getActiveElement();
      if (!activeElement) throw new TestError('Share modal keyboard test requires an active element');
      return !activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey, bubbles: true, cancelable: true }));
    };

    const keyboardEventDelegate = viewer.onMapKeyboardEvent((_sender, event) => {
      keyboardEvents.push(event.keyboardEvent);
    });

    return this.test(
      'Test Ctrl+M does nothing while Share is open',
      async (test): Promise<TypeShareModalShortcutResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const shareButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'share-button');
        if (!shareButton) throw new TestError('The Share button must be mounted');
        if (!shareButton.ownerDocument.hasFocus())
          throw new TestError('Keyboard focus tests require the browser page to be in the foreground');

        test.addStep('Opening Share and focusing its modal...');
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(undefined, false, false);
        uiController.disableFocusTrap('no-focus');
        uiController.setActiveTrapGeoView(true);
        shareButton.focus();
        shareButton.click();
        const shareDialogElement = await DomHelper.waitForDomElement(
          '[role="dialog"][aria-labelledby="share-dialog-title"][aria-modal="true"]',
          shareButton.ownerDocument.body,
          TestConstants.KEYBOARD_QUERY_TIMEOUT_MS
        );
        if (!(shareDialogElement instanceof HTMLElement)) throw new TestError('The open Share modal must be an HTML dialog');
        const openedShareDialog = shareDialogElement;
        shareDialog = openedShareDialog;
        const shareFocusTarget = openedShareDialog.querySelector<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex="0"]'
        );
        if (!shareFocusTarget) throw new TestError('The open Share modal must contain a focusable control');
        shareFocusTarget.focus();
        await whenThisThen(() => {
          const activeElement = DomHelper.getActiveElement();
          return !!activeElement && openedShareDialog.contains(activeElement);
        }, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);

        // Share lives outside the map root, unlike the viewer-owned Export dialog.
        test.addStep('Pressing Ctrl+M while focus is inside Share...');
        const shareFocusBefore = DomHelper.getActiveElement();
        const shareDialogOpenBeforeShortcut = openedShareDialog.getAttribute('aria-modal') === 'true';
        const shareActiveElementOutsideMap = !DomHelper.getActiveElementWithinMap(mapId);
        const shareShortcutPrevented = pressActiveKey('m', true);
        await DomHelper.waitForReactIdle();
        const shareFocusAfter = DomHelper.getActiveElement();
        const shareDialogOpenAfterShortcut = openedShareDialog.getAttribute('aria-modal') === 'true';

        return {
          shareDialogOpenBeforeShortcut,
          shareDialogOpenAfterShortcut,
          shareFocusStayedInModal:
            !!shareFocusBefore && shareFocusAfter === shareFocusBefore && openedShareDialog.contains(shareFocusAfter),
          shareActiveElementOutsideMap,
          shareShortcutPrevented,
          shareShortcutNotifications: keyboardEvents.filter((event) => (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'm')
            .length,
          crosshairRemainsInactive: !getStoreAppIsCrosshairsActive(mapId),
        };
      },
      (test, result): void => {
        test.addStep('Verifying Share remains open and focused, without notifying this map...');
        Test.assertIsEqual(result.shareDialogOpenBeforeShortcut, true);
        Test.assertIsEqual(result.shareDialogOpenAfterShortcut, true);
        Test.assertIsEqual(result.shareFocusStayedInModal, true);
        Test.assertIsEqual(result.shareActiveElementOutsideMap, true);
        // Share is outside the viewer root, so this viewer must leave the browser default alone.
        Test.assertIsEqual(result.shareShortcutPrevented, false);
        Test.assertIsEqual(result.shareShortcutNotifications, 0);
        Test.assertIsEqual(result.crosshairRemainsInactive, true);
      },
      async (test): Promise<void> => {
        viewer.offMapKeyboardEvent(keyboardEventDelegate);
        if (test.getStatus() === 'skipped') return;
        if (shareDialog?.isConnected) {
          shareDialog.querySelectorAll<HTMLButtonElement>('button').item(1)?.click();
          await DomHelper.waitForReactIdle();
        }
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap(originalFocusItem);
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
        uiController.setCrosshairActive(originalCrosshair);
        await DomHelper.waitForReactIdle();
      }
    );
  }

  /**
   * Tests shortcut isolation for overlays and keyboard entry and exit for fullscreen dialogs.
   *
   * @param kind - The modal to open
   * @returns A promise that resolves with modal and shortcut observations
   */
  testKeyboardShortcutIgnoredForOverlay(kind: TypeOverlayKind): Promise<Test<TypeOverlayShortcutResult>> {
    const mapId = kind === 'legend fullscreen' || kind === 'basic table' ? A11yEntryTester.COMPANION_ID : this.getMapId();
    const viewer = this.getApi().getMapViewer(mapId);
    const { uiController } = viewer.controllers;
    const originalFocus = DomHelper.getActiveElement();
    const originalMode = getStoreUIActiveTrapGeoView(mapId);
    const originalCrosshair = getStoreAppIsCrosshairsActive(mapId);
    const originalFocusItem = getStoreUIFocusItem(mapId);
    const originalAppBar = getStoreUIActiveAppBarTab(mapId);
    const originalFooterBar = getStoreUIActiveFooterBarTab(mapId);
    const keyboardEvents: KeyboardEvent[] = [];
    let dialog: HTMLElement | undefined;
    let closeButton: HTMLButtonElement | undefined;
    const fullscreen = kind === 'fullscreen' || kind === 'legend fullscreen';

    const keyboardEventDelegate = viewer.onMapKeyboardEvent((_sender, event) => {
      keyboardEvents.push(event.keyboardEvent);
    });

    return this.test(
      fullscreen ? `Test fullscreen keyboard isolation: ${kind}` : `Test Ctrl+M does nothing while ${kind} is open`,
      async (test): Promise<TypeOverlayShortcutResult> => {
        A11yEntryTester.requireVisibleViewers(this.getMapId());
        const panelId = kind === 'legend fullscreen' ? 'legend' : 'layers';
        await this.#prepareOverlayPanel(test, mapId, kind, panelId);

        test.addStep(`Opening the ${kind} dialog...`);
        ({ dialog, closeButton } = await A11yUxTester.#openOverlay(mapId, kind, panelId));
        const context = { mapId, kind, panelId, dialog, closeButton, keyboardEvents };

        // Keep the dialog references before waiting so finalization can close it on timeout.
        await A11yUxTester.#waitForOverlayFocus(context);
        return this.#exerciseOverlayShortcuts(test, context);
      },
      (test, result): void => {
        test.addStep('Verifying Ctrl+M from the landing focus keeps the dialog and focus, and prevents the browser default...');
        Test.assertIsEqual(result.landingDialogOpen, true);
        Test.assertIsEqual(result.landingFocusUnchanged, true);
        Test.assertIsEqual(result.landingPrevented, true);
        test.addStep('Verifying Ctrl+M from the escaped focus prevents the browser default...');
        Test.assertIsEqual(result.escapedPrevented, true);
        test.addStep('Verifying the dialog remains open...');
        Test.assertIsEqual(result.dialogOpenBefore, true);
        Test.assertIsEqual(result.dialogOpenAfter, true);
        test.addStep('Verifying focus remains unchanged...');
        Test.assertIsEqual(result.focusUnchanged, true);
        test.addStep('Verifying the app-bar panel remains open...');
        Test.assertIsEqual(result.appBarOpenBefore, true);
        Test.assertIsEqual(result.appBarOpenAfter, true);
        if (fullscreen) {
          Test.assertIsDefined('Fullscreen keyboard observations', result.fullscreenKeyboard);
          const keyboard = result.fullscreenKeyboard;
          test.addStep('Verifying neither Tab direction redirects focus and the entry prompt stays closed...');
          Test.assertIsEqual(keyboard.tabFocusStayed[0], true);
          Test.assertIsEqual(keyboard.tabFocusStayed[1], true);
          Test.assertIsEqual(keyboard.promptOpened, false);
          if (kind === 'legend fullscreen') {
            test.addStep('Verifying backward traversal through the start sentinel wraps to Close...');
            Test.assertIsEqual(keyboard.legendReverseTabWrapped, true);
          }
          test.addStep('Verifying Ctrl+Q is ignored in fullscreen but exits keyboard mode after close...');
          Test.assertIsEqual(keyboard.ctrlQHandledInDialog, false);
          Test.assertIsEqual(keyboard.modeStayedEnabled, true);
          Test.assertIsEqual(keyboard.ctrlQFocusStayed, true);
          Test.assertIsEqual(keyboard.ctrlQHandledAfterClose, true);
          Test.assertIsEqual(keyboard.modeExitedAfterClose, true);
          Test.assertIsEqual(keyboard.focusReturnedToSkipLink, true);
        }
        test.addStep('Verifying the footer and crosshair are unchanged and no map keyboard events are notified...');
        Test.assertIsEqual(result.footerUnchanged, true);
        Test.assertIsEqual(result.crosshairBefore, false);
        Test.assertIsEqual(result.crosshairAfter, false);
        Test.assertIsEqual(result.modalNotifications, 0);
      },
      async (test): Promise<void> => {
        viewer.offMapKeyboardEvent(keyboardEventDelegate);
        if (test.getStatus() === 'skipped') return;

        // Dismiss the overlay before restoring its underlying panels and focus owner.
        if (dialog?.isConnected && closeButton) {
          closeButton.click();
          await whenThisThen(() => !dialog?.isConnected, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        }
        uiController.setCrosshairActive(false);
        uiController.setActiveAppBarTab(originalAppBar.tabId, originalAppBar.isOpen, originalAppBar.isFocusTrapped ?? false);
        uiController.setActiveFooterBarTab(originalFooterBar.tabId || undefined, originalFooterBar.isOpen);
        uiController.setFooterBarIsOpen(originalFooterBar.isOpen);
        uiController.setActiveTrapGeoView(originalMode);
        uiController.enableFocusTrap(originalFocusItem);
        await DomHelper.waitForReactIdle();
        await delay(MODAL_FOCUS_SETTLE_MS);
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
        uiController.setCrosshairActive(originalCrosshair);
        await DomHelper.waitForReactIdle();
      }
    );
  }

  /**
   * Tests that a companion viewer's modal does not block this viewer's shortcut.
   *
   * @returns A promise that resolves with the two-viewer observations
   */
  testModalShortcutViewerIsolation(): Promise<Test<TypeModalIsolationResult>> {
    const mapId = this.getMapId();
    const companionId = A11yEntryTester.COMPANION_ID;
    const viewer = this.getMapViewer();
    const companion = this.getApi().getMapViewer(companionId);
    const ui = viewer.controllers.uiController;
    const companionUI = companion.controllers.uiController;
    const originalFocus = DomHelper.getActiveElement();
    const originalState = [mapId, companionId].map((id) => ({
      id,
      appBar: getStoreUIActiveAppBarTab(id),
      focusItem: getStoreUIFocusItem(id),
      mode: getStoreUIActiveTrapGeoView(id),
      crosshair: getStoreAppIsCrosshairsActive(id),
    }));
    let dialog: HTMLElement | undefined;
    let notifications = 0;
    const delegate = viewer.onMapKeyboardEvent((_sender, event) => {
      if ((event.keyboardEvent.ctrlKey || event.keyboardEvent.metaKey) && event.keyboardEvent.key.toLowerCase() === 'm') notifications += 1;
    });

    return this.test(
      'Test a companion modal does not block Ctrl+M in this viewer',
      async (test): Promise<TypeModalIsolationResult> => {
        A11yEntryTester.requireVisibleViewers(mapId);
        const layers = DomHelper.getAppBarButton(mapId, 'layers');
        const legend = DomHelper.getAppBarButton(companionId, 'legend');
        const target = DomHelper.getMapTargetElement(mapId);
        if (!layers || !legend || !target || !target.ownerDocument.hasFocus()) {
          throw new TestError('Both viewers and the foreground page are required for modal isolation');
        }
        ui.disableFocusTrap('no-focus');
        companionUI.disableFocusTrap('no-focus');
        ui.setActiveAppBarTab(undefined, false, false);
        companionUI.setActiveAppBarTab(undefined, false, false);
        ui.setCrosshairActive(false);
        companionUI.setCrosshairActive(false);
        ui.setActiveTrapGeoView(false);
        companionUI.setActiveTrapGeoView(false);
        await DomHelper.waitForReactIdle();
        layers.click();
        await DomHelper.waitForReactIdle();
        const layersClose = DomHelper.getGVElementById(mapId, 'appBar-layers-panel-close-btn');
        if (!layersClose) throw new TestError('The Layers close button must be mounted');
        await whenThisThen(() => DomHelper.getActiveElement() === layersClose, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        legend.click();
        await DomHelper.waitForReactIdle();
        const legendClose = DomHelper.getGVElementById(companionId, 'appBar-legend-panel-close-btn');
        if (!legendClose) throw new TestError('The companion Legend close button must be mounted');
        await whenThisThen(() => DomHelper.getActiveElement() === legendClose, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        const button = DomHelper.getAppBarPanel(companionId, 'legend')?.querySelector<HTMLButtonElement>(
          'button[aria-label="Ouvrir en plein écran"]'
        );
        if (!button) throw new TestError('The companion Legend fullscreen button must be mounted');
        test.addStep('Opening the companion Legend and immediately pressing Ctrl+M in the first viewer...');
        button.click();
        await whenThisThen(
          () => {
            dialog = DomHelper.queryGVSelector<HTMLElement>(companionId, '[role="dialog"][aria-modal="true"]');
            return !!dialog;
          },
          TestConstants.KEYBOARD_QUERY_TIMEOUT_MS,
          10
        );

        // Dispatch from the first viewer while the companion dialog is still mounted.
        layers.focus({ preventScroll: true });
        if (DomHelper.getActiveElement() !== layers) throw new TestError('The first viewer must have focus before Ctrl+M');
        const companionDialogOpen = !!dialog?.isConnected;
        const shortcutPrevented = !layers.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'm', ctrlKey: true, bubbles: true, cancelable: true })
        );
        return {
          companionDialogOpen,
          shortcutPrevented,
          mainPanelClosed: !getStoreUIActiveAppBarTab(mapId).isOpen,
          companionPanelOpen: getStoreUIActiveAppBarTab(companionId).isOpen,
          mainCrosshair: getStoreAppIsCrosshairsActive(mapId),
          notifications,
        };
      },
      (test, result): void => {
        test.addStep('Verifying the shortcut affects only the focused viewer while the companion modal is open...');
        Test.assertIsEqual(result.companionDialogOpen, true);
        Test.assertIsEqual(result.mainPanelClosed, true);
        Test.assertIsEqual(result.companionPanelOpen, true);
        Test.assertIsEqual(result.mainCrosshair, true);
        Test.assertIsEqual(result.notifications, 1);
        Test.assertIsEqual(result.shortcutPrevented, true);
      },
      async (test): Promise<void> => {
        viewer.offMapKeyboardEvent(delegate);
        if (test.getStatus() === 'skipped') return;

        // Close the companion dialog before restoring each viewer's independent state.
        if (dialog?.isConnected) {
          dialog.querySelector<HTMLButtonElement>('button')?.click();
          await whenThisThen(() => !dialog?.isConnected, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
        }
        originalState.forEach(({ id, appBar, focusItem, mode }) => {
          const controller = this.getApi().getMapViewer(id).controllers.uiController;
          controller.setActiveAppBarTab(appBar.tabId, appBar.isOpen, appBar.isFocusTrapped ?? false);
          controller.setActiveTrapGeoView(mode);
          controller.enableFocusTrap(focusItem);
        });
        await DomHelper.waitForReactIdle();
        if (originalFocus instanceof HTMLElement && originalFocus.isConnected) originalFocus.focus({ preventScroll: true });
        originalState.forEach(({ id, crosshair }) => this.getApi().getMapViewer(id).controllers.uiController.setCrosshairActive(crosshair));
      }
    );
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Prepares the viewer and waits for its app-bar panel to finish taking focus.
   *
   * @param test - The test receiving execution steps
   * @param mapId - The viewer that owns the overlay
   * @param kind - The overlay to prepare
   * @param panelId - The app-bar panel that stays open behind the overlay
   * @returns A promise that resolves when the panel is ready
   */
  async #prepareOverlayPanel(test: Test, mapId: string, kind: TypeOverlayKind, panelId: string): Promise<void> {
    const panelButton = DomHelper.getAppBarButton(mapId, panelId);
    const mapTarget = DomHelper.getMapTargetElement(mapId);
    if (!panelButton || !mapTarget) throw new TestError('The app-bar and map controls must be mounted');
    if (!mapTarget.ownerDocument.hasFocus()) throw new TestError('Keyboard focus tests require the browser page to be in the foreground');

    test.addStep('Preparing the viewer and its app-bar panel...');
    const { uiController } = this.getApi().getMapViewer(mapId).controllers;
    uiController.closeMapPopovers();
    uiController.setCrosshairActive(false);
    uiController.setActiveAppBarTab(undefined, false, false);
    uiController.disableFocusTrap('no-focus');
    uiController.setActiveTrapGeoView(false);
    if (kind === 'lightbox' || kind === 'feature detail') {
      uiController.setActiveFooterBarTab('data-table');
      await DomHelper.waitForReactIdle();
      const layerButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'footerBar-data-table-geojsonLYR5/polygons.json');
      if (!layerButton) throw new TestError('The Polygons Data Table layer must be mounted');
      await whenThisThen(() => !layerButton.disabled, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
      layerButton.click();
    }
    await DomHelper.waitForReactIdle();
    panelButton.click();
    await whenThisThen(
      () => getStoreUIActiveAppBarTab(mapId).isOpen && getStoreUIActiveAppBarTab(mapId).tabId === panelId,
      TestConstants.KEYBOARD_QUERY_TIMEOUT_MS
    );
    await DomHelper.waitForReactIdle();
    const panelClose = DomHelper.getGVElementById(mapId, `appBar-${panelId}-panel-close-btn`);
    if (!panelClose) throw new TestError('The app-bar panel close button must be mounted');

    // The panel focuses its close button after opening; let that finish before opening the dialog.
    await whenThisThen(() => DomHelper.getActiveElement() === panelClose, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
  }

  /**
   * Records Ctrl+M isolation from the landing focus and from outside the dialog paper.
   *
   * @param test - The test receiving execution steps
   * @param context - The open overlay and its viewer
   * @returns A promise that resolves with the unchanged overlay and keyboard observations
   */
  async #exerciseOverlayShortcuts(test: Test, context: TypeOverlayTestContext): Promise<TypeOverlayShortcutResult> {
    const { mapId, kind, panelId, dialog, keyboardEvents } = context;
    const { landingFocus, landingPrevented, landingFocusUnchanged, landingDialogOpen } = await A11yUxTester.#exerciseOverlayLandingShortcut(
      test,
      dialog
    );

    const escapedFocus = kind === 'lightbox' ? DomHelper.getGVElementById<HTMLElement>(mapId, 'wcag-toplink') : dialog.parentElement;
    if (!escapedFocus || dialog.contains(escapedFocus)) throw new TestError('The escaped-focus target must be outside the dialog');
    escapedFocus.focus({ preventScroll: true });
    await delay(MODAL_FOCUS_SETTLE_MS);

    const focusBefore = DomHelper.getActiveElement();
    const appBarBefore = getStoreUIActiveAppBarTab(mapId);
    const footerBefore = getStoreUIActiveFooterBarTab(mapId);
    const crosshairBefore = getStoreAppIsCrosshairsActive(mapId);
    if (focusBefore !== escapedFocus)
      throw new TestError(`Focus must be on the escaped-focus target before Ctrl+M (observed ${focusBefore?.outerHTML.slice(0, 180)})`);
    const dialogOpenBefore = dialog.isConnected && dialog.getAttribute('aria-modal') === 'true';
    test.addStep('Pressing Ctrl+M from outside the dialog paper...');
    focusBefore.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true, bubbles: true, cancelable: true }));
    const escapedPrevented = !focusBefore.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'm', ctrlKey: true, bubbles: true, cancelable: true })
    );
    await DomHelper.waitForReactIdle();
    const appBarAfter = getStoreUIActiveAppBarTab(mapId);
    const footerAfter = getStoreUIActiveFooterBarTab(mapId);
    const focusUnchanged = DomHelper.getActiveElement() === focusBefore;
    const crosshairAfter = getStoreAppIsCrosshairsActive(mapId);
    const dialogOpenAfter = dialog.isConnected && dialog.getAttribute('aria-modal') === 'true';
    const modalNotifications = keyboardEvents.length;
    let fullscreenKeyboard: TypeFullscreenKeyboardResult | undefined;
    if (kind === 'fullscreen' || kind === 'legend fullscreen') {
      fullscreenKeyboard = await this.#exerciseFullscreenKeyboard(test, context, landingFocus);
    }
    return {
      landingPrevented,
      landingFocusUnchanged,
      landingDialogOpen,
      escapedPrevented,
      dialogOpenBefore,
      dialogOpenAfter,
      focusUnchanged,
      appBarOpenBefore: appBarBefore.isOpen && appBarBefore.tabId === panelId,
      appBarOpenAfter: appBarAfter.isOpen && appBarAfter.tabId === panelId,
      footerUnchanged: footerBefore.isOpen === footerAfter.isOpen && footerBefore.tabId === footerAfter.tabId,
      crosshairBefore,
      crosshairAfter,
      modalNotifications,
      fullscreenKeyboard,
    };
  }

  /**
   * Exercises fullscreen Tab isolation, entry suppression, and Ctrl+Q before and after closing.
   *
   * @param test - The test receiving execution steps
   * @param context - The fullscreen overlay and its viewer
   * @param landingFocus - The control focused when the overlay opened
   * @returns A promise that resolves with the fullscreen entry and exit observations
   */
  async #exerciseFullscreenKeyboard(
    test: Test,
    context: TypeOverlayTestContext,
    landingFocus: HTMLElement
  ): Promise<TypeFullscreenKeyboardResult> {
    const { mapId, kind, panelId, dialog, closeButton } = context;
    const { uiController } = this.getApi().getMapViewer(mapId).controllers;
    test.addStep('Dispatching Tab and Shift+Tab inside the fullscreen dialog before enabling keyboard mode...');
    let legendReverseTabWrapped: boolean | undefined;
    const tabFocusStayed = [false, true].map((shiftKey): boolean => {
      landingFocus.focus();
      landingFocus.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', shiftKey, bubbles: true, cancelable: true }));
      return DomHelper.getActiveElement() === landingFocus;
    });
    if (kind === 'legend fullscreen') {
      const startSentinel = dialog.closest('.MuiDialog-root')?.querySelector<HTMLElement>('[data-testid="sentinelStart"]');
      if (!startSentinel) throw new TestError('The Legend fullscreen start sentinel must be mounted');

      // Synthetic Shift+Tab records the direction but does not move focus. Reproduce the browser's next focus step.
      startSentinel.focus();
      legendReverseTabWrapped = DomHelper.getActiveElement() === closeButton;
    }
    const topLink = DomHelper.getWCAGTopLink(mapId);
    if (!topLink) throw new TestError('The viewer entry link must be mounted');

    // Exercise the entry-link handler even if the dialog's focus trap prevents reaching the link.
    topLink.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true, cancelable: true }));
    await DomHelper.waitForReactIdle();
    const promptOpened = !!DomHelper.getGVElementById(mapId, 'wcag-dialog-title');
    if (promptOpened) {
      DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'skip-focus')?.click();
      await whenThisThen(() => !DomHelper.getGVElementById(mapId, 'wcag-dialog-title'), TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
    }

    test.addStep('Pressing Ctrl+Q with keyboard mode enabled, then repeating after closing the dialog...');
    uiController.setActiveTrapGeoView(true);
    await DomHelper.waitForReactIdle();
    landingFocus.focus();

    /** Dispatches the keyboard-mode exit shortcut and reports whether it was handled. */
    const dispatchCtrlQ = (target: HTMLElement): boolean =>
      !target.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', ctrlKey: true, bubbles: true, cancelable: true }));
    const ctrlQHandledInDialog = dispatchCtrlQ(landingFocus);
    await DomHelper.waitForReactIdle();
    const modeStayedEnabled = getStoreUIActiveTrapGeoView(mapId);
    const ctrlQFocusStayed = DomHelper.getActiveElement() === landingFocus;
    closeButton.click();
    await whenThisThen(() => !dialog.isConnected, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
    const reopenedTrigger = A11yUxTester.#getFullscreenButton(mapId, kind, panelId);
    if (!reopenedTrigger) throw new TestError('The fullscreen trigger must be mounted again after close');
    await whenThisThen(() => DomHelper.getActiveElement() === reopenedTrigger, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);

    // Restore the precondition if the regression already turned keyboard mode off.
    uiController.setActiveTrapGeoView(true);
    await DomHelper.waitForReactIdle();
    const ctrlQHandledAfterClose = dispatchCtrlQ(reopenedTrigger);
    await DomHelper.waitForReactIdle();
    return {
      tabFocusStayed,
      legendReverseTabWrapped,
      promptOpened,
      ctrlQHandledInDialog,
      modeStayedEnabled,
      ctrlQFocusStayed,
      ctrlQHandledAfterClose,
      modeExitedAfterClose: !getStoreUIActiveTrapGeoView(mapId),
      focusReturnedToSkipLink: DomHelper.getActiveElement() === topLink,
    };
  }

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

  /**
   * Finds the fullscreen trigger in its owning app-bar panel.
   *
   * @param mapId - The viewer that owns the panel
   * @param kind - The fullscreen variant being tested
   * @param panelId - The app-bar panel containing the trigger
   * @returns The fullscreen trigger, or undefined when it is absent
   */
  static #getFullscreenButton(mapId: string, kind: TypeOverlayKind, panelId: string): HTMLButtonElement | undefined {
    return (
      DomHelper.getAppBarPanel(mapId, panelId)?.querySelector<HTMLButtonElement>(
        kind === 'fullscreen' ? 'button[aria-label^="Full screen,"]' : 'button[aria-label="Ouvrir en plein écran"]'
      ) ?? undefined
    );
  }

  /**
   * Opens the requested overlay and locates its close control for cleanup.
   *
   * @param mapId - The viewer that owns the overlay
   * @param kind - The overlay to open
   * @param panelId - The app-bar panel containing the fullscreen trigger
   * @returns A promise that resolves with the mounted overlay and its close control
   */
  static async #openOverlay(
    mapId: string,
    kind: TypeOverlayKind,
    panelId: string
  ): Promise<Pick<TypeOverlayTestContext, 'dialog' | 'closeButton'>> {
    let openButton: HTMLElement | undefined;
    if (kind === 'basic table') {
      const layer = DomHelper.getGVElementById<HTMLElement>(mapId, 'appBar-layers-geojsonLYR5/polygons.json');
      if (!layer) throw new TestError('The companion Polygons layer must be mounted');
      layer.click();
      await whenThisThen(() => {
        const tableButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'appBar-table-details');
        openButton = tableButton;
        return !!tableButton && !tableButton.disabled;
      }, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
    } else if (kind === 'fullscreen' || kind === 'legend fullscreen') {
      openButton = A11yUxTester.#getFullscreenButton(mapId, kind, panelId);
    } else if (kind === 'export') {
      openButton = DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'appBar-export-modal-btn');
    } else {
      await whenThisThen(() => {
        openButton =
          kind === 'lightbox'
            ? DomHelper.queryGVSelector<HTMLButtonElement>(mapId, 'button[id$="_myImages"]')
            : DomHelper.getGVElementById<HTMLButtonElement>(mapId, 'footerBar-table-details-btn-0');
        return !!openButton;
      }, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
    }
    if (!openButton) throw new TestError(`The ${kind} opening button must be mounted`);
    openButton.click();
    let dialog: HTMLElement | undefined;
    let closeButton: HTMLButtonElement | undefined;
    await whenThisThen(() => {
      dialog = DomHelper.queryGVSelector<HTMLElement>(
        mapId,
        kind === 'lightbox' ? '.yarl__root[role="dialog"][aria-modal="true"]' : '[role="dialog"][aria-modal="true"]'
      );
      closeButton = dialog?.querySelector<HTMLButtonElement>(kind === 'lightbox' ? 'button[aria-label="Close"]' : 'button') ?? undefined;
      return !!dialog && !!closeButton;
    }, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
    if (!dialog || !closeButton) throw new TestError('The overlay and its close button must be mounted');
    return { dialog, closeButton };
  }

  /**
   * Waits for the overlay's initial focus before shortcut observations begin.
   *
   * @param context - The open overlay and its expected landing control
   * @returns A promise that resolves after overlay focus settles
   */
  static async #waitForOverlayFocus({ mapId, kind, dialog, closeButton }: TypeOverlayTestContext): Promise<void> {
    await whenThisThen(() => {
      const settledFocus =
        kind === 'export' ? dialog.querySelector<HTMLInputElement>(`#${CSS.escape(`${mapId}-export-title-input`)}`) : closeButton;
      return !!settledFocus && DomHelper.getActiveElement() === settledFocus;
    }, TestConstants.KEYBOARD_QUERY_TIMEOUT_MS);
    if (kind === 'lightbox') await delay(MODAL_FOCUS_SETTLE_MS);
  }

  /**
   * Records Ctrl+M isolation at the control focused when the overlay opened.
   *
   * @param test - The test receiving execution steps
   * @param dialog - The mounted overlay dialog
   * @returns A promise that resolves with the initial focus and shortcut observations
   */
  static async #exerciseOverlayLandingShortcut(test: Test, dialog: HTMLElement): Promise<TypeOverlayLandingResult> {
    test.addStep('Pressing Ctrl+M from where focus lands after opening...');
    const landingFocus = DomHelper.getActiveElement();
    if (!(landingFocus instanceof HTMLElement) || !dialog.contains(landingFocus))
      throw new TestError('Focus must land inside the dialog after opening');
    const landingPrevented = !landingFocus.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'm', ctrlKey: true, bubbles: true, cancelable: true })
    );
    await DomHelper.waitForReactIdle();
    return {
      landingFocus,
      landingPrevented,
      landingFocusUnchanged: DomHelper.getActiveElement() === landingFocus,
      landingDialogOpen: dialog.isConnected && dialog.getAttribute('aria-modal') === 'true',
    };
  }

  // #endregion STATIC METHODS
}

// #region TYPES AND INTERFACES

/** Navbar panel ownership and Escape focus observations. */
interface TypeNavbarPanelFocusResult {
  /** Rendered button identifier. */
  buttonId: string;
  /** Focus owner while the panel was open. */
  ownerId: string | false;
  /** Focus callback while the panel was open. */
  callbackId: string | false;
  /** Whether the panel opened. */
  opened: boolean;
  /** Whether keyboard mode restored the same panel owner. */
  reacquiredOwnership: boolean;
  /** Whether the original content survived acquiring ownership. */
  preservedOnAcquire: boolean;
  /** Whether the original content survived releasing keyboard mode. */
  preservedOnRelease: boolean;
  /** Whether releasing keyboard mode kept the panel open. */
  stayedOpenOnRelease: boolean;
  /** Whether Escape closed the panel. */
  closed: boolean;
  /** Whether Escape returned focus to the button. */
  focusReturned: boolean;
}

/** Footer focus and ownership observations across Exit, collapse, and reopening. */
interface TypeFooterPanelReopenResult {
  /** Whether initial entry focused Exit. */
  initialExitFocused: boolean;
  /** Whether Exit returned focus to the tab. */
  exitReturnedFocus: boolean;
  /** Whether Exit left the panel open. */
  exitKeptPanelOpen: boolean;
  /** Whether Exit released focus ownership. */
  exitReleasedOwnership: boolean;
  /** Whether the next tab activation collapsed the panel. */
  collapsed: boolean;
  /** Whether collapse released focus ownership. */
  collapseReleasedOwnership: boolean;
  /** Whether the final tab activation reopened the panel. */
  reopened: boolean;
  /** Whether reopening focused Exit. */
  reopenExitFocused: boolean;
  /** Whether the reopened panel owns focus. */
  reopenOwnsFocus: boolean;
}

/** Focus observations across a Layers-to-Settings pointer sequence. */
interface TypeLayersSettingsFocusResult {
  /** Whether Settings retained the mousedown default focus before mouseup. */
  pointerFocusRetained: boolean;
  /** Whether the click opened Settings. */
  settingsOpened: boolean;
  /** Whether the Settings entry callback focused its switch. */
  switchReceivedFocus: boolean;
  /** Whether the switch retained focus without a transient departure. */
  switchKeptFocus: boolean;
}

/** Settings opening and page scroll observations. */
interface TypeSettingsScrollResult {
  /** Page scroll position before opening. */
  before: number;
  /** Page scroll position after opening. */
  after: number;
  /** Whether Settings opened. */
  open: boolean;
}

/** Pre-release Settings focus and post-click app-bar observations. */
interface TypeSettingsPointerClickAwayResult {
  /** Whether mousedown dismissed Settings before mouseup. */
  settingsClosedBeforeMouseUp: boolean;
  /** Whether Settings reclaimed focus during the press. */
  settingsRestoredBeforeMouseUp: boolean;
  /** The active app-bar tab after click. */
  activeTabAfterClick: string | undefined;
  /** Whether the active app-bar tab is open after click. */
  appBarOpenAfterClick: boolean;
}

/** Focus observations after dismissing the footer popover in native fullscreen. */
interface TypeFullscreenPopoverFocusResult {
  /** Whether the footer Tab step reached the Resize trigger. */
  resizeReached: boolean;
  /** Whether Close returned focus to Resize. */
  closeRestored: boolean;
  /** Whether the pointer commit closed Resize. */
  pointerClosed: boolean;
  /** The value displayed after the pointer commit. */
  pointerValue: number | undefined;
  /** The value selected by the pointer commit. */
  expectedPointerValue: number | undefined;
  /** Whether the pointer commit returned focus to Resize. */
  pointerFocusRestored: boolean;
  /** Whether leaving browser fullscreen unmounted Resize and its fullscreen-only trigger. */
  fullscreenControlsUnmounted: boolean;
  /** Whether focus lost when Resize unmounted returned to the navBar fullscreen button. */
  exitFocusRestored: boolean;
}

/** The initial overlay focus and its Ctrl+M isolation observations. */
interface TypeOverlayLandingResult extends Pick<
  TypeOverlayShortcutResult,
  'landingPrevented' | 'landingFocusUnchanged' | 'landingDialogOpen'
> {
  /** The control focused when the overlay opened. */
  landingFocus: HTMLElement;
}

/** The mounted overlay, owning viewer, and keyboard notification recorder. */
interface TypeOverlayTestContext {
  /** The viewer that owns the overlay. */
  mapId: string;
  /** The overlay variant exercised by this test. */
  kind: TypeOverlayKind;
  /** The app-bar panel that stays open behind the overlay. */
  panelId: string;
  /** The mounted modal dialog. */
  dialog: HTMLElement;
  /** The overlay's close control. */
  closeButton: HTMLButtonElement;
  /** Map keyboard notifications collected during the test. */
  keyboardEvents: KeyboardEvent[];
}

/** Details sub-panel and selected-feature observations across outer-panel dismissal and reopening. */
interface TypeDetailsReopenResult {
  /** The outer-panel dismissal method exercised. */
  dismissal: string;
  /** Whether the feature sub-panel was visible before dismissal. */
  subPanelOpenBefore: boolean;
  /** Whether dismissal closed the outer Details panel. */
  detailsClosed: boolean;
  /** Whether the feature sub-panel was hidden with the outer panel. */
  subPanelHiddenWithDetails: boolean;
  /** Whether the outer Details panel reopened. */
  detailsReopened: boolean;
  /** Whether the remembered feature sub-panel reopened. */
  subPanelReopened: boolean;
  /** The selected layer before dismissal. */
  selectedLayerPath: string;
  /** The selected layer after reopening. */
  reopenedLayerPath: string;
  /** The selected feature index before dismissal. */
  featureIndex: number;
  /** The selected feature index after reopening. */
  reopenedFeatureIndex: number;
}

/** Observations before and after returning from Details to the map with Ctrl+M. */
interface TypeKeyboardQueryFocusResult {
  /** The map target expected to receive shortcut focus. */
  mapTargetId: string;
  /** Coordinates of completed feature queries. */
  queries: Coordinate[];
  /** Focus and rendered-content observations for each query. */
  observations: {
    /** Whether this query should return features rather than the guide. */
    expectsFeatures: boolean;
    /** The coordinate expected for this query. */
    expectedCoordinate: Coordinate;
    /** The focused element ID after Ctrl+M, if any. */
    shortcutFocusId: string | undefined;
    /** Whether Ctrl+M activated the crosshair. */
    shortcutCrosshairActive: boolean;
    /** Whether Ctrl+M closed Details before querying. */
    detailsClosedAfterShortcut: boolean;
    /** The completed-query count immediately after Ctrl+M. */
    queryCountAfterShortcut: number;
    /** The focused element ID after the query, if any. */
    focusAfterQuery: string | undefined;
    /** The main Details Close button ID. */
    mainCloseId: string;
    /** IDs or tags that received focus outside Details after its main Close button. */
    focusDepartures: string[];
    /** Whether the query opened Details. */
    detailsOpenAfterQuery: boolean;
    /** Whether moving into Details deactivated the crosshair. */
    crosshairInactiveAfterQuery: boolean;
    /** Whether the right-hand sub-panel was visible. */
    subPanelVisible: boolean;
    /** Whether feature navigation was visible. */
    featuresVisible: boolean;
    /** Whether the no-features guide was visible. */
    guideVisible: boolean;
    /** Whether a previously closed sub-panel stayed closed before this query, when checked. */
    subPanelClosedBeforeQuery: boolean | undefined;
    /** Escape observations for queries that exercise immediate return to the map. */
    escape?: {
      /** Whether Escape closed Details. */
      detailsClosed: boolean;
      /** The focused element ID after Escape, if any. */
      focusId: string | undefined;
      /** Whether Escape reactivated the crosshair. */
      crosshairActive: boolean;
    };
  }[];
}

/** Ctrl+M focus, crosshair, app-bar, and footer observations. */
interface TypeKeyboardShortcutPanelsResult {
  /** Whether Details was open before Ctrl+M. */
  appBarWasOpen: boolean;
  /** Whether Ctrl+M closed Details. */
  appBarClosed: boolean;
  /** Whether closing Details focused the map. */
  mapFocusedAfterAppBar: boolean;
  /** Whether closing Details activated the crosshair. */
  crosshairActiveAfterAppBar: boolean;
  /** Whether the footer stayed unchanged when Details closed. */
  footerPreservedAfterAppBar: boolean;
  /** Whether Settings was open before Ctrl+M. */
  settingsWasOpen: boolean;
  /** Whether Ctrl+M closed Settings. */
  settingsClosedAfterShortcut: boolean;
  /** Whether closing Settings focused the map. */
  mapFocusedAfterPopover: boolean;
  /** Whether closing Settings activated the crosshair. */
  crosshairActiveAfterPopover: boolean;
  /** Whether the footer stayed unchanged when Settings closed. */
  footerPreservedAfterPopover: boolean;
  /** Whether the basemap popover was open before Ctrl+M. */
  basemapPopoverWasOpen: boolean;
  /** Whether Ctrl+M closed the basemap popover. */
  basemapPopoverClosed: boolean;
  /** Whether closing the basemap popover focused the map. */
  mapFocusedAfterMapPopover: boolean;
  /** Whether closing the basemap popover activated the crosshair. */
  crosshairActiveAfterMapPopover: boolean;
  /** Whether the footer stayed unchanged when the basemap popover closed. */
  footerPreservedAfterMapPopover: boolean;
  /** Whether Ctrl+M focused the map when no panel or popover was open. */
  mapFocusedWithNothingOpen: boolean;
  /** Whether Ctrl+M activated the crosshair when nothing was open. */
  crosshairActiveWithNothingOpen: boolean;
  /** Whether each Ctrl+M event prevented the browser default. */
  shortcutPrevented: boolean[];
}

/** Details focus ownership observations after an in-panel crosshair query. */
interface TypeCrosshairDetailsEscapeResult {
  /** Whether synthetic Tab kept focus inside Details. */
  focusStayedWithinAfterTab: boolean;
  /** Whether an arrow key kept focus inside Details. */
  focusStayedWithinAfterArrow: boolean;
  /** Whether Next changed the selected feature index. */
  resultChangedAfterNavigation: boolean;
  /** Whether result navigation kept focus inside Details. */
  focusStayedWithinAfterResultChange: boolean;
  /** Whether the feature sub-panel was open before Escape. */
  subPanelWasOpen: boolean;
  /** Whether the first Escape closed the feature sub-panel. */
  subPanelClosedAfterEscape: boolean;
  /** Whether the first Escape left the outer Details panel open. */
  detailsOpenAfterFirstEscape: boolean;
  /** The focused element ID after the first Escape, if any. */
  focusAfterFirstEscape: string | undefined;
  /** The parent layer item expected to receive the first Escape's focus. */
  parentLayerItemId: string;
  /** Whether the second Escape closed Details. */
  detailsClosed: boolean;
  /** Whether the second Escape focused the map target. */
  mapFocused: boolean;
  /** Whether the second Escape reactivated the crosshair. */
  crosshairActive: boolean;
  /** The number of completed queries. */
  queryCount: number;
}

/** Fallback focus observations after query-origin Details ownership is canceled. */
interface TypeDetailsEscapeCancellationResult {
  /** Whether clicking Next changed the selected feature index. */
  resultChangedAfterMouseClick: boolean;
  /** Whether the feature sub-panel was open before Escape. */
  subPanelWasOpen: boolean;
  /** Whether the first Escape closed the feature sub-panel. */
  subPanelClosedAfterEscape: boolean;
  /** Whether the first Escape left Details open. */
  detailsOpenAfterFirstEscape: boolean;
  /** The focused element ID after the first Escape, if any. */
  focusAfterFirstEscape: string | undefined;
  /** The parent layer item expected to receive the first Escape's focus. */
  parentLayerItemId: string;
  /** Whether the second Escape closed Details after mouse cancellation. */
  mouseClickEscapeClosedDetails: boolean;
  /** Whether mouse-canceled Escape incorrectly returned focus to the map. */
  mouseClickEscapeReturnedToMap: boolean;
  /** Whether the crosshair stayed inactive after mouse-canceled Escape. */
  crosshairInactiveAfterMouseClickEscape: boolean;
  /** Whether mouse-opened Details returned focus to its app-bar button on Escape. */
  mouseOpenedDetailsUsedNormalReturn: boolean;
  /** Whether Close returned focus to the Details app-bar button without activating the crosshair. */
  closeButtonUsedNormalReturn: boolean;
}

/** Fallback focus observations after keyboard focus leaves query-opened Details. */
interface TypeDetailsEscapeFocusLeaveResult {
  /** Whether the feature sub-panel owned focus before leaving Details. */
  subPanelFocusedBeforeLeaving: boolean;
  /** The focused element ID after leaving Details, if any. */
  focusAfterLeaving: string | undefined;
  /** The outside control expected to retain focus. */
  outsideControlId: string;
  /** Whether Escape incorrectly returned focus to the map after leaving Details. */
  focusReturnedToMapAfterEscape: boolean;
  /** Whether Escape kept focus on the Layers app-bar button. */
  focusRemainsOnLayersButton: boolean;
  /** Whether the crosshair stayed inactive after Escape. */
  crosshairInactiveAfterEscape: boolean;
}

/** Export modal and map keyboard notification observations after Ctrl+M. */
interface TypeExportModalShortcutResult {
  /** Whether Export was open before Ctrl+M. */
  exportOpenBeforeShortcut: boolean;
  /** Whether Export remained open after Ctrl+M. */
  exportOpenAfterShortcut: boolean;
  /** Whether Ctrl+M kept focus in Export. */
  exportFocusStayedInModal: boolean;
  /** The map keyboard notification count for the Export shortcut. */
  exportShortcutNotifications: number;
  /** Whether Ctrl+M prevented the browser default inside Export. */
  exportShortcutPrevented: boolean;
  /** Whether the crosshair was active after Ctrl+M inside Export. */
  crosshairAfterExportShortcut: boolean;
  /** Whether an ordinary key notified map keyboard listeners while Export was open. */
  ordinaryKeyboardNotification: boolean;
  /** Format-dropdown observations, absent when that variant is not exercised. */
  dropdown:
    | {
        /** Whether the format dropdown was expanded before Ctrl+M. */
        expandedBeforeShortcut: boolean;
        /** Whether the format dropdown remained expanded after Ctrl+M. */
        expandedAfterShortcut: boolean;
        /** Whether Ctrl+M kept focus inside the dropdown. */
        focusStayedInDropdown: boolean;
        /** Whether the dropdown was rendered outside the Export dialog paper. */
        outsideDialog: boolean;
      }
    | undefined;
}

/** Share modal observations after Ctrl+M. */
interface TypeShareModalShortcutResult {
  /** Whether Share was open before Ctrl+M. */
  shareDialogOpenBeforeShortcut: boolean;
  /** Whether Share remained open after Ctrl+M. */
  shareDialogOpenAfterShortcut: boolean;
  /** Whether Ctrl+M kept focus in Share. */
  shareFocusStayedInModal: boolean;
  /** Whether Share's focused control was outside the viewer root. */
  shareActiveElementOutsideMap: boolean;
  /** Whether Share prevented the Ctrl+M browser default. */
  shareShortcutPrevented: boolean;
  /** The map keyboard notification count while Share was open. */
  shareShortcutNotifications: number;
  /** Whether the crosshair stayed inactive while Share was open. */
  crosshairRemainsInactive: boolean;
}

/** Overlay variants covered by the shared keyboard-isolation test. */
type TypeOverlayKind = 'fullscreen' | 'legend fullscreen' | 'lightbox' | 'export' | 'basic table' | 'feature detail';

/** Overlay observations before and after viewer keyboard input. */
interface TypeOverlayShortcutResult {
  /** Whether Ctrl+M prevented the browser default at the initial dialog focus. */
  landingPrevented: boolean;
  /** Whether Ctrl+M preserved the initial dialog focus. */
  landingFocusUnchanged: boolean;
  /** Whether the dialog stayed open after Ctrl+M at the initial focus. */
  landingDialogOpen: boolean;
  /** Whether Ctrl+M prevented the browser default outside the dialog paper. */
  escapedPrevented: boolean;
  /** Whether the dialog was open before the escaped-focus shortcut. */
  dialogOpenBefore: boolean;
  /** Whether the dialog stayed open after the escaped-focus shortcut. */
  dialogOpenAfter: boolean;
  /** Whether the escaped-focus shortcut preserved focus. */
  focusUnchanged: boolean;
  /** Whether the expected app-bar panel was open before the shortcut. */
  appBarOpenBefore: boolean;
  /** Whether the expected app-bar panel stayed open after the shortcut. */
  appBarOpenAfter: boolean;
  /** Whether the shortcut preserved the footer tab and open state. */
  footerUnchanged: boolean;
  /** Whether the crosshair was active before the shortcut. */
  crosshairBefore: boolean;
  /** Whether the crosshair was active after the shortcut. */
  crosshairAfter: boolean;
  /** The map keyboard notification count before fullscreen entry and exit checks. */
  modalNotifications: number;
  /** Additional observations for fullscreen variants only. */
  fullscreenKeyboard?: TypeFullscreenKeyboardResult;
}

/** Entry and exit behavior while a fullscreen dialog is open and after it closes. */
interface TypeFullscreenKeyboardResult {
  /** Whether synthetic forward and reverse Tab retained focus inside the dialog. */
  tabFocusStayed: boolean[];
  /** Whether the Legend start sentinel wrapped reverse traversal to Close, when exercised. */
  legendReverseTabWrapped?: boolean;
  /** Whether the entry-link handler incorrectly opened a prompt behind fullscreen. */
  promptOpened: boolean;
  /** Whether Ctrl+Q was handled while fullscreen was open. */
  ctrlQHandledInDialog: boolean;
  /** Whether keyboard navigation stayed enabled after Ctrl+Q in fullscreen. */
  modeStayedEnabled: boolean;
  /** Whether Ctrl+Q preserved the dialog's focused control. */
  ctrlQFocusStayed: boolean;
  /** Whether Ctrl+Q was handled after fullscreen closed. */
  ctrlQHandledAfterClose: boolean;
  /** Whether Ctrl+Q exited keyboard navigation after fullscreen closed. */
  modeExitedAfterClose: boolean;
  /** Whether exiting keyboard navigation returned focus to the outer entry link. */
  focusReturnedToSkipLink: boolean;
}

/** Observations when another viewer has a modal open. */
interface TypeModalIsolationResult {
  /** Whether the companion viewer's modal stayed open after the shortcut. */
  companionDialogOpen: boolean;
  /** Whether the owning viewer prevented the shortcut's browser default. */
  shortcutPrevented: boolean;
  /** Whether the shortcut closed the owning viewer's app-bar panel. */
  mainPanelClosed: boolean;
  /** Whether the companion viewer's app-bar panel stayed open. */
  companionPanelOpen: boolean;
  /** Whether the shortcut activated the owning viewer's crosshair. */
  mainCrosshair: boolean;
  /** The owning viewer's map keyboard notification count. */
  notifications: number;
}

// #endregion TYPES AND INTERFACES
