import { Dispatch, SetStateAction } from 'react';
import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { ButtonPanelGroupType } from './app-bar';
export declare const helpFindGroupName: (buttonPanelGroups: ButtonPanelGroupType, buttonId: string) => string | undefined;
export declare const helpOpenClosePanelByIdState: (buttonPanelGroups: ButtonPanelGroupType, buttonId: string, groupName: string | undefined, setterCallback: Dispatch<SetStateAction<ButtonPanelGroupType>>, status: boolean, isFocusTrapped?: boolean) => void;
export declare const helpOpenPanelById: (buttonPanelGroups: ButtonPanelGroupType, buttonId: string, groupName: string | undefined, setterCallback: Dispatch<SetStateAction<ButtonPanelGroupType>>, isFocusTrapped?: boolean) => void;
export declare const helpClosePanelById: (mapId: string, buttonPanelGroups: Record<string, Record<string, TypeButtonPanel>>, buttonId: string, groupName: string | undefined, setterCallback: Dispatch<SetStateAction<Record<string, Record<string, TypeButtonPanel>>>>, focusWhenNoElementCallback?: () => void) => void;
export declare const helpCloseAll: (buttonPanelGroups: ButtonPanelGroupType, setterCallback: Dispatch<SetStateAction<ButtonPanelGroupType>>) => void;
export declare const enforceArrayOrder: (sourceArray: string[], enforce: string[]) => string[];
