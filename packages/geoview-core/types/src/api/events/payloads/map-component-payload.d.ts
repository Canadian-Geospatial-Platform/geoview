/// <reference types="react" />
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare const payloadIsAMapComponent: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MapComponentPayload;
export declare class MapComponentPayload extends PayloadBaseClass {
    id: string;
    component?: JSX.Element;
    constructor(event: EventStringId, handlerName: string | null, id: string, component?: JSX.Element);
}
export declare const mapComponentPayload: (event: EventStringId, handlerName: string | null, id: string, component?: JSX.Element | undefined) => MapComponentPayload;
