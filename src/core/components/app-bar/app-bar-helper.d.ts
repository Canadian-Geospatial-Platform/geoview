import { Dispatch, SetStateAction } from 'react';
import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { ButtonPanelType } from './app-bar';
export declare const helpOpenClosePanelByIdState: (buttonId: string, setterCallback: Dispatch<SetStateAction<ButtonPanelType>>, status: boolean, isFocusTrapped?: boolean) => void;
export declare const helpOpenPanelById: (buttonId: string, setterCallback: Dispatch<SetStateAction<ButtonPanelType>>, isFocusTrapped?: boolean) => void;
export declare const helpClosePanelById: (mapId: string, buttonId: string, setterCallback: Dispatch<SetStateAction<Record<string, TypeButtonPanel>>>, focusWhenNoElementCallback?: () => void) => void;
export declare const helpCloseAll: (buttonPanels: ButtonPanelType, setterCallback: Dispatch<SetStateAction<ButtonPanelType>>) => void;
export declare const enforceArrayOrder: (sourceArray: string[], enforce: string[]) => string[];
//# sourceMappingURL=app-bar-helper.d.ts.map