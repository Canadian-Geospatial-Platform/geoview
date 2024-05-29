import { Dispatch, SetStateAction } from 'react';
import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { ButtonPanelGroupType, ButtonPanelType } from './app-bar';

export const helpFindGroupName = (buttonPanelGroups: ButtonPanelGroupType, buttonId: string): string | undefined => {
  let groupName: string | undefined;
  Object.entries(buttonPanelGroups).forEach(([buttonPanelGroupName, buttonPanelGroup]) => {
    if (!groupName) {
      if (Object.keys(buttonPanelGroup).includes(buttonId)) {
        // Found it
        groupName = buttonPanelGroupName;
      }
    }
  });
  return groupName;
};

export const helpOpenClosePanelByIdState = (
  buttonPanelGroups: ButtonPanelGroupType,
  buttonId: string,
  groupName: string | undefined,
  setterCallback: Dispatch<SetStateAction<ButtonPanelGroupType>>,
  status: boolean
): void => {
  // Read the group name
  const theGroupName = groupName || helpFindGroupName(buttonPanelGroups, buttonId);
  if (!theGroupName) return;
  // Open or Close it
  setterCallback((prevState) => {
    const panelGroups = {} as ButtonPanelGroupType;
    Object.entries(prevState).forEach(([buttonPanelGroupName, buttonPanelGroup]) => {
      panelGroups[buttonPanelGroupName] = Object.entries(buttonPanelGroup).reduce((acc, [buttonGroupName, buttonGroup]) => {
        acc[buttonGroupName] = {
          ...buttonGroup,
          ...(buttonGroup.panel && { panel: { ...buttonGroup.panel, status: buttonGroupName === buttonId ? status : false } }),
        };

        return acc;
      }, {} as ButtonPanelType);
    });

    return panelGroups;
  });
};

export const helpOpenPanelById = (
  buttonPanelGroups: ButtonPanelGroupType,
  buttonId: string,
  groupName: string | undefined,
  setterCallback: Dispatch<SetStateAction<ButtonPanelGroupType>>
): void => {
  // Read the group name
  const theGroupName = groupName || helpFindGroupName(buttonPanelGroups, buttonId);

  // Open the panel
  helpOpenClosePanelByIdState(buttonPanelGroups, buttonId, theGroupName, setterCallback, true);
};

export const helpClosePanelById = (
  mapId: string,
  buttonPanelGroups: Record<string, Record<string, TypeButtonPanel>>,
  buttonId: string,
  groupName: string | undefined,
  setterCallback: Dispatch<SetStateAction<Record<string, Record<string, TypeButtonPanel>>>>,
  focusWhenNoElementCallback?: () => void
): void => {
  // Read the group name
  const theGroupName = groupName || helpFindGroupName(buttonPanelGroups, buttonId);

  // Close the panel
  helpOpenClosePanelByIdState(buttonPanelGroups, buttonId, theGroupName, setterCallback, false);

  const buttonElement = buttonId && document.getElementById(mapId)?.querySelector(`#${buttonId}`);
  if (buttonElement) {
    // put back focus on calling button
    document.getElementById(buttonId)?.focus();
  } else {
    // Nothing to put focus on, callback
    focusWhenNoElementCallback?.();
  }
};

export const helpCloseAll = (
  buttonPanelGroups: ButtonPanelGroupType,
  setterCallback: Dispatch<SetStateAction<ButtonPanelGroupType>>
): void => {
  const panelGroups = {} as ButtonPanelGroupType;
  Object.entries(buttonPanelGroups).forEach(([buttonPanelGroupName, buttonPanelGroup]) => {
    panelGroups[buttonPanelGroupName] = Object.entries(buttonPanelGroup).reduce((acc, [buttonGroupName, buttonGroup]) => {
      acc[buttonGroupName] = {
        ...buttonGroup,
        ...(buttonGroup.panel && { panel: { ...buttonGroup.panel, status: false } }),
      };
      return acc;
    }, {} as ButtonPanelType);
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
