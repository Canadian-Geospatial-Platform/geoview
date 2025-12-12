import type { Dispatch, SetStateAction } from 'react';
import type { TypeButtonPanel } from '@/ui/panel/panel-types';
import type { ButtonPanelType } from './app-bar';

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

export const helpOpenPanelById = (
  buttonId: string,
  setterCallback: Dispatch<SetStateAction<ButtonPanelType>>,
  isFocusTrapped?: boolean
): void => {
  // Open the panel
  helpOpenClosePanelByIdState(buttonId, setterCallback, true, isFocusTrapped);
};

export const helpClosePanelById = (
  mapId: string,
  buttonId: string,
  setterCallback: Dispatch<SetStateAction<Record<string, TypeButtonPanel>>>,
  focusWhenNoElementCallback?: () => void
): void => {
  // Close the panel
  helpOpenClosePanelByIdState(buttonId, setterCallback, false);

  const buttonElement = buttonId && document.getElementById(mapId)?.querySelector(`#${buttonId}`);
  if (buttonElement) {
    // put back focus on calling button
    document.getElementById(buttonId + '-panel-btn')?.focus();
  } else {
    // Nothing to put focus on, callback
    focusWhenNoElementCallback?.();
  }
};

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
