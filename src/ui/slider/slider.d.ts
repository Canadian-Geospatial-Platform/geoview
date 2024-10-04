import { CSSProperties, ReactNode } from 'react';
import { Mark } from '@mui/base';
/**
 * Properties for the Slider
 */
type SliderProps = {
    sliderId?: string;
    min: number;
    max: number;
    value: Array<number> | number;
    className?: string;
    style?: CSSProperties;
    onChange?: (value: number | number[], activeThumb: number) => void;
    onChangeCommitted?: (value: number | number[]) => void;
    onValueLabelFormat?: (value: number, index: number) => string;
    onValueDisplayAriaLabel?: (value: number, index: number) => string;
    disabled?: boolean;
    marks?: Mark[];
    orientation?: 'vertical' | 'horizontal';
    step?: number | null;
    size?: 'small' | 'medium';
    track?: 'inverted' | 'normal' | false;
    ariaLabelledby?: string;
    valueLabelFormat?: string | ((value: number, index: number) => ReactNode);
    mapId?: string;
};
/**
 * Create a customized Material UI Slider (https://mui.com/material-ui/api/slider/)
 *
 * @param {TypeSliderProps} props the properties passed to the slider element
 * @returns {JSX.Element} the created Slider element
 */
export declare function Slider(props: SliderProps): JSX.Element;
export {};
