/// <reference types="react" />
import { SliderFilterProps } from './time-slider-api';
interface TypeTimeSliderProps {
    mapId: string;
    layersList: string[];
    timeSliderData: {
        [index: string]: SliderFilterProps;
    };
}
/**
 * Time slider tab
 *
 * @param {TypeTimeSliderProps} props The properties passed to slider
 * @returns {JSX.Element} the time slider tab
 */
export declare function TimeSlider(props: TypeTimeSliderProps): JSX.Element;
export {};
