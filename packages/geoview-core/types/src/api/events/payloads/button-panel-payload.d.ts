import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
import { TypeButtonPanel } from '../../../core/types/cgpv-types';
export declare const payloadIsAButtonPanel: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is ButtonPanelPayload;
export declare class ButtonPanelPayload extends PayloadBaseClass {
    id: string;
    groupName: string;
    buttonPanel: TypeButtonPanel;
    constructor(event: EventStringId, handlerName: string | null, id: string, groupName: string, buttonPanel: TypeButtonPanel);
}
export declare const buttonPanelPayload: (event: EventStringId, handlerName: string | null, id: string, groupName: string, buttonPanel: TypeButtonPanel) => ButtonPanelPayload;
