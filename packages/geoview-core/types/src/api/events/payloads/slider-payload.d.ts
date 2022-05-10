import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare const payloadIsASlider: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is SliderPayload;
export interface SliderTypePayload {
    min: number;
    max: number;
    value: number[] | number;
    activeThumb: number;
}
export declare class SliderPayload extends PayloadBaseClass {
    sliderValues: SliderTypePayload;
    constructor(event: EventStringId, handlerName: string | null, sliderValues: SliderTypePayload);
}
export declare const sliderPayload: (event: EventStringId, handlerName: string | null, sliderValues: SliderTypePayload) => SliderPayload;
