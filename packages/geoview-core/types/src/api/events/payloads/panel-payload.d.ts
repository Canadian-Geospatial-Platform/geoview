/// <reference types="react" />
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare type TypeActionButton = {
    id: string;
    title?: string;
    icon?: string | React.ReactElement | Element;
    action?: () => void;
};
export declare const payloadHasAButtonIdAndType: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PanelWithAButtonIdAndTypePayload;
export interface PanelWithAButtonIdAndTypePayload extends PanelPayload {
    buttonId: string;
    type: string;
}
export declare const payloadIsAPanelAction: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PanelAndActionPayload;
export interface PanelAndActionPayload extends PanelPayload {
    buttonId: string;
    actionButton: TypeActionButton;
}
export declare const payloadIsAPanelContent: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PanelAndContentPayload;
export interface PanelAndContentPayload extends PanelPayload {
    buttonId: string;
    content: Element | React.ReactNode;
}
export declare const payloadIsAPanel: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PanelPayload;
export declare class PanelPayload extends PayloadBaseClass {
    constructor(event: EventStringId, handlerName: string | null);
    static withButtonIdAndType: (event: EventStringId, handlerName: string | null, buttonId: string, type: string) => PanelWithAButtonIdAndTypePayload;
    static withButtonIdAndActionButton: (event: EventStringId, handlerName: string | null, buttonId: string, actionButton: TypeActionButton) => PanelAndActionPayload;
    static withButtonIdAndContent: (event: EventStringId, handlerName: string | null, buttonId: string, content: Element | React.ReactNode) => PanelAndContentPayload;
}
export declare const panelPayload: (event: EventStringId, handlerName: string | null) => PanelPayload;
