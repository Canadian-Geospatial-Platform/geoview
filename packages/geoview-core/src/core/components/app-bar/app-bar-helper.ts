import type { Dispatch, SetStateAction } from 'react';

import type { TypeButtonPanel } from '@/ui/panel/panel-types';
import { DomHelper } from '@/core/utils/dom-helper';

import type { ButtonPanelType } from './app-bar';

/**
 * Opens or closes a specific panel by id, closing all other panels.
 *
 * @param buttonId - The id of the button panel to toggle
 * @param setterCallback - State setter for the button panels record
 * @param status - Whether the panel should be open (true) or closed (false)
 * @param isFocusTrapped - Optional whether focus should be trapped in the panel
 * @deprecated 2026-10-29 - Not used anymore - delete?
 */
export const helpOpenClosePanelByIdState = (
  buttonId: string,
  setterCallback: Dispatch<SetStateAction<ButtonPanelType>>,
  status: boolean,
  isFocusTrapped = false
): void => {
  // Open or Close it
  setterCallback((prevState) => {
    const panelGroups = {} as ButtonPanelType;
    Object.entries(prevState).forEach(([buttonPanelName, buttonPanel]) => {
      panelGroups[buttonPanelName] = {
        ...buttonPanel,
        ...(buttonPanel.panel && {
          panel: {
            ...buttonPanel.panel,
            status: buttonPanelName === buttonId ? status : false,
            isFocusTrapped: buttonPanelName === buttonId ? isFocusTrapped : false,
          },
        }),
      };
    });

    return panelGroups;
  });
};

/**
 * Opens a panel by id, closing all other panels.
 *
 * @param buttonId - The id of the button panel to open
 * @param setterCallback - State setter for the button panels record
 * @param isFocusTrapped - Optional whether focus should be trapped in the panel
 * @deprecated 2026-10-29 - Not used anymore - delete?
 */
export const helpOpenPanelById = (
  buttonId: string,
  setterCallback: Dispatch<SetStateAction<ButtonPanelType>>,
  isFocusTrapped?: boolean
): void => {
  // Open the panel
  helpOpenClosePanelByIdState(buttonId, setterCallback, true, isFocusTrapped);
};

/**
 * Closes a panel by id and returns focus to the originating button.
 *
 * If the originating button element is not found, the fallback callback is invoked instead.
 *
 * @param mapId - The map id used to locate the button element
 * @param buttonId - The id of the button panel to close
 * @param setterCallback - State setter for the button panels record
 * @param focusWhenNoElementCallback - Optional callback invoked when the button element cannot be found
 * @deprecated 2026-10-29 - Not used anymore - delete?
 */
export const helpClosePanelById = (
  mapId: string,
  buttonId: string,
  setterCallback: Dispatch<SetStateAction<Record<string, TypeButtonPanel>>>,
  focusWhenNoElementCallback?: () => void
): void => {
  // Close the panel
  helpOpenClosePanelByIdState(buttonId, setterCallback, false);

  const buttonElement = DomHelper.getAppBarButton(mapId, buttonId);
  if (buttonElement) {
    // Explicitly request focus indicator for keyboard users
    buttonElement.focus({ focusVisible: true });
  } else {
    // Nothing to put focus on, callback
    focusWhenNoElementCallback?.();
  }
};

/**
 * Closes all open panels.
 *
 * @param buttonPanels - The current button panels state
 * @param setterCallback - State setter for the button panels record
 * @deprecated 2026-10-29 - Not used anymore - delete?
 */
export const helpCloseAll = (buttonPanels: ButtonPanelType, setterCallback: Dispatch<SetStateAction<ButtonPanelType>>): void => {
  const panelGroups = {} as ButtonPanelType;
  Object.entries(buttonPanels).forEach(([buttonPanelName, buttonPanel]) => {
    panelGroups[buttonPanelName] = {
      ...buttonPanel,
      ...(buttonPanel.panel && { panel: { ...buttonPanel.panel, status: false } }),
    };
  });

  setterCallback(panelGroups);
};
