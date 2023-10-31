import { ReactElement } from 'react';
export interface SliderFilterProps {
    range: string[];
    defaultValue: string;
    minAndMax: number[];
    field: string;
    values: number[];
    filtering: boolean;
}
export declare class TimeSliderApi {
    mapId: string;
    /**
     * initialize the time slider api
     *
     * @param mapId the id of the map
     */
    constructor(mapId: string);
    createLayersList(): string[];
    createTimeSliderData(layersList: string[]): {
        [index: string]: SliderFilterProps;
    };
    /**
     * Create a slider panel
     *
     * @return {ReactElement} the time slider react element
     */
    createTimeSlider: () => ReactElement;
}
