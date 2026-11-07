import type { Dispatch, SetStateAction } from 'react';
import type { TypeButtonPanel } from '@/ui/panel/panel-types';
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
export declare const helpOpenClosePanelByIdState: (buttonId: string, setterCallback: Dispatch<SetStateAction<ButtonPanelType>>, status: boolean, isFocusTrapped?: boolean) => void;
/**
 * Opens a panel by id, closing all other panels.
 *
 * @param buttonId - The id of the button panel to open
 * @param setterCallback - State setter for the button panels record
 * @param isFocusTrapped - Optional whether focus should be trapped in the panel
 * @deprecated 2026-10-29 - Not used anymore - delete?
 */
export declare const helpOpenPanelById: (buttonId: string, setterCallback: Dispatch<SetStateAction<ButtonPanelType>>, isFocusTrapped?: boolean) => void;
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
export declare const helpClosePanelById: (mapId: string, buttonId: string, setterCallback: Dispatch<SetStateAction<Record<string, TypeButtonPanel>>>, focusWhenNoElementCallback?: () => void) => void;
/**
 * Closes all open panels.
 *
 * @param buttonPanels - The current button panels state
 * @param setterCallback - State setter for the button panels record
 * @deprecated 2026-10-29 - Not used anymore - delete?
 */
export declare const helpCloseAll: (buttonPanels: ButtonPanelType, setterCallback: Dispatch<SetStateAction<ButtonPanelType>>) => void;
//# sourceMappingURL=app-bar-helper.d.ts.map