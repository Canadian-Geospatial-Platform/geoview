import type { Dispatch, SetStateAction } from 'react';

import type { TypeButtonPanel } from '@/ui/panel/panel-types';
import { CONTAINER_TYPE } from '@/core/utils/constant';

import type { ButtonPanelType } from './app-bar';

/**
 * Opens or closes a specific panel by id, closing all other panels.
 *
 * @param buttonId - The id of the button panel to toggle
 * @param setterCallback - State setter for the button panels record
 * @param status - Whether the panel should be open (true) or closed (false)
 * @param isFocusTrapped - Optional whether focus should be trapped in the panel
 */
export const helpOpenClosePanelByIdState = (
  buttonId: string,
  setterCallback: Dispatch<SetStateAction<ButtonPanelType>>,
  status: boolean,
  isFocusTrapped: boolean = false
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
 */
export const helpClosePanelById = (
  mapId: string,
  buttonId: string,
  setterCallback: Dispatch<SetStateAction<Record<string, TypeButtonPanel>>>,
  focusWhenNoElementCallback?: () => void
): void => {
  // Close the panel
  helpOpenClosePanelByIdState(buttonId, setterCallback, false);

  const buttonElementId = `${mapId}-${CONTAINER_TYPE.APP_BAR}-${buttonId}-panel-btn`;
  const buttonElement = document.getElementById(buttonElementId);
  if (buttonElement) {
    // put back focus on calling button
    buttonElement.focus();
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

/**
 * Sorts a source array so that items in the enforce array appear first in the specified order.
 *
 * Items not in the enforce array retain their original relative order.
 *
 * @param sourceArray - The array to sort
 * @param enforce - The ordered list of items to prioritize
 * @returns The sorted array with enforced items first
 */
export const enforceArrayOrder = (sourceArray: string[], enforce: string[]): string[] => {
  const filteredEnforce = enforce.filter((item) => sourceArray.includes(item)); // Filter out items not present in sourceArray
  const sortedArray = [...sourceArray].sort((a, b) => {
    const indexA = filteredEnforce.indexOf(a);
    const indexB = filteredEnforce.indexOf(b);

    // If both items are enforced, sort based on their positions in enforce
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only one of the items is enforced, prioritize it
    if (indexA !== -1) {
      return -1;
    }
    if (indexB !== -1) {
      return 1;
    }
    // If neither item is enforced, maintain the original order

    return 0;
  });

  return sortedArray;
};
