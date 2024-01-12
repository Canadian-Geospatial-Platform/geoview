/// <reference types="react" />
import { SliderProps } from '@mui/material';
/**
 * Properties for the Slider
 */
interface TypeSliderProps extends SliderProps {
    min: number;
    max: number;
    value: number | number[];
    onValueDisplay?: (value: number, index: number) => string;
    onValueDisplayAriaLabel?: (value: number, index: number) => string;
}
/**
 * Create a customized Material UI Slider
 *
 * @param {SliderProps} props the properties passed to the Slider element
 * @returns {JSX.Element} the created Slider element
 */
export declare function SliderBase(props: TypeSliderProps): JSX.Element;
export {};
